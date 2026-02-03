import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/utils/database';
import { Job, IJob } from '@/schemas/Job';
import { scrapeStartupJobs } from '@/lib/scrapers/startupjobs';
import { scrapeJobsCz } from '@/lib/scrapers/jobscz';
import { analyzeJob, isOllamaAvailable } from '@/lib/ai/ollama';
import { getScrapingConfig } from '@/configureFilters';
import { FE_ERROR_MESSAGES } from '@/constants';


async function processAndSaveJob(
  jobData: Partial<IJob>,
  ollamaAvailable: boolean,
  savedJobs: IJob[],
  skippedJobs: string[]
): Promise<void> {
  try {
    if (jobData.url) {
      const existingJob = await Job.findOne({ url: jobData.url });
      if (existingJob) {
        skippedJobs.push(jobData.title || 'Unknown');
        return;
      }
    }
    
    if (!jobData.title) {
      console.log(`Skipped job - missing title`);
      return;
    }
    
    let aiAnalysis;
    if (ollamaAvailable && jobData.title && jobData.company && jobData.description && jobData.location) {
      try {
        aiAnalysis = await analyzeJob({
          title: jobData.title,
          company: jobData.company,
          description: jobData.description,
          location: jobData.location
        });
      } catch (aiError) {
        console.warn(`${FE_ERROR_MESSAGES.AI_ANALYSIS_FAILED} ${jobData.title}:`, aiError instanceof Error ? aiError.message : FE_ERROR_MESSAGES.UNKNOWN_ERROR);
      }
    }
    
    const job = new Job({
      ...jobData,
      aiAnalysis,
      processed: Boolean(aiAnalysis)
    });
    
    await job.save();
    savedJobs.push(job);
    console.log(`Saved: ${jobData.title} ${aiAnalysis ? '(+AI)' : ''}`);
  } catch (error) {
    console.error(`${FE_ERROR_MESSAGES.JOB_SAVE_FAILED} ${jobData.title}:`, error instanceof Error ? error.message : FE_ERROR_MESSAGES.UNKNOWN_ERROR);
  }
}

export async function POST(request: Request) {
  const savedJobs: IJob[] = [];
  const skippedJobs: string[] = [];
  const allScrapedJobs: Partial<IJob>[] = [];
  
  try {
    const { source, config } = await request.json();
    const scrapingConfig = getScrapingConfig();
    
    await connectDB();
    
    const ollamaAvailable = await isOllamaAvailable();
    if (!ollamaAvailable) {
      console.log(FE_ERROR_MESSAGES.OLLAMA_NOT_AVAILABLE);
    }
    
    if (source === 'startupjobs' || source === 'all') {
      console.log('Scraping StartupJobs...');
      const startupJobsConfig = config?.startupJobs || scrapingConfig.startupJobs;
      const startupJobs = await scrapeStartupJobs(startupJobsConfig, async (jobData) => {
        console.log(`${jobData.title}`);
        allScrapedJobs.push(jobData);
        await processAndSaveJob(jobData, ollamaAvailable, savedJobs, skippedJobs);
      });
      console.log(`StartupJobs scraping complete: ${startupJobs.length} jobs, ${savedJobs.length} saved`);
    }
    
    if (source === 'jobs.cz' || source === 'all') {
      console.log('Scraping Jobs.cz...');
      const jobsCzConfig = config?.jobsCz || scrapingConfig.jobsCz;
      const jobsCzJobs = await scrapeJobsCz(jobsCzConfig, async (jobData) => {
        allScrapedJobs.push(jobData);
        await processAndSaveJob(jobData, ollamaAvailable, savedJobs, skippedJobs);
      });
      console.log(`Jobs.cz scraping complete: ${jobsCzJobs.length} jobs, ${savedJobs.length} saved`);
    }
    
    if (allScrapedJobs.length === 0) {
      return NextResponse.json({
        success: true,
        message: FE_ERROR_MESSAGES.NO_JOBS_FOUND,
        stats: {
          totalScraped: 0,
          newJobs: 0,
          skippedJobs: 0
        }
      });
    }
    
    return NextResponse.json({
      success: true,
      message: `Scraped ${allScrapedJobs.length} jobs, saved ${savedJobs.length} new jobs, skipped ${skippedJobs.length} existing jobs`,
      stats: {
        totalScraped: allScrapedJobs.length,
        newJobs: savedJobs.length,
        skippedJobs: skippedJobs.length
      },
      config: {
        startupJobs: source === 'startupjobs' || source === 'all' ? scrapingConfig.startupJobs : undefined,
        jobsCz: source === 'jobs.cz' || source === 'all' ? scrapingConfig.jobsCz : undefined
      }
    });
    
  } catch (error) {
    console.error(FE_ERROR_MESSAGES.SCRAPING_FAILED, error instanceof Error ? error.message : FE_ERROR_MESSAGES.UNKNOWN_ERROR);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : FE_ERROR_MESSAGES.UNKNOWN_ERROR,
      partialResults: {
        savedJobs: savedJobs.length,
        skippedJobs: skippedJobs.length,
        message: `${savedJobs.length} jobs were saved before interruption`
      }
    }, { status: 500 });
  }
}