import axios from 'axios';
import { IJob } from '@/schemas/Job';
import { API_THROTTLER } from '@/lib/utils/throttlers';
import { StartupJobsConfig, StartupJobsApiResponse, StartupJobsOffer } from '@/types';
import { BROWSER_CONFIG, JOB_SOURCES } from '@/constants';

export async function scrapeStartupJobs(
  config: StartupJobsConfig,
  onJobScraped?: (job: Partial<IJob>) => Promise<void>
): Promise<Partial<IJob>[]> {
  const allJobs: Partial<IJob>[] = [];
  
  try {
    let currentPage = config.page || 1;
    let hasMorePages = true;
    
    while (hasMorePages) {
      await API_THROTTLER.throttle();
      
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('startupOnly', config.startupOnly?.toString() || 'false');
      
      if (config.fields && Array.isArray(config.fields)) {
        config.fields.forEach(field => {
          params.append('fields[]', field);
        });
      }
      
      if (config.locations && Array.isArray(config.locations)) {
        config.locations.forEach(location => {
          params.append('locations[]', location);
        });
      }
      
      if (config.locationPreference && Array.isArray(config.locationPreference)) {
        config.locationPreference.forEach(pref => {
          params.append('locationPreference[]', pref);
        });
      }
      
      if (config.seniority && Array.isArray(config.seniority)) {
        config.seniority.forEach(level => {
          params.append('seniority[]', level);
        });
      }

      const url = `https://core.startupjobs.cz/api/search/offers?${params.toString()}`;
      
      try {
        const response = await axios.get<StartupJobsApiResponse>(url, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': BROWSER_CONFIG.USER_AGENT,
            'Accept-Language': 'en-US,en;q=0.9,cs;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
          },
          timeout: 30000
        });

        const responseData = Array.isArray(response.data) ? response.data : response.data.data;
        
        if (!responseData || !Array.isArray(responseData)) {
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
          const cleanDescription = job.description.cs
            .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
            .replace(/<script[^>]*>.*?<\/script>/gi, '')
            .replace(/<style[^>]*>.*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
          
          const slug = generateSlug(job.title.cs);
          const generatedUrl = `https://www.startupjobs.cz/nabidka/${job.displayId}/${slug}`;
          
          const location = job.location || 
                          (job.locations && job.locations.length > 0 
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
            await onJobScraped(job);
          }
        }
        
        const meta = Array.isArray(response.data) ? null : response.data.meta;
        hasMorePages = meta?.last_page ? currentPage < meta.last_page : false;
        currentPage++;
        
        if (jobs.length > 0) {
          console.log(`Page ${currentPage - 1}: ${jobs.length} jobs (${allJobs.length} total)`);
        }
        if (jobs.length === 0) {
          break;
        }
      } catch (error) {
        if (error instanceof Error && 'response' in error) {
          const axiosError = error as { response?: { status: number } };
          if (axiosError.response?.status && axiosError.response.status >= 400) {
            console.log(`HTTP ${axiosError.response.status} on page ${currentPage}, stopping`);
            break;
          }
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