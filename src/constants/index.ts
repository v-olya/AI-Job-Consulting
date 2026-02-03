import { MY_CONTEXT } from "./context";

export const DATABASE_CONFIG = {
  DEFAULT_URI: 'mongodb://localhost:27017/job-scraper',
  CONNECTION_OPTIONS: {
    bufferCommands: false,
  },
} as const;

export const OLLAMA_CONFIG = {
  DEFAULT_HOST: 'http://localhost:11434',
  DEFAULT_MODEL: 'qwen3-vl:235b-cloud',
  TIMEOUT: {
    REQUEST: 180000, // 3 minutes
    HEADERS: 30000,  // 30 seconds for headers
  },
  RETRY: {
    MAX_ATTEMPTS: 3,
    DELAY: 2000,
  },
} as const;

export const THROTTLING_CONFIG = {
  API_CALLS: 1000,
  PAGE_SCRAPING: 2000,
  DETAIL_SCRAPING: 1500,
} as const;

export const BROWSER_CONFIG = {
  ARGS: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--no-first-run',
    '--no-zygote',
    '--disable-gpu'
  ] as string[],
  USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  VIEWPORT: { width: 1920, height: 1080 },
  LOCALE: 'cs-CZ',
  TIMEZONE: 'Europe/Prague',
} as const;

export const TIMEOUT_CONFIG = {
  NAVIGATION: 30000,
  SELECTOR_WAIT: 15000,
} as const;

export const COMMON_TECHNOLOGIES = [
  'JavaScript', 'TypeScript', 'React', 'Angular', 'Vue', 'Node.js', 'Next.js',
  'Python', 'Java', 'C#', 'PHP', 'Ruby', 'Go', 'Rust', 'Swift', 'Kotlin',
  'HTML', 'CSS', 'SASS', 'SCSS', 'Tailwind', 'Bootstrap',
  'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Docker', 'Kubernetes',
  'AWS', 'Azure', 'GCP', 'Git', 'GraphQL', 'REST', 'API',
  'AI', 'ML', 'LangChain', 'TensorFlow', 'PyTorch'
] as const;

export const JOB_SOURCES = {
  STARTUPJOBS: 'startupjobs',
  JOBS_CZ: 'jobs.cz',
} as const;

export const DEFAULT_LOCATION = 'Not specified';

export const HTML_ENTITIES = {
  '&nbsp;': ' ',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
} as const;

export const SYSTEM_PROMPT = `
## Role AI

Chci, aby ses choval jako nezávislý kariérní poradce, který mě zná.
Máš vlastní analytický rámec a vlastní schopnost číst mezi řádky.
Tvým úkolem je zhodnotit pracovní nabídku a posoudit, zda je pro mě vhodná a jak se pro tuto pozici hodím já.
Neřídíš se mými předsudky ani mými filtry. Používáš svůj vlastní profesionální úsudek.

## My context

${MY_CONTEXT}

## Jak máš posuzovat pracovní nabídku

1) Co říká samotná nabídka:
  - co je explicitně napsané 
  - co je implicitně naznačené 
  - co chybí, ale mělo by tam být 
  - jaký typ člověka by se do role hodil 

2) Porovnání se mnou na základě kontextu:
  - jak by moje zkušenosti zapadly do očekávání 
  - jak by moje osobnost zapadla do prostředí 

3) Nezávislý úsudek:
  - Tvoje hodnocení nesmí být jen odrazem mých preferencí
  - Chci, aby sis zachoval odstup a poskytl mi pohled zvenčí

## Výstupní formát

Vrať POUZE validní JSON objekt s touto strukturou:

{
  "recommendation": "Reagovat" | "Nereagovat" | "Zvážit",
  "body": {
    "summary": "Nezávislé shrnutí nabídky: krátké, s důrazem na důležité",
    "analysis": "Tvá analýza",
    "risks_opportunities": "Rizika a příležitosti"
  },
  "score": 1-10,
  "companyName": "Název společnosti extrahovaný z popisu nabídky (pokud je v textu zmíněn)"
}

DŮLEŽITÉ: Pokud nedokážeš z popisu pozice identifikovat název společnosti, vrať prazdné "companyName".

## Jak máš vyvodit score:

- Nehodnotíš nabídku, ale vhodnost kandidáta pro ni
- 1 = velmi špatná shoda, zásadní nesoulad
- 10 = výborná shoda, silné argumenty pro reakci

## Tipy ohledně recommendation:

- "Zvážit" používej jen tehdy, pokud jsou pro a proti vyrovnané
- Pokud je nabídka výrazně vhodná nebo nevhodná, doporučuj „Reagovat“ nebo „Nereagovat“
- Doporučuj „Reagovat“ jen tehdy, pokud ti to dává smysl

`;

export const FE_ERROR_MESSAGES = {
  UNKNOWN_ERROR: 'Unknown error',
  DATABASE_ACCESS_DENIED: 'Database access not allowed in production',
  DATABASE_ACCESS_DENIED_TITLE: 'Access Denied',
  DATABASE_ACCESS_DENIED_DESCRIPTION: 'Database viewer is not available in production environment for security reasons.',
  DATABASE_LOAD_FAILED: 'Failed to load database data',
  DATABASE_ERROR_TITLE: 'Error',
  AI_PROCESSING_ERROR: 'AI processing error',
  AI_ANALYSIS_FAILED: 'AI analysis failed for',
  JOB_SAVE_FAILED: 'Failed to save',
  OLLAMA_NOT_AVAILABLE: 'Ollama not available - jobs will be saved without AI analysis',
  NO_JOBS_FOUND: 'No jobs found to scrape',
  NO_UNPROCESSED_JOBS: 'No unprocessed jobs found',
  SCRAPING_FAILED: 'Scraping failed',
  INVALID_AI_RESPONSE: 'Invalid AI response format',
  PROCESSING_ERROR_PREFIX: 'Error:',
  LOADING: 'Loading...',
} as const;

export const COMPANY_RESEARCH_PROMPTS = {
  SYSTEM: `Jsi asistent pro výzkum firem. Analyzuj výsledky vyhledávání a extrahuj strukturované informace o společnosti.
Odpověz POUZE validním JSON objektem bez jakéhokoliv dalšího textu, markdown formátování nebo vysvětlení.
Struktura:
{
  "name": "název společnosti",
  "website": "URL nebo null",
  "keyFacts": ["fakt1", "fakt2", "fakt3"]
}
Odpovídej v češtině pouze v hodnotách JSON.`,
  
  USER_TEMPLATE: (companyName: string, searchContext: string) => 
    `Na základě následujících výsledků vyhledávání o "${companyName}" extrahuj a strukturuj informace o společnosti:

${searchContext}

Zaměř se na nejdůležitější obchodní fakta, která by byla relevantní pro uchazeče o zaměstnání.`,

  SCHEMA: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Název společnosti"
      },
      website: {
        type: ["string", "null"],
        description: "Oficiální webová stránka nebo null pokud není nalezena"
      },
      keyFacts: {
        type: "array",
        items: {
          type: "string"
        },
        description: "Array 3-5 klíčových faktů o společnosti",
        minItems: 0,
        maxItems: 10
      }
    },
    required: ["name", "keyFacts"],
    additionalProperties: false
  }
} as const;