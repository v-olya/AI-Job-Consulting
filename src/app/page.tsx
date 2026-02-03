'use client';

import { useState, useEffect } from 'react';
import { ScrapingConfig, ScrapingResult } from '@/types';

export default function Home() {
  const [config, setConfig] = useState<ScrapingConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [lastScrapeResult, setLastScrapeResult] = useState<ScrapingResult | null>(null);

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
    setScraping(true);
    setLastScrapeResult(null);
    
    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source })
      });
      
      const result = await response.json();
      setLastScrapeResult(result);
      
    } catch (error) {
      setLastScrapeResult({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setScraping(false);
    }
  };


  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Job Scraper Dashboard</h1>
      
      {/* Configuration Display */}
      {config && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-3">Current Configuration</h2>
          <div className="grid md:grid-cols-2 gap-6 text-sm">
            <div className="space-y-3">
              <h3 className="font-medium text-blue-700 border-b border-blue-200 pb-1">StartupJobs.cz</h3>
              <div>
                <span className="font-medium text-gray-700">Fields:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {config.startupJobs.fields?.map((field: string, idx: number) => (
                    <span key={idx} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                      {field}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex gap-4">
                  <div>
                    <span className="font-medium text-gray-700">Seniority:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {config.startupJobs.seniority?.map((level: string, idx: number) => (
                        <span key={idx} className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">
                          {level}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Work Type:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {config.startupJobs.locationPreference?.map((pref: string, idx: number) => (
                        <span key={idx} className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                          {pref}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="font-medium text-green-700 border-b border-green-200 pb-1">Jobs.cz</h3>
              <div>
                <span className="font-medium text-gray-700">Search Terms:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {config.jobsCz.queries?.map((query: string, idx: number) => (
                    <span key={idx} className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">
                      {query}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <span className="font-medium text-gray-700">Location:</span>
                <span className="ml-2 text-gray-600">{config.jobsCz.locality?.label} ({config.jobsCz.locality?.radius}km radius)</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Pages:</span>
                <span className="ml-2 text-gray-600">Until error (no limit)</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Scraping Controls */}
      <div className="mb-6 space-x-4">
        <button
          onClick={() => handleScrape('startupjobs')}
          disabled={scraping}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {scraping ? 'Scraping...' : 'Scrape StartupJobs'}
        </button>
        
        <button
          onClick={() => handleScrape('jobs.cz')}
          disabled={scraping}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
        >
          {scraping ? 'Scraping...' : 'Scrape Jobs.cz'}
        </button>
        
        <button
          onClick={() => handleScrape('all')}
          disabled={scraping}
          className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50"
        >
          {scraping ? 'Scraping...' : 'Scrape All'}
        </button>
        
        <button
          onClick={() => window.location.href = '/database'}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Explore the Database
        </button>
      </div>

      {/* Last Scrape Result */}
      {lastScrapeResult && (
        <div className={`mb-6 p-4 rounded-lg ${
          lastScrapeResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <h3 className="font-semibold mb-2">
            {lastScrapeResult.success ? '✅ Scraping Complete' : '❌ Scraping Failed'}
          </h3>
          {lastScrapeResult.success ? (
            <div className="text-sm">
              <p>{lastScrapeResult.message}</p>
              {lastScrapeResult.stats && (
                <div className="mt-2">
                  <p>Total scraped: {lastScrapeResult.stats.totalScraped}</p>
                  <p>New jobs: {lastScrapeResult.stats.newJobs}</p>
                  <p>Skipped existing: {lastScrapeResult.stats.skippedJobs}</p>
                  <p>Data file: {lastScrapeResult.stats.dataFile}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-red-600">{lastScrapeResult.error}</p>
          )}
        </div>
      )}
    </div>
  );
}