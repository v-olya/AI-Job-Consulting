// Mock scraping functions for testing without network connection
import { checkAbort } from '../src/lib/utils/operationAbortRegistry';
import { IJob } from '../src/schemas/Job';

async function mockScrapeJobsCz(
  _config: unknown,
  callback: (jobData: Partial<IJob>) => Promise<void>,
  signal?: AbortSignal
): Promise<Partial<IJob>[]> {
const mockJobs = [
    {
      title: 'Mock Corporate Job 1 - Senior Software Engineer',
      company: 'Mock Corporation A',
      location: 'Prague, Czech Republic',
      salary: '60000 - 80000 CZK/month',
      description: 'Mock description for senior software engineer position.',
      url: 'https://www.jobs.cz/nabidka/11111/senior-software-engineer',
      postedAt: new Date().toISOString(),
      category: 'Technology',
      type: 'Full-time',
      tags: [
        'TypeScript',
        'JavaScript',
        'React'
      ],
      source: 'jobs.cz' as const
    },
    {
      title: 'Mock Corporate Job 2 - DevOps Engineer',
      company: 'Mock Corporation B',
      location: 'Prague, Czech Republic',
      salary: '55000 - 75000 CZK/month',
      description: 'Mock description for DevOps engineer position.',
      url: 'https://www.jobs.cz/nabidka/22222/devops-engineer',
      postedAt: new Date().toISOString(),
      category: 'Technology',
      type: 'Full-time',
      tags: [
        'DevOps',
        'AWS',
        'CI/CD'
      ],
      source: 'jobs.cz' as const
    }
  ];
  
  for (const jobData of mockJobs) {
    checkAbort(signal);
    if (signal?.aborted) {
      throw new Error('Operation cancelled');
    }
    console.log(`Mock scraping: ${jobData.title}`);
    await callback(jobData);
  }
  
  return mockJobs;
}

// Export for testing purposes
export { mockScrapeJobsCz };