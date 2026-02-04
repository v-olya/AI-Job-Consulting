import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/utils/database';
import { Job, IJob } from '@/schemas/Job';
import { scrapeStartupJobs } from '@/lib/scrapers/startupjobs';
import { scrapeJobsCz } from '@/lib/scrapers/jobscz';
import { isOllamaAvailable } from '@/lib/ai/ollama';
import { processJobWithAI } from '@/lib/ai/jobProcessing';
import { getScrapingConfig } from '@/configureFilters';
import { FE_ERROR_MESSAGES } from '@/constants';
import { withRegisteredOperation, type OperationType } from '@/lib/utils/operationAbortRegistry';

const SCRAPING_OPERATION_TYPE: OperationType = 'scraping';

async function processAndSaveJob(
  jobData: Partial<IJob>,
  ollamaAvailable: boolean,
  savedJobs: IJob[],
  skippedJobs: string[],
  signal?: AbortSignal
): Promise<void> {
  if (signal?.aborted) {
    throw new Error('Operation cancelled');
  }
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
    
    let processingResult;
    
    if (ollamaAvailable && jobData.title && jobData.company && jobData.description && jobData.location) {
      processingResult = await processJobWithAI({
        title: jobData.title,
        company: jobData.company,
        description: jobData.description,
        location: jobData.location,
        salary: jobData.salary
      }, signal);
    }
    
    const finalJobData = {
      ...jobData,
      company: processingResult?.updatedCompanyName || jobData.company,
      aiAnalysis: processingResult?.aiAnalysis,
      companyResearch: processingResult?.companyResearch,
      processed: Boolean(processingResult?.aiAnalysis)
    };
    
    const job = new Job(finalJobData);
    await job.save();
    savedJobs.push(job);
    
    const statusParts = [];
    if (processingResult?.aiAnalysis) statusParts.push('+AI');
    if (processingResult?.companyResearch) statusParts.push('+Research');
    const status = statusParts.length ? ` (${statusParts.join(', ')})` : '';
    
    console.log(`Saved: ${jobData.title}${status}`);
  } catch (error) {
    console.error(`${FE_ERROR_MESSAGES.JOB_SAVE_FAILED} ${jobData.title}:`, error instanceof Error ? error.message : FE_ERROR_MESSAGES.UNKNOWN_ERROR);
  }
}

export async function POST(request: Request) {
  const savedJobs: IJob[] = [];
  const skippedJobs: string[] = [];
  const allScrapedJobs: Partial<IJob>[] = [];
  let tabId: string | undefined;
  
  try {
    const { source, config, tabId: requestTabId } = await request.json();
    tabId = requestTabId;
    
    if (!tabId) {
      return NextResponse.json({
        success: false,
        error: 'Tab ID is required'
      }, { status: 400 });
    }

    const maxScrapingTimeMs = 30 * 60 * 1000;

    const operation = await withRegisteredOperation(
      {
        tabId,
        type: SCRAPING_OPERATION_TYPE,
        timeoutMs: maxScrapingTimeMs,
        onTimeout: () => {
          console.log(`Scraping timeout reached (${maxScrapingTimeMs}ms), aborting...`);
        },
      },
      async (signal) => {
        const scrapingConfig = getScrapingConfig();

        await connectDB();

        if (signal.aborted) {
          throw new Error('Operation cancelled');
        }

        const ollamaAvailable = await isOllamaAvailable();
        if (!ollamaAvailable) {
          console.log(FE_ERROR_MESSAGES.OLLAMA_NOT_AVAILABLE);
        }

        if (source === 'startupjobs' || source === 'all') {
          console.log('Scraping StartupJobs...');
          const startupJobsConfig = config?.startupJobs || scrapingConfig.startupJobs;
          const startupJobs = await scrapeStartupJobs(
            startupJobsConfig,
            async (jobData) => {
              if (signal.aborted) {
                throw new Error('Operation cancelled');
              }
              console.log(`${jobData.title}`);
              allScrapedJobs.push(jobData);
              await processAndSaveJob(jobData, ollamaAvailable, savedJobs, skippedJobs, signal);
            },
            signal
          );
          console.log(`StartupJobs scraping complete: ${startupJobs.length} jobs, ${savedJobs.length} saved`);
        }

        if (signal.aborted) {
          throw new Error('Operation cancelled');
        }

        if (source === 'jobs.cz' || source === 'all') {
          console.log('Scraping Jobs.cz...');
          const jobsCzConfig = config?.jobsCz || scrapingConfig.jobsCz;
          const jobsCzJobs = await scrapeJobsCz(
            jobsCzConfig,
            async (jobData) => {
              if (signal.aborted) {
                throw new Error('Operation cancelled');
              }
              allScrapedJobs.push(jobData);
              await processAndSaveJob(jobData, ollamaAvailable, savedJobs, skippedJobs, signal);
            },
            signal
          );
          console.log(`Jobs.cz scraping complete: ${jobsCzJobs.length} jobs, ${savedJobs.length} saved`);
        }

        if (!allScrapedJobs.length) {
          return NextResponse.json({
            success: true,
            message: FE_ERROR_MESSAGES.NO_JOBS_FOUND,
            stats: {
              totalScraped: 0,
              newJobs: 0,
              skippedJobs: 0,
            },
          });
        }

        return NextResponse.json({
          success: true,
          message: `Scraped ${allScrapedJobs.length} jobs, saved ${savedJobs.length} new jobs, skipped ${skippedJobs.length} existing jobs`,
          stats: {
            totalScraped: allScrapedJobs.length,
            newJobs: savedJobs.length,
            skippedJobs: skippedJobs.length,
          },
          config: {
            startupJobs: source === 'startupjobs' || source === 'all' ? scrapingConfig.startupJobs : undefined,
            jobsCz: source === 'jobs.cz' || source === 'all' ? scrapingConfig.jobsCz : undefined,
          },
        });
      }
    );

    if (!operation.ok) {
      return NextResponse.json(
        {
          success: false,
          error: 'A scraping session is already active for this tab',
        },
        { status: 409 }
      );
    }

    return operation.result;
    
  } catch (error) {
    const isCancelled = error instanceof Error && 
      (error.message === 'Operation cancelled' || error.name === 'AbortError');
    
    if (isCancelled) {
      console.log(`Scraping cancelled by user. Saved ${savedJobs.length} jobs before cancellation.`);
      return NextResponse.json({
        success: false,
        cancelled: true,
        message: 'Scraping cancelled'
      });
    }
    
    console.error(FE_ERROR_MESSAGES.SCRAPING_FAILED, error instanceof Error ? error.message : FE_ERROR_MESSAGES.UNKNOWN_ERROR);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : FE_ERROR_MESSAGES.UNKNOWN_ERROR
    }, { status: 500 });
  }
}