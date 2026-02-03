import { Ollama } from 'ollama';
import { OLLAMA_CONFIG, COMPANY_RESEARCH_PROMPTS } from '@/constants';
import { CompanyInfoSchema, companyInfoJsonSchema, type CompanyInfo } from '@/schemas/CompanyInfo';

const ollama = new Ollama({ 
  host: process.env.OLLAMA_HOST || OLLAMA_CONFIG.DEFAULT_HOST,
  headers: process.env.OLLAMA_API_KEY ? {
    'Authorization': `Bearer ${process.env.OLLAMA_API_KEY}`
  } : undefined
});

export async function searchCompanyInfo(companyName: string): Promise<CompanyInfo | null> {
  try {
    const searchResponse = await ollama.webSearch({
      query: `${companyName} company information business profile industry size location`,
      maxResults: 5
    });

    if (!searchResponse?.results?.length) {
      console.warn(`No search results found for company: ${companyName}`);
      return null;
    }

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
    console.error('Company research failed:', error);
    return null;
  }
}

export function generateCompanySummary(companyInfo: CompanyInfo): string {
  const parts = [];
  
  parts.push(`**${companyInfo.name}**`);
  
  if (companyInfo.website) {
    parts.push(`Website: ${companyInfo.website}`);
  }
  
  if (companyInfo.keyFacts?.length) {
    parts.push('\n**Key Facts:**');
    companyInfo.keyFacts.forEach((fact: string) => {
      parts.push(`• ${fact.trim()}`);
    });
  }
  
  return parts.join('\n');
}