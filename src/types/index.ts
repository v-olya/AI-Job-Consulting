export interface StartupJobsConfig {
  page?: number;
  startupOnly?: boolean;
  fields?: string[];
  locations?: string[];
  locationPreference?: string[];
  seniority?: string[];
}

export interface JobsCzConfig {
  queries?: string[];
  locality?: {
    code?: string;
    label?: string;
    coords?: string;
    radius?: number;
  };
}

export interface ScrapingConfig {
  startupJobs: {
    fields?: string[];
    seniority?: string[];
    locationPreference?: string[];
  };
  jobsCz: {
    queries?: string[];
    locality?: {
      label?: string;
      radius?: number;
    };
  };
}

export interface ScrapingResult {
  success: boolean;
  message?: string;
  error?: string;
  stats?: {
    totalScraped: number;
    newJobs: number;
    skippedJobs: number;
    dataFile: string;
  };
}

export interface JobAnalysis {
  summary: string;
  skills: string[];
  seniority: string;
  remote: boolean;
  score: number;
}

export interface StartupJobsApiResponse {
  '@context': string;
  '@id': string;
  '@type': string;
  totalItems: number;
  member: StartupJobsOffer[];
  data: StartupJobsOffer[];
  meta: {
    last_page: number;
    current_page: number;
    total: number;
  };
}

export interface StartupJobsOffer {
  '@id': string;
  '@type': string;
  id: string;
  displayId: number;
  kind: string;
  title: {
    cs: string;
  };
  description: {
    cs: string;
  };
  url: string;
  location: string;
  created_at: string;
  tags: string[];
  salary?: {
    from?: number;
    to?: number;
    currency?: string;
  };
  company: {
    '@type': string;
    '@id': string;
    id: string;
    name: string;
    slug: string;
    logo: string;
    isStartup: boolean;
  };
  contract: string[];
  seniority: string[];
  boostedAt: string;
  isHot: boolean;
  isStartup: boolean;
  benefits: Array<{
    '@type': string;
    '@id': string;
    id: string;
    name: {
      cs: string;
      en: string;
    };
    slug: {
      cs: string;
      en: string;
    };
  }>;
  locations: Array<{
    '@type': string;
    '@id': string;
    id: string;
    point: {
      '@type': string;
      '@id': string;
      lat: number;
      lon: number;
    };
    name: {
      cs: string;
      en?: string;
    };
    type: string;
  }>;
  locationPreference: string[];
  employmentType: string[];
  skills: Array<{
    '@type': string;
    '@id': string;
    id: string;
    name: string;
    slug: string;
    type: string;
  }>;
  languages: Array<{
    '@type': string;
    '@id': string;
    id: string;
    name: {
      cs: string;
      en: string;
    };
    slug: {
      cs: string;
      en: string;
    };
  }>;
  fields: Array<{
    '@type': string;
    '@id': string;
    id: string;
    parent?: {
      cs: string;
      en: string;
    };
    name: {
      cs: string;
      en: string;
    };
    slug: {
      cs: string;
      en: string;
    };
    isMain: boolean;
    isTopped: boolean;
  }>;
  slug: string;
}

export interface Job {
  _id: string;
  title: string;
  company: string;
  location: string;
  source: string;
  url: string;
  aiAnalysis?: JobAnalysis;
}

export interface CachedConnection {
  conn: typeof import('mongoose') | null;
  promise: Promise<typeof import('mongoose')> | null;
}