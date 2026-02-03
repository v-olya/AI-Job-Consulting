import { StartupJobsConfig, JobsCzConfig } from '@/types';

export const SCRAPING_CONFIG = {
  startupJobs: {
    page: 1,
    startupOnly: false,
    fields: [
      // Add your desired job fields here
      // Examples: 'ai-vyvojar', 'data-scientist', 'full-stack-vyvojar'
    ],
    locationPreference: ['hybrid', 'onsite', 'remote'],
    seniority: ['junior', 'medior', 'senior']
  } as StartupJobsConfig,
  
  jobsCz: {
    queries: [
      // Add your search queries here
      // Examples: 'Typescript', 'AI'
    ],
    locality: {
      code: 'R200000',
      label: 'Praha',
      coords: '50.08455,14.41778',
      radius: 50
    },
  } as JobsCzConfig
};

export function getScrapingConfig() {
  const config = { ...SCRAPING_CONFIG };
  
  if (process.env.STARTUPJOBS_FIELDS) {
    config.startupJobs.fields = process.env.STARTUPJOBS_FIELDS.split(',');
  }
  
  if (process.env.JOBSCZ_QUERIES) {
    config.jobsCz.queries = process.env.JOBSCZ_QUERIES.split(',');
  }
  
  return config;
}