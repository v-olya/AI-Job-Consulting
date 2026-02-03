import { chromium } from 'playwright';
import * as cheerio from 'cheerio';
import { Page } from 'playwright';
import { IJob } from '@/schemas/Job';
import { SCRAPING_THROTTLER, DETAIL_THROTTLER } from '@/lib/utils/throttlers';
import { JobsCzConfig } from '@/types';
import { 
  BROWSER_CONFIG, 
  TIMEOUT_CONFIG, 
  JOB_SOURCES, 
  DEFAULT_LOCATION 
} from '@/constants';

export async function scrapeJobsCz(config: JobsCzConfig): Promise<Partial<IJob>[]> {
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
      await SCRAPING_THROTTLER.throttle();
      
      const params = new URLSearchParams();
      
      config.queries?.forEach((query, index) => {
        params.append(`q[${index}]`, query);
      });
      
      if (config.locality) {
        if (config.locality.code) params.append('locality[code]', config.locality.code);
        if (config.locality.label) params.append('locality[label]', config.locality.label);
        if (config.locality.coords) params.append('locality[coords]', config.locality.coords);
        if (config.locality.radius) params.append('locality[radius]', config.locality.radius.toString());
      }
      
      params.append('page', currentPage.toString());
      
      const url = `https://www.jobs.cz/prace/praha/?${params.toString()}`;
      console.log(`Scraping Jobs.cz page ${currentPage}: ${url}`);
      
      try {
        await page.goto(url, { 
          waitUntil: 'networkidle',
          timeout: TIMEOUT_CONFIG.NAVIGATION 
        });
        
        await page.waitForSelector('a[data-jobad-id]', { timeout: TIMEOUT_CONFIG.SELECTOR_WAIT });
      } catch (error) {
        if (error instanceof Error && error.name === 'TimeoutError') {
          console.log(`Timeout or no jobs found on page ${currentPage}, stopping`);
          break;
        }
        
        const pageTitle = await page.title().catch(() => '');
        if (pageTitle.includes('404') || pageTitle.includes('Error') || pageTitle.includes('Chyba')) {
          console.log(`Error page detected on page ${currentPage}, stopping`);
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
      
      if (jobUrls.length === 0) {
        console.log(`No jobs found on page ${currentPage}, stopping`);
        break;
      }
      
      console.log(`Found ${jobUrls.length} job URLs on page ${currentPage}`);
      
      for (const jobInfo of jobUrls) {
        try {
          await DETAIL_THROTTLER.throttle();
          const jobData = await scrapeJobDetail(page, jobInfo.url);
          if (jobData) {
            allJobs.push(jobData);
          }
        } catch (error) {
          console.error(`Error scraping job ${jobInfo.url}:`, error);
        }
      }
      
      currentPage++;
    }
    
    console.log(`Total jobs scraped from Jobs.cz: ${allJobs.length}`);
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
    await page.goto(jobUrl, { 
      waitUntil: 'networkidle',
      timeout: TIMEOUT_CONFIG.NAVIGATION 
    });
    
    const content = await page.content();
    const $ = cheerio.load(content);
    
    const title = $('h1').first().text().trim();
    const company = $('h2').first().text().trim();
    
    const description = $('body').text().trim();
    
    const location = DEFAULT_LOCATION;
    
    if (!title || !company) {
      console.log(`Missing required fields for job: ${jobUrl} (title: ${!!title}, company: ${!!company})`);
      return null;
    }
    
    console.log(`Successfully scraped: ${title} at ${company}`);
    
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
    
  } catch (error) {
    console.error(`Error scraping job detail ${jobUrl}:`, error);
    return null;
  }
}

