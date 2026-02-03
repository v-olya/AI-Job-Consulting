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