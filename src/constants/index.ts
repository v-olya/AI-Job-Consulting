import { MY_CONTEXT } from "./context";

export const DATABASE_CONFIG = {
  DEFAULT_URI: 'mongodb://localhost:27017/job-scraper',
  CONNECTION_OPTIONS: {
    bufferCommands: false,
  },
} as const;

export const OLLAMA_CONFIG = {
  DEFAULT_HOST: 'http://localhost:11434',
  DEFAULT_MODEL: 'llama3.2',
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

export const SENIORITY_LEVELS = {
  JUNIOR: 'junior',
  MEDIOR: 'medior',
  SENIOR: 'senior',
  LEAD: 'lead',
} as const;

export const PROMPT = `
## Role AI

Chci, aby ses choval jako nezávislý kariérní poradce, který mě zná.
Máš vlastní analytický rámec a vlastní schopnost číst mezi řádky.
Tvým úkolem je zhodnotit pracovní nabídku a posoudit, zda je pro mě vhodná a jak se pro tuto pozici hodím já.
Neřídíš se mými předsudky ani mými filtry. Používáš svůj vlastní profesionální úsudek.

## My context

${MY_CONTEXT}

## Jak máš hodnotit pracovní nabídku

A) Co říká samotná nabídka
  - co je explicitně napsané 
  - co je implicitně naznačené 
  - co chybí, ale mělo by tam být 
  - jaký typ člověka by se do role hodil 
  - jaké jsou skryté signály v jazyce, tónu a struktuře 

B) Porovnání se mnou (na základě kontextu)
  - jak by moje zkušenosti zapadly do očekávání 
  - jak by moje osobnost zapadla do prostředí 

C) Nezávislý úsudek
  - Tvoje hodnocení nesmí být jen odrazem mých preferencí.
  - Chci, aby sis zachoval odstup a poskytl mi pohled zvenčí.

## Výstupní formát

Stručné zdůvodnění v této struktuře:

1. ** Celkové doporučení **: Reagovat / Nereagovat / Zvážit. 
2. Nezávislé shrnutí nabídky: krátké, s důrazem na důležité. 
3. Analýza mezi řádky: co z nabídky vyplývá nepřímo. 
4. Rizika a příležitosti.

## Vstup: PRACOVNÍ NABÍDKA

{{jobOffer}}
`;