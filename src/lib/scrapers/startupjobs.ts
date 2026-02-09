import { IJob } from '@schemas/Job';
import { API_THROTTLER } from '@lib/utils/throttlers';
import { stripHtmlTags } from '@lib/utils/textUtils';
import { StartupJobsConfig, StartupJobsApiResponse, StartupJobsOffer } from '@types';
import { BROWSER_CONFIG, JOB_SOURCES } from '@constants';
import { checkAbort } from '@lib/utils/operationAbortRegistry';

export async function scrapeStartupJobs(
  config: StartupJobsConfig,
  onJobScraped?: (job: Partial<IJob>) => Promise<void>,
  signal?: AbortSignal
): Promise<Partial<IJob>[]> {
  const allJobs: Partial<IJob>[] = [];
  
  try {
    let currentPage = 1;
    let maxPages = 1;
    
    while (currentPage <= maxPages) {
      await API_THROTTLER.throttle();
      checkAbort(signal);
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('startupOnly', config.startupOnly?.toString() || 'false');
      
      if (Array.isArray(config.fields)) {
        config.fields.forEach(field => {
          params.append('fields[]', field);
        });
      }
      
      if (Array.isArray(config.locations)) {
        config.locations.forEach(location => {
          params.append('locations[]', location);
        });
      }
      
      if (Array.isArray(config.locationPreference)) {
        config.locationPreference.forEach(pref => {
          params.append('locationPreference[]', pref);
        });
      }
      
      if (Array.isArray(config.seniority)) {
        config.seniority.forEach(level => {
          params.append('seniority[]', level);
        });
      }

      const url = `https://core.startupjobs.cz/api/search/offers?${params.toString()}`;
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        
        if (signal) {
          signal.addEventListener('abort', () => controller.abort());
        }
        
        const response = await fetch(url, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': BROWSER_CONFIG.USER_AGENT,
            'Accept-Language': 'en-US,en;q=0.9,cs;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) {
          if (response.status >= 400) {
            console.log(`HTTP ${response.status} on page ${currentPage}, stopping`);
            break;
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json() as StartupJobsApiResponse;
        const responseData = Array.isArray(data) ? data : data.data;
        
        // Get pagination info from view field if available
        if (responseData?.length) {
          const view = data?.view;
          if (view?.last) {
            const lastPageMatch = view.last.match(/page=(\d+)$/);
            if (lastPageMatch && lastPageMatch[1]) {
              maxPages = parseInt(lastPageMatch[1], 10);
            }
          }
        }
        
        if (!Array.isArray(responseData)) {
          console.log(`Invalid response structure on page ${currentPage}, stopping`);
          break;
        }

        const generateSlug = (title: string): string => {
          return title
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
        };
        
        const jobs = responseData.map((job: StartupJobsOffer) => {
          const cleanDescription = stripHtmlTags(
            job.description.cs
              .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
              .replace(/<script[^>]*>.*?<\/script>/gi, '')
              .replace(/<style[^>]*>.*?<\/style>/gi, '')
          );
          
          const slug = generateSlug(job.title.cs);
          const generatedUrl = `https://www.startupjobs.cz/nabidka/${job.displayId}/${slug}`;
          
          const location = job.location || 
                          (job.locations?.length
                            ? job.locations.map(loc => loc.name.cs).join(', ')
                            : undefined);
          
          return {
            title: job.title.cs,
            company: job.company.name,
            location,
            description: cleanDescription,
            url: job.url || generatedUrl,
            source: JOB_SOURCES.STARTUPJOBS,
            salary: job.salary ? 
              `${job.salary.from || ''}-${job.salary.to || ''} ${job.salary.currency || ''}`.trim() : 
              undefined,
            tags: job.tags,
            postedDate: job.created_at ? new Date(job.created_at) : new Date(),
          };
        });
        
        allJobs.push(...jobs);
        
        if (onJobScraped) {
          for (const job of jobs) {
            checkAbort(signal);
            await onJobScraped(job);
          }
        }
        
        currentPage++;
        
        if (jobs.length) {
          console.log(`Page ${currentPage - 1}: ${jobs.length} jobs (${allJobs.length} total)`);
        } else { 
          break;
        }

      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          console.log(`Request timeout on page ${currentPage}, stopping`);
          break;
        }
        throw error;
      }
    }
    
    return allJobs;
  } catch (error) {
    console.error('Error scraping StartupJobs:', error);
    throw error;
  }
}