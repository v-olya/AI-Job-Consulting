import { OLLAMA_CONFIG, COMPANY_RESEARCH_PROMPTS } from '@/constants';
import { CompanyInfoSchema, companyInfoJsonSchema, type CompanyInfo } from '@/schemas/CompanyInfo';
import { createOllamaClient } from './ollama';
import { checkAbort } from '../utils/operationAbortRegistry';

export async function searchCompanyInfo(companyName: string, signal?: AbortSignal): Promise<CompanyInfo | null> {
  const ollama = createOllamaClient(signal);
  
  try {
    checkAbort(signal);
    
    const searchResponse = await ollama.webSearch({
      query: `${companyName} company information business profile industry size location`,
      maxResults: 5
    });

    if (!searchResponse?.results?.length) {
      console.warn(`No search results found for company: ${companyName}`);
      return null;
    }

    checkAbort(signal);
    
    const searchContext = searchResponse.results
      .map((result, index) => `
        Výsledek ${index + 1}:
        Obsah: ${result.content}
        `)
      .join('\n');

    const userPrompt = COMPANY_RESEARCH_PROMPTS.USER_TEMPLATE(companyName, searchContext);

    const response = await ollama.chat({
      model: OLLAMA_CONFIG.DEFAULT_MODEL,
      messages: [
        { role: 'system', content: COMPANY_RESEARCH_PROMPTS.SYSTEM },
        { role: 'user', content: userPrompt }
      ],
      stream: false,
      format: companyInfoJsonSchema,
      options: {
        temperature: 0.1
      }
    });

    const content = response.message?.content?.trim();
    if (!content) {
      throw new Error('Empty response from LLM');
    }

    const parsedData = JSON.parse(content);
    const companyInfo = CompanyInfoSchema.parse(parsedData);
    
    return companyInfo;
  } catch (error) {
    checkAbort(signal);
    
    if (signal?.aborted && (error instanceof Error && (error.message === 'Operation cancelled' || error.name === 'AbortError'))) {
      throw error;
    }
    console.error('Company research failed:', error);
    return null;
  }
}
