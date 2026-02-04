import { chromium } from 'playwright';
import * as cheerio from 'cheerio';
import { Page } from 'playwright';
import { IJob } from '@/schemas/Job';
import { SCRAPING_THROTTLER, DETAIL_THROTTLER } from '@/lib/utils/throttlers';
import { stripHtmlAndPreserveSpaces } from '@/lib/utils/textUtils';
import { JobsCzConfig } from '@/types';
import { 
  BROWSER_CONFIG, 
  TIMEOUT_CONFIG, 
  JOB_SOURCES, 
  DEFAULT_LOCATION 
} from '@/constants';

export async function scrapeJobsCz(
  config: JobsCzConfig,
  onJobScraped?: (job: Partial<IJob>) => Promise<void>,
  signal?: AbortSignal
): Promise<Partial<IJob>[]> {
  const browser = await chromium.launch({ 
    headless: true,
    args: BROWSER_CONFIG.ARGS
  });
  
  const context = await browser.newContext({
    userAgent: BROWSER_CONFIG.USER_AGENT,
    viewport: BROWSER_CONFIG.VIEWPORT,
    locale: BROWSER_CONFIG.LOCALE,
    timezoneId: BROWSER_CONFIG.TIMEZONE
  });
  
  const page = await context.newPage();
  
  try {
    const allJobs: Partial<IJob>[] = [];
    let currentPage = 1;
    
    while (true) {
      if (signal?.aborted) {
        throw new Error('Operation cancelled');
      }
      
      await SCRAPING_THROTTLER.throttle();
      
      const params = new URLSearchParams();
      
      if (config.queries && Array.isArray(config.queries)) {
        config.queries.forEach((query, index) => {
          params.append(`q[${index}]`, query);
        });
      }
      
      if (config.locality) {
        if (config.locality.code) params.append('locality[code]', config.locality.code);
        if (config.locality.label) params.append('locality[label]', config.locality.label);
        if (config.locality.coords) params.append('locality[coords]', config.locality.coords);
        if (config.locality.radius) params.append('locality[radius]', config.locality.radius.toString());
      }
      
      params.append('page', currentPage.toString());
      
      const url = `https://www.jobs.cz/prace/praha/?${params.toString()}`;
      
      try {
        await page.goto(url, { 
          waitUntil: 'networkidle',
          timeout: TIMEOUT_CONFIG.NAVIGATION 
        });
        
        await page.waitForSelector('a[data-jobad-id]', { timeout: TIMEOUT_CONFIG.SELECTOR_WAIT });
      } catch (error) {
        if (error instanceof Error && error.name === 'TimeoutError') {
          console.log(`Page ${currentPage}: timeout, stopping`);
          break;
        }
        
        const pageTitle = await page.title().catch(() => '');
        if (pageTitle.includes('404') || pageTitle.includes('Error') || pageTitle.includes('Chyba')) {
          console.log(`Page ${currentPage}: error page detected, stopping`);
          break;
        }
        
        throw error;
      }
      
      const jobUrls = await page.$$eval('a[data-jobad-id]', (links) => 
        links.map(link => ({
          url: (link as HTMLAnchorElement).href,
          id: link.getAttribute('data-jobad-id')
        }))
      );
      
      if (!jobUrls.length) {
        break;
      }
      
      console.log(`Page ${currentPage}: ${jobUrls.length} jobs found`);
      
      for (let i = 0; i < jobUrls.length; i++) {
        if (signal?.aborted) {
          throw new Error('Operation cancelled');
        }
        
        const jobInfo = jobUrls[i];
        try {
          await DETAIL_THROTTLER.throttle();
          const jobData = await scrapeJobDetail(page, jobInfo.url);
          if (jobData) {
            allJobs.push(jobData);
            console.log(`✓ Scraped: ${jobData.title} at ${jobData.company}`);
            
            if (onJobScraped) {
              await onJobScraped(jobData);
            }
          }
        } catch (error) {
          console.error(`✗ Error scraping job ${i + 1}/${jobUrls.length}:`, error instanceof Error ? error.message : 'Unknown error');
        }
        
        if (i < jobUrls.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      currentPage++;
    }
    
    return allJobs;
    
  } catch (error) {
    console.error('Error scraping Jobs.cz:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

async function scrapeJobDetail(page: Page, jobUrl: string): Promise<Partial<IJob> | null> {
  try {
    const timeoutPromise = new Promise<null>((_, reject) => {
      setTimeout(() => reject(new Error('Job detail scraping timeout')), 20000);
    });
    
    const scrapePromise = (async () => {
      await page.goto(jobUrl, { 
        waitUntil: 'domcontentloaded',
        timeout: 15000
      });
      
      const content = await page.content();
      const $ = cheerio.load(content);
      
      const title = $('h1').first().text().trim();
      if (!title) {
        return null;
      }
      
      const company = $('.JobDescriptionHeading').siblings('.IconWithText').find('p').text().trim() || '';
      const descriptionElement = $('[data-test="jd-body-richtext"]');
      const description = descriptionElement?.text().trim() ?? stripHtmlAndPreserveSpaces($('body').html() || '');;

      const locationSelectors = [
        '[data-test="jd-info-location"]',
        '[class*="location"]'
      ];
      
      let location = DEFAULT_LOCATION;
      for (const selector of locationSelectors) {
        const loc = $(selector)?.first().text().trim();
        if (loc) {
          location = loc;
          break;
        }
      }
      

      
      return {
        title,
        company,
        location,
        description,
        url: jobUrl,
        source: JOB_SOURCES.JOBS_CZ,
        salary: undefined,
        tags: [],
        postedDate: new Date(),
      };
    })();
    
    return await Promise.race([scrapePromise, timeoutPromise]);
    
  } catch (error) {
    console.error(`Failed to scrape job detail:`, error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

