import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/utils/database';
import { Job } from '@/schemas/Job';
import { processJobWithAI } from '@/lib/ai/jobProcessing';
import { FE_ERROR_MESSAGES } from '@/constants';

export async function POST(request: Request) {
  try {
    const { limit = 50 } = await request.json();
    
    await connectDB();
    
    const unprocessedJobs = await Job.find({ 
      $or: [
        { processed: false },
        { processed: { $exists: false } },
        { aiAnalysis: { $exists: false } },
        { aiAnalysis: null }
      ]
    }).limit(limit);
    
    if (!unprocessedJobs.length) {
      return NextResponse.json({
        success: true,
        message: FE_ERROR_MESSAGES.NO_UNPROCESSED_JOBS,
        processed: 0,
        failed: 0
      });
    }
    
    let processedCount = 0;
    let failedCount = 0;
    let companyResearchCount = 0;
    
    console.log(`Starting AI processing for ${unprocessedJobs.length} jobs`);
    
    for (const job of unprocessedJobs) {
      try {
        const processingResult = await processJobWithAI({
          title: job.title,
          company: job.company,
          description: job.description,
          location: job.location,
          salary: job.salary
        });
        
        if (processingResult.aiAnalysis) {
          const updateData: Record<string, unknown> = {
            aiAnalysis: processingResult.aiAnalysis,
            processed: true
          };

          if (processingResult.updatedCompanyName) {
            updateData.company = processingResult.updatedCompanyName;
          }

          if (processingResult.companyResearch) {
            updateData.companyResearch = processingResult.companyResearch;
            companyResearchCount++;
          }
          
          await Job.findByIdAndUpdate(job._id, updateData);
          
          processedCount++;
          console.log(`Successfully processed: ${job.title}`);
        } else {
          console.log(`${FE_ERROR_MESSAGES.AI_ANALYSIS_FAILED}: ${job.title}`);
          failedCount++;
        }
        
      } catch (error) {
        console.error(`Failed to process job ${job.title}:`, error);
        failedCount++;
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Processed ${processedCount} jobs, ${failedCount} failed, ${companyResearchCount} company research completed`,
      processed: processedCount,
      failed: failedCount,
      companyResearchCount,
      total: unprocessedJobs.length
    });
    
  } catch (error) {
    console.error(FE_ERROR_MESSAGES.AI_PROCESSING_ERROR, error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : FE_ERROR_MESSAGES.UNKNOWN_ERROR
      },
      { status: 500 }
    );
  }
}