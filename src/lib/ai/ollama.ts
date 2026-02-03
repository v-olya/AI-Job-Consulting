import { Ollama } from 'ollama';
import { OLLAMA_CONFIG, SYSTEM_PROMPT } from '@/constants';
import { JobAnalysisSchema, jobAnalysisJsonSchema, type JobAnalysis } from '@/schemas/JobAnalysis';
import { analyzeError, getErrorDescription } from '@/lib/utils/errorUtils';

const ollama = new Ollama({ 
  host: process.env.OLLAMA_HOST || OLLAMA_CONFIG.DEFAULT_HOST,
  fetch: (url, options) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), OLLAMA_CONFIG.TIMEOUT.REQUEST);
    
    return fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        ...options?.headers,
        'Connection': 'keep-alive',
      },
    }).finally(() => {
      clearTimeout(timeoutId);
    });
  }
});

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function isOllamaAvailable(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout for availability check
    
    await ollama.chat({
      model: OLLAMA_CONFIG.DEFAULT_MODEL,
      messages: [{ role: 'user', content: 'test' }],
      stream: false,
      options: {
        num_predict: 1,
      }
    });
    
    clearTimeout(timeoutId);
    return true;
  } catch (error) {
    console.log(`Ollama model ${OLLAMA_CONFIG.DEFAULT_MODEL} not available or not running:`, error);
    return false;
  }
}

export async function analyzeJob(jobData: {
  title: string;
  company: string;
  description: string;
  location: string;
  salary?: string;
}): Promise<JobAnalysis | undefined> {
  const jobOffer = `Název pozice: ${jobData.title}
Společnost: ${jobData.company}
Lokace: ${jobData.location}
${jobData.salary ? `Plat: ${jobData.salary}` : ''}

Popis pozice:
${jobData.description}`;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= OLLAMA_CONFIG.RETRY.MAX_ATTEMPTS; attempt++) {
    try {
      console.log(`Analyzing job "${jobData.title}" (attempt ${attempt}/${OLLAMA_CONFIG.RETRY.MAX_ATTEMPTS})`);
      
      const response = await ollama.chat({
        model: OLLAMA_CONFIG.DEFAULT_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: jobOffer }
        ],
        stream: false,
        format: jobAnalysisJsonSchema,
        options: {
          temperature: 0.3,
          top_p: 0.9,
        }
      });

      const content = response.message?.content?.trim();
      if (!content) {
        throw new Error('Empty response from LLM');
      }

      const parsedData = JSON.parse(content);
      const analysis = JobAnalysisSchema.parse(parsedData);
      
      console.log(`Successfully analyzed job on attempt ${attempt}`);
      return analysis;
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      const errorAnalysis = analyzeError(lastError);
      const errorDescription = getErrorDescription(errorAnalysis);
      
      console.warn(`Attempt ${attempt} failed for job "${jobData.title}":`, {
        error: lastError.message,
        type: errorAnalysis.errorType,
        retryable: errorAnalysis.isRetryable
      });
      
      if (!errorAnalysis.isRetryable) {
        console.error(`Non-retryable error for job "${jobData.title}": ${errorDescription}`);
        break;
      }
      
      if (attempt < OLLAMA_CONFIG.RETRY.MAX_ATTEMPTS) {
        const delayMs = OLLAMA_CONFIG.RETRY.DELAY * attempt;
        console.log(`Waiting ${delayMs}ms before retry...`);
        await delay(delayMs);
      }
    }
  }
  
  console.error(`Failed to analyze job "${jobData.title}" after ${OLLAMA_CONFIG.RETRY.MAX_ATTEMPTS} attempts:`, lastError?.message);
  return undefined;
}