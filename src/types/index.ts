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

import type { JobAnalysis } from '@/schemas/JobAnalysis';
import type { CompanyInfo } from '@/schemas/CompanyInfo';

// Core Job interface - plain object without Mongoose Document methods
export interface Job {
  _id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  source: 'startupjobs' | 'jobs.cz';
  salary?: string;
  tags: string[];
  postedDate: Date | string;
  scrapedAt: Date | string;
  processed: boolean;
  aiAnalysis?: JobAnalysis;
}

// Database response format for API endpoints
export interface JobData extends Omit<Job, 'postedDate' | 'scrapedAt'> {
  postedDate: string;
  scrapedAt: string;
  companyResearch?: CompanyInfo;
}

// Database query and pagination interfaces
export interface DatabaseData {
  jobs: JobData[];
  pagination: {
    total: number;
    limit: number;
    skip: number;
    hasMore: boolean;
  };
  statistics: {
    total: number;
    processed: number;
    unprocessed: number;
    sources: string[];
    avgScore: number;
  };
  sourceBreakdown: Array<{ _id: string; count: number }>;
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

export interface CachedConnection {
  conn: typeof import('mongoose') | null;
  promise: Promise<typeof import('mongoose')> | null;
}

export interface CompanyResearchResponse {
  success: boolean;
  data?: {
    companyInfo: CompanyInfo;
    summary: string;
  };
  error?: string;
}