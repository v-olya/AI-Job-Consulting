import { analyzeJob } from '@/lib/ai/ollama';
import { searchCompanyInfo } from '@/lib/ai/companyResearch';
import { JobAnalysisSchema, type JobAnalysis } from '@/schemas/JobAnalysis';
import { CompanyInfoSchema, type CompanyInfo } from '@/schemas/CompanyInfo';
import { FE_ERROR_MESSAGES } from '@/constants';

export interface JobProcessingInput {
  title: string;
  company: string;
  description: string;
  location: string;
  salary?: string;
}

export interface JobProcessingResult {
  aiAnalysis?: JobAnalysis;
  companyResearch?: CompanyInfo;
  updatedCompanyName?: string;
}

export async function processJobWithAI(
  jobData: JobProcessingInput,
  signal?: AbortSignal
): Promise<JobProcessingResult> {
  const result: JobProcessingResult = {};

  try {
    if (signal?.aborted) {
      throw new Error('Operation cancelled');
    }

    const aiAnalysis = await analyzeJob({
      title: jobData.title,
      company: jobData.company,
      description: jobData.description,
      location: jobData.location,
      salary: jobData.salary
    });

    if (aiAnalysis) {
      const validatedAnalysis = JobAnalysisSchema.parse(aiAnalysis);
      result.aiAnalysis = validatedAnalysis;

      if (!jobData.company?.trim() && validatedAnalysis.companyName) {
        result.updatedCompanyName = validatedAnalysis.companyName;
        console.log(`Company name detected by AI: ${result.updatedCompanyName}`);
      }

      if (validatedAnalysis.recommendation === 'Reagovat' || validatedAnalysis.recommendation === 'Zvážit') {
        if (signal?.aborted) {
          throw new Error('Operation cancelled');
        }

        const companyNameForResearch = result.updatedCompanyName || jobData.company;

        if (companyNameForResearch && companyNameForResearch !== 'noName') {
          console.log(`Performing company research for: ${companyNameForResearch}`);
          const companyInfo = await searchCompanyInfo(companyNameForResearch);
          if (companyInfo) {
            result.companyResearch = CompanyInfoSchema.parse(companyInfo);
            console.log(`Company research completed for: ${companyNameForResearch}`);
          }
        }
      }
    } else {
      console.warn(`AI analysis returned undefined for: ${jobData.title}`);
    }
  } catch (aiError) {
    const errorMessage = aiError instanceof Error ? aiError.message : FE_ERROR_MESSAGES.UNKNOWN_ERROR;
    console.error(`${FE_ERROR_MESSAGES.AI_ANALYSIS_FAILED} ${jobData.title}:`, errorMessage);
  }

  return result;
}