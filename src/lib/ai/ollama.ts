import { Ollama } from 'ollama';
import { OLLAMA_CONFIG, SYSTEM_PROMPT } from '@/constants';
import { JobAnalysisSchema, jobAnalysisJsonSchema, type JobAnalysis } from '@/schemas/JobAnalysis';
import { analyzeError, getErrorDescription } from '@/lib/utils/errorUtils';
import { Throttler, delay } from '@/lib/utils/throttlers';

const AI_THROTTLER = new Throttler(1000);

export function createOllamaClient(signal?: AbortSignal) {
  return new Ollama({
    host: process.env.OLLAMA_HOST || OLLAMA_CONFIG.DEFAULT_HOST,
    fetch: (url, options) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), OLLAMA_CONFIG.TIMEOUT.REQUEST);

      const headers: Record<string, string> = {
        Connection: 'keep-alive',
      };

      if (process.env.OLLAMA_API_KEY) {
        headers.Authorization = `Bearer ${process.env.OLLAMA_API_KEY}`;
      }

      if (signal) {
        if (signal.aborted) {
          controller.abort();
        } else {
          signal.addEventListener('abort', () => controller.abort(), { once: true });
        }
      }

      return fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          ...options?.headers,
          ...headers,
        },
      }).finally(() => {
        clearTimeout(timeoutId);
      });
    },
  });
}

export const defaultOllamaClient = createOllamaClient();

export async function isOllamaAvailable(): Promise<boolean> {
  try {
    const ollama = createOllamaClient();
    
    await ollama.chat({
      model: OLLAMA_CONFIG.DEFAULT_MODEL,
      messages: [{ role: 'user', content: 'test' }],
      stream: false,
      options: {
        num_predict: 1,
      }
    });
    
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
}, signal?: AbortSignal): Promise<JobAnalysis | undefined> {
  const ollama = createOllamaClient(signal);
  const jobOffer = `Název pozice: ${jobData.title}
Společnost: ${jobData.company}
Lokace: ${jobData.location}
${jobData.salary ? `Plat: ${jobData.salary}` : ''}

Popis pozice:
${jobData.description}`;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= OLLAMA_CONFIG.RETRY.MAX_ATTEMPTS; attempt++) {
    try {
      if (signal?.aborted) {
        throw new Error('Operation cancelled');
      }
      
      await AI_THROTTLER.throttle();
      
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
      
      if (signal?.aborted && (lastError.message === 'Operation cancelled' || lastError.name === 'AbortError')) {
        throw lastError;
      }
      
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
        await delay(delayMs, signal);
      }
    }
  }
  
  console.error(`Failed to analyze job "${jobData.title}" after ${OLLAMA_CONFIG.RETRY.MAX_ATTEMPTS} attempts:`, lastError?.message);
  return undefined;
}