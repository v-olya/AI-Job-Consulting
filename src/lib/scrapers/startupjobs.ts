import axios from 'axios';
import { IJob } from '@/schemas/Job';
import { API_THROTTLER } from '@/lib/utils/throttlers';
import { StartupJobsConfig, StartupJobsApiResponse, StartupJobsOffer } from '@/types';
import { BROWSER_CONFIG, JOB_SOURCES } from '@/constants';

export async function scrapeStartupJobs(config: StartupJobsConfig): Promise<Partial<IJob>[]> {
  const allJobs: Partial<IJob>[] = [];
  
  try {
    let currentPage = config.page || 1;
    let hasMorePages = true;
    
    while (hasMorePages) {
      await API_THROTTLER.throttle();
      
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('startupOnly', config.startupOnly?.toString() || 'false');
      
      config.fields?.forEach(field => {
        params.append('fields[]', field);
      });
      
      config.locations?.forEach(location => {
        params.append('locations[]', location);
      });
      
      config.locationPreference?.forEach(pref => {
        params.append('locationPreference[]', pref);
      });
      
      config.seniority?.forEach(level => {
        params.append('seniority[]', level);
      });

      const url = `https://core.startupjobs.cz/api/search/offers?${params.toString()}`;
      console.log(`Fetching StartupJobs page ${currentPage}: ${url}`);
      
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

        const jobs = response.data.data.map((job: StartupJobsOffer) => ({
          title: job.title.cs,
          company: job.company.name,
          location: job.location,
          description: job.description.cs,
          url: job.url,
          source: JOB_SOURCES.STARTUPJOBS,
          salary: job.salary ? 
            `${job.salary.from || ''}-${job.salary.to || ''} ${job.salary.currency || ''}`.trim() : 
            undefined,
          tags: job.tags,
          postedDate: new Date(job.created_at),
        }));
        
        allJobs.push(...jobs);
        
        hasMorePages = currentPage < response.data.meta.last_page;
        currentPage++;
        
        console.log(`Page ${currentPage - 1}: Found ${jobs.length} jobs, Total so far: ${allJobs.length}`);
        
        if (jobs.length === 0) {
          console.log('No jobs found on current page, stopping');
          break;
        }
      } catch (error) {
        if (error instanceof Error && 'response' in error) {
          const axiosError = error as { response?: { status: number } };
          if (axiosError.response?.status && axiosError.response.status >= 400) {
            console.log(`Got ${axiosError.response.status} error on page ${currentPage}, stopping pagination`);
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