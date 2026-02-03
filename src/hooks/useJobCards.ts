import { useState, useEffect, useCallback } from 'react';
import { JobData } from '@/types';

export function useJobCards(limit: number = 5) {
  const [topJobs, setTopJobs] = useState<JobData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  const fetchTopJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError(undefined);
      const response = await fetch(`/api/jobs?processed=true&limit=${limit}`);
      const result = await response.json();
      
      if (result.success && result.jobs) {
        const sortedJobs = result.jobs
          .filter((job: JobData) => job.aiAnalysis?.score)
          .sort((a: JobData, b: JobData) => 
            (b.aiAnalysis?.score || 0) - (a.aiAnalysis?.score || 0)
          )
          .slice(0, limit);
        
        setTopJobs(sortedJobs);
      } else {
        setError('Failed to fetch jobs');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchTopJobs();
  }, [fetchTopJobs]);

  return { topJobs, loading, error, refetch: fetchTopJobs };
}
