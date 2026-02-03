'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { DatabaseData } from '@/types';

interface DatabaseClientProps {
  initialData: DatabaseData;
}

export default function DatabaseClient({ initialData }: DatabaseClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingResult, setProcessingResult] = useState<string | null>(null);
  
  const currentSource = searchParams.get('source') || '';
  const currentProcessed = searchParams.get('processed') || '';
  const currentLimit = parseInt(searchParams.get('limit') || '10');
  const currentSkip = parseInt(searchParams.get('skip') || '0');

  const updateFilters = (updates: Record<string, string | number>) => {
    const params = new URLSearchParams(searchParams);
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value.toString());
      } else {
        params.delete(key);
      }
    });
    
    if (updates.source !== undefined || updates.processed !== undefined) {
      params.delete('skip');
    }
    
    router.push(`/database?${params.toString()}`);
  };

  const handleProcessWithAI = async () => {
    setIsProcessing(true);
    setProcessingResult(null);
    
    try {
      const response = await fetch('/api/process-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ limit: 50 }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setProcessingResult(result.message);
        router.refresh();
      } else {
        setProcessingResult(`Error: ${result.error}`);
      }
    } catch (error) {
      setProcessingResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Database Viewer</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-100 p-4 rounded-lg">
          <h3 className="font-semibold">Total Jobs</h3>
          <p className="text-2xl">{initialData.statistics.total || 0}</p>
        </div>
        <div className="bg-green-100 p-4 rounded-lg">
          <h3 className="font-semibold">Processed</h3>
          <p className="text-2xl">{initialData.statistics.processed || 0}</p>
        </div>
        <div className="bg-yellow-100 p-4 rounded-lg">
          <h3 className="font-semibold">Unprocessed</h3>
          <p className="text-2xl">{initialData.statistics.unprocessed || 0}</p>
        </div>
        <div className="bg-purple-100 p-4 rounded-lg">
          <h3 className="font-semibold">Avg AI Score</h3>
          <p className="text-2xl">{initialData.statistics.avgScore?.toFixed(1) || 'N/A'}</p>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="font-semibold mb-2">Sources:</h3>
        <div className="flex gap-4">
          {initialData.sourceBreakdown.map(source => (
            <span key={source._id} className="bg-gray-100 px-3 py-1 rounded">
              {source._id}: {source.count}
            </span>
          ))}
        </div>
      </div>

      {initialData.statistics.unprocessed > 0 && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-yellow-800">
                {initialData.statistics.unprocessed} jobs need AI processing
              </h3>
              <p className="text-yellow-700 text-sm">
                Run AI analysis on unprocessed jobs to get summaries, skills, and scores
              </p>
            </div>
            <button
              onClick={handleProcessWithAI}
              disabled={isProcessing}
              className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Processing...' : 'Process with AI'}
            </button>
          </div>
          {processingResult && (
            <div className="mt-3 p-2 bg-white rounded border">
              <p className="text-sm">{processingResult}</p>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-4 mb-6 flex-wrap">
        <select 
          value={currentSource} 
          onChange={(e) => updateFilters({ source: e.target.value })}
          className="border rounded px-3 py-2"
        >
          <option value="">All Sources</option>
          <option value="startupjobs">StartupJobs</option>
          <option value="jobs.cz">Jobs.cz</option>
        </select>
        
        <select 
          value={currentProcessed} 
          onChange={(e) => updateFilters({ processed: e.target.value })}
          className="border rounded px-3 py-2"
        >
          <option value="">All Status</option>
          <option value="true">Processed</option>
          <option value="false">Unprocessed</option>
        </select>
        
        <select 
          value={currentLimit} 
          onChange={(e) => updateFilters({ limit: parseInt(e.target.value) })}
          className="border rounded px-3 py-2"
        >
          <option value={10}>10 per page</option>
          <option value={25}>25 per page</option>
          <option value={50}>50 per page</option>
        </select>
      </div>
      <div className="flex gap-2 mb-6">
        <button 
          onClick={() => updateFilters({ skip: Math.max(0, currentSkip - currentLimit) })}
          disabled={currentSkip === 0}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
        >
          Previous
        </button>
        <span className="px-4 py-2">
          Showing {currentSkip + 1}-{Math.min(currentSkip + currentLimit, initialData.pagination.total)} of {initialData.pagination.total}
        </span>
        <button 
          onClick={() => updateFilters({ skip: currentSkip + currentLimit })}
          disabled={!initialData.pagination.hasMore}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
        >
          Next
        </button>
      </div>

      <div className="space-y-4">
        {initialData.jobs.map(job => (
          <div key={job._id} className="border rounded-lg p-4 bg-white shadow">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-semibold">{job.title}</h3>
              <div className="flex gap-2">
                <span className={`px-2 py-1 rounded text-xs ${job.processed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {job.processed ? 'Processed' : 'Unprocessed'}
                </span>
                <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                  {job.source}
                </span>
              </div>
            </div>
            
            <p className="text-gray-600 mb-2">
              {job.company}
              {job.location && job.location !== 'Not detected' && ` • ${job.location}`}
            </p>
            
            {job.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {job.tags.map((tag, idx) => (
                  <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            )}
            
            {job.aiAnalysis && (
              <div className="mt-3 p-3 bg-gray-50 rounded">
                <h4 className="font-semibold text-sm mb-1">AI Analysis</h4>
                <p className="text-sm mb-2">{job.aiAnalysis.summary}</p>
                <div className="flex gap-4 text-xs text-gray-600">
                  <span>Seniority: {job.aiAnalysis.seniority}</span>
                  <span>Remote: {job.aiAnalysis.remote ? 'Yes' : 'No'}</span>
                  <span>Score: {job.aiAnalysis.score}/100</span>
                </div>
              </div>
            )}
            
            <div className="flex justify-between items-center mt-3 text-xs text-gray-500">
              <span>Posted: {new Date(job.postedDate).toLocaleDateString('en-US')}</span>
              <span>Scraped: {new Date(job.scrapedAt).toLocaleDateString('en-US')}</span>
              <a href={job.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                View Original
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}