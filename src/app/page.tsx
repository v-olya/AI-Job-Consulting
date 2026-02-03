'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ScrapingConfig, ScrapingResult } from '@/types';
import { JobCard } from '@/components/JobCard';
import { ConfigSection } from '@/components/ConfigSection';
import { ScrapeResultAlert } from '@/components/ScrapeResultAlert';
import { OutlineButton } from '@/components/buttons/OutlineButton';
import { GradientButton } from '@/components/buttons/GradientButton';
import { useJobCards } from '@/hooks/useJobCards';

export default function Home() {
  const router = useRouter();
  const [config, setConfig] = useState<ScrapingConfig>();
  const [scrapingStates, setScrapingStates] = useState<Record<string, boolean>>({
    startupjobs: false,
    'jobs.cz': false,
    all: false
  });
  const [lastScrapeResult, setLastScrapeResult] = useState<ScrapingResult>();
  const [displayLimit, setDisplayLimit] = useState(5);
  const { topJobs, loading: loadingJobs, refetch: refetchTopJobs } = useJobCards(50);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/config');
      const result = await response.json();
      if (result.success) {
        setConfig(result.config);
      }
    } catch (error) {
      console.error('Error fetching config:', error);
    }
  };

  const handleScrape = async (source: string) => {
    setScrapingStates(prev => ({ ...prev, [source]: true }));
    setLastScrapeResult(undefined);
    
    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source })
      });
      
      const result = await response.json();
      setLastScrapeResult(result);
      
      if (result.success) {
        refetchTopJobs();
      }
      
    } catch (error) {
      setLastScrapeResult({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setScrapingStates(prev => ({ ...prev, [source]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <header className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Job Consultant
          </h1>
          <p className="text-gray-600">Discover and analyze job opportunities with AI-powered insights</p>
        </header>
        
        {config && <ConfigSection config={config} />}
        
        <div className="mb-8 flex flex-wrap gap-4">
          <GradientButton
            onClick={() => handleScrape('startupjobs')}
            disabled={scrapingStates.startupjobs}
            variant="blue"
          >
            {scrapingStates.startupjobs ? '⏳ Scraping...' : '🚀 Scrape StartupJobs'}
          </GradientButton>
          
          <GradientButton
            onClick={() => handleScrape('jobs.cz')}
            disabled={scrapingStates['jobs.cz']}
            variant="green"
          >
            {scrapingStates['jobs.cz'] ? '⏳ Scraping...' : '🔍 Scrape Jobs.cz'}
          </GradientButton>
          
          <GradientButton
            onClick={() => handleScrape('all')}
            disabled={scrapingStates.all}
            variant="purple"
          >
            {scrapingStates.all ? '⏳ Scraping...' : '⚡ Scrape All'}
          </GradientButton>
        </div>

        {lastScrapeResult && (
          <ScrapeResultAlert 
            result={lastScrapeResult} 
            onClose={() => setLastScrapeResult(undefined)} 
          />
        )}

        <section className="mt-12">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-800">Top AI-Rated Jobs</h2>
              <p className="text-gray-600 text-sm mt-1">Highest scoring opportunities based on AI analysis</p>
            </div>
            <div className="flex gap-3">
              <OutlineButton onClick={() => router.push('/database')}>
                Explore Database
              </OutlineButton>
            </div>
          </div>

          {loadingJobs ? (
            <div className="text-center py-16">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="text-gray-500 mt-4">Loading top jobs...</p>
            </div>
          ) : topJobs.length > 0 ? (
            <>
              <div className="space-y-4">
                {topJobs.slice(0, displayLimit).map((job, index) => (
                  <div key={job._id} className="relative">
                    <div className="absolute -left-4 top-4 bg-gradient-to-br from-blue-500 to-purple-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-lg">
                      {index + 1}
                    </div>
                    <JobCard job={job} />
                  </div>
                ))}
              </div>
              {displayLimit < topJobs.length && (
                <div className="mt-6 text-center">
                  <OutlineButton onClick={() => setDisplayLimit(prev => prev + 5)}>
                    Show More ({topJobs.length - displayLimit} remaining)
                  </OutlineButton>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-gray-600 text-lg font-medium">No processed jobs found yet</p>
              <p className="text-gray-500 text-sm mt-2">
                Scrape some jobs and process them with AI to see top-rated positions here
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
