import { analyzeJob } from '@lib/ai/ollama';
import { searchCompanyInfo } from '@lib/ai/companyResearch';
import { JobAnalysisSchema, type JobAnalysis } from '@schemas/JobAnalysis';
import { CompanyInfoSchema, type CompanyInfo } from '@schemas/CompanyInfo';
import { FE_ERROR_MESSAGES } from '@constants';
import { checkAbort } from '@lib/utils/operationAbortRegistry';
import { sendEmail } from '@/lib/email';

interface JobProcessingInput {
  title: string;
  company: string;
  description: string;
  location: string;
  salary?: string;
}

interface JobProcessingResult {
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
    checkAbort(signal);
    
    const aiAnalysis = await analyzeJob({
      title: jobData.title,
      company: jobData.company,
      description: jobData.description,
      location: jobData.location,
      salary: jobData.salary
    }, signal);

    if (aiAnalysis) {
      const validatedAnalysis = JobAnalysisSchema.parse(aiAnalysis);
      result.aiAnalysis = validatedAnalysis;

      if (!jobData.company?.trim() && validatedAnalysis.companyName) {
        result.updatedCompanyName = validatedAnalysis.companyName;
        console.log(`Company name detected by AI: ${result.updatedCompanyName}`);
      }

      if (validatedAnalysis.recommendation === 'Reagovat' || validatedAnalysis.recommendation === 'Zvážit') {
        checkAbort(signal);

        const companyNameForResearch = result.updatedCompanyName || jobData.company;

        if (companyNameForResearch && companyNameForResearch !== 'noName') {
          console.log(`Performing company research for: ${companyNameForResearch}`);
          const companyInfo = await searchCompanyInfo(companyNameForResearch, signal);
          if (companyInfo) {
            result.companyResearch = CompanyInfoSchema.parse(companyInfo);
            console.log(`Company research completed for: ${companyNameForResearch}`);
          }
        }

        // Send email notification
        if (validatedAnalysis.recommendation === 'Reagovat') {
          try {
            const emailResult = await sendEmail({
              subject: `🚀 New Job Opportunity: ${jobData.title} at ${result.updatedCompanyName || jobData.company}`,
              text: `AI recommends applying for this job!\n\n` +
                    `Role: ${jobData.title}\n` +
                    `Company: ${result.updatedCompanyName || jobData.company}\n` +
                    `Location: ${jobData.location}\n` +
                    `Salary: ${jobData.salary || 'N/A'}\n\n` +
                    `AI Analysis: ${validatedAnalysis.body.analysis || 'No analysis provided.'}`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                  <h2 style="color: #2c3e50;">🚀 AI Recommendation: Apply Now!</h2>
                  <p>A new job matching your criteria has been analyzed.</p>
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 8px; font-weight: bold;">Role:</td>
                      <td style="padding: 8px;">${jobData.title}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px; font-weight: bold;">Company:</td>
                      <td style="padding: 8px;">${result.updatedCompanyName || jobData.company}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px; font-weight: bold;">Location:</td>
                      <td style="padding: 8px;">${jobData.location}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px; font-weight: bold;">Salary:</td>
                      <td style="padding: 8px;">${jobData.salary || 'N/A'}</td>
                    </tr>
                  </table>
                  <h3 style="color: #2c3e50; margin-top: 20px;">AI Analysis</h3>
                  <p style="background-color: #f9f9f9; padding: 15px; border-left: 5px solid #3498db;">
                    ${validatedAnalysis.body.analysis || 'No analysis provided.'}
                  </p>
                </div>
              `
            });
            if (emailResult.accepted) {
              console.log(`Notification email sent for: ${jobData.title}`);
            } else {
              console.error('Notification email rejected. ', emailResult.rejected);
            }
          } catch {
            // ignore, error is logged by the email sender
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