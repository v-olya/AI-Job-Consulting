'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useCallback, useEffect } from 'react';
import { DatabaseData } from '@types';
import { FE_ERROR_MESSAGES } from '@constants';
import { JobCard } from '@components/JobCard';
import { StatCard } from '@components/StatCard';
import { PaginationButton } from '@components/buttons/PaginationButton';
import { useAsyncOperationState } from '@hooks/useAsyncOperationState';
import { useRefreshOnFocus } from '@hooks/useRefreshOnFocus';

interface DatabaseClientProps {
  initialData: DatabaseData;
}

interface ProcessingPayload {
  processed: number;
  isCancelled?: boolean;
}

export default function DatabaseClient({ initialData }: DatabaseClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [processingResult, setProcessingResult] = useState<string>();
  const [unprocessed, setUnprocessed] = useState<number>(initialData.statistics.unprocessed);
  const [prevPropsUnprocessed, setPrevPropsUnprocessed] = useState<number>(initialData.statistics.unprocessed);

  // Sync local state when props change (server-side data refresh)
  if (initialData.statistics.unprocessed !== prevPropsUnprocessed) {
    setPrevPropsUnprocessed(initialData.statistics.unprocessed);
    setUnprocessed(initialData.statistics.unprocessed);
  }

  const handleOperationComplete = useCallback((payload: ProcessingPayload) => {
    // Sync state from other tabs' results or local completion
    if (payload?.processed !== undefined) {
      setUnprocessed(prev => Math.max(0, prev - payload.processed));
      router.refresh(); // Sync Job list
    }
  }, [router]);

  const {
    isOperationActive,
    startOperation,
    stopOperation,
    cancelOperation
  } = useAsyncOperationState<ProcessingPayload>({ 
    operationType: 'ai-processing',
    onOperationComplete: handleOperationComplete
  });
  
  useRefreshOnFocus(() => {
    router.refresh();
  });
  
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

    const started = startOperation('unprocessed');
    if (!started) {
      setProcessingResult(`${FE_ERROR_MESSAGES.AI_START_FAILED}.`);
      return;
    }

    setProcessingResult(undefined);
    
    try {
      const response = await fetch('/api/process-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          limit: 50
        }),
      });
      
      // Handle race condition: server rejects if operation already running
      if (response.status === 409) {
        stopOperation(); // Revert optimistic state
        setProcessingResult(`${FE_ERROR_MESSAGES.AI_START_FAILED}. Operation already running.`);
        return;
      }
      
      const result = await response.json();
      
      let resultPayload: ProcessingPayload | undefined = undefined;

      if (result.success) {
        setProcessingResult(result.message);
        resultPayload = { processed: result.processed || 0 };
      } else if (result.cancelled) {
        setProcessingResult(`${FE_ERROR_MESSAGES.AI_PROCESSING_CANCELLED}. ${result.processed || 0} jobs processed before cancellation.`);
        resultPayload = { processed: +result.processed || 0, isCancelled: true };
      } else {
        setProcessingResult(`Error: ${result.error}`);
      }
      stopOperation(resultPayload);
    } catch (error) {
      console.error('AI processing error:', error);
      setProcessingResult(FE_ERROR_MESSAGES.AI_PROCESSING_ERROR);
      stopOperation();
    }
  };

  useEffect(() => {
    if (processingResult) {
      const timer = setTimeout(() => {
        setProcessingResult(undefined);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [processingResult]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="p-8">
        <h1 className="text-4xl font-bold mb-8">
          Database Viewer
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard title="Total Jobs" value={initialData.statistics.total || 0} bgColor="bg-blue-100" />
          <StatCard title="Processed" value={(initialData.statistics.processed) || 0} bgColor="bg-green-100" />
          <StatCard title="Unprocessed" value={unprocessed || 0} bgColor="bg-orange-100" />
          <StatCard 
            title="Avg AI Score" 
            value={initialData.statistics.avgScore?.toFixed(1) || 'N/A'} 
            bgColor="bg-purple-100" 
          />
        </div>

        <div className="mb-8 p-4 bg-white rounded-xl shadow-sm border border-gray-200">
          <h3 className="font-semibold mb-3 text-gray-700">Sources:</h3>
          <div className="flex gap-3 flex-wrap">
            {initialData.sourceBreakdown.map(source => (
              <span key={source._id} className="bg-gradient-to-r from-blue-100 to-purple-100 px-4 py-2 rounded-full text-sm font-medium">
                {source._id}: <span className="font-bold">{source.count}</span>
              </span>
            ))}
          </div>
        </div>

        {(unprocessed > 0 || processingResult) && 
          <div className="mb-8 p-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-500 rounded-xl shadow-sm">
            <div className="flex justify-between items-center">
              {(unprocessed > 0) && 
                <div>
                  <h3 className="font-bold text-yellow-900 text-lg flex items-center gap-2">
                    <span>⚠️</span>
                    {unprocessed} job offers in total need processing
                  </h3>
                  <p className="text-yellow-800 text-sm mt-1">
                    Run AI analysis to get job scores and recommendations
                  </p>
                </div>
              }
              <div className="flex gap-3">
                {isOperationActive && (
                  <button
                    onClick={cancelOperation}
                    className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all shadow-md hover:shadow-lg font-bold text-lg"
                  >
                    ⛔ Cancel
                  </button>
                )}
                <button
                  onClick={handleProcessWithAI}
                  disabled={isOperationActive}
                  className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg hover:from-yellow-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg font-bold text-lg"
                >
                  {isOperationActive ? '⏳ Processing...' : '🤖 Process with AI'}
                </button>
              </div>
            </div>
            {processingResult && (
              <div className="mt-4 p-3 bg-white rounded-lg border border-yellow-200 shadow-sm">
                <p className="text-sm text-gray-700">{processingResult}</p>
              </div>
            )}
          </div>
        }

        <div className="flex gap-4 mb-8 flex-wrap justify-center">
          <select 
            name="sourceSelect"
            value={currentSource} 
            onChange={(e) => updateFilters({ source: e.target.value })}
            className="font-bold border border-gray-300 rounded-lg px-4 py-2 bg-white shadow-sm hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
          >
            <option value="">All Sources</option>
            <option value="startupjobs">StartupJobs</option>
            <option value="jobs.cz">Jobs.cz</option>
          </select>
          
          <select 
            name="statusSelect"
            value={currentProcessed} 
            onChange={(e) => updateFilters({ processed: e.target.value })}
            className="border border-gray-300 rounded-lg px-4 py-2 bg-white shadow-sm hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
          >
            <option value="">By Status</option>
            <option value="true">Processed</option>
            <option value="false">Unprocessed</option>
          </select>
          
          <select 
            name="perPageSelect"
            value={currentLimit} 
            onChange={(e) => updateFilters({ limit: parseInt(e.target.value) })}
            className="border border-gray-300 rounded-lg px-4 py-2 bg-white shadow-sm hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
          >
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
          </select>
        </div>

        <div className="flex gap-3 mb-8 justify-center items-center">
          <PaginationButton 
            onClick={() => updateFilters({ skip: Math.max(0, currentSkip - currentLimit) })}
            disabled={currentSkip === 0}
          >
            ← Previous
          </PaginationButton>
          <span>
            &nbsp;{Math.min(currentSkip + 1, initialData.pagination.total)}&thinsp;-&thinsp;{Math.min(currentSkip + currentLimit, initialData.pagination.total)}&nbsp; of &nbsp;{initialData.pagination.total}&nbsp;
          </span>
          <PaginationButton 
            onClick={() => updateFilters({ skip: currentSkip + currentLimit })}
            disabled={!initialData.pagination.hasMore}
          >
            Next →
          </PaginationButton>
        </div>

        <div className="space-y-6">
          {initialData.jobs.map(job => (
            <JobCard key={job._id} job={job} />
          ))}
        </div>
      </div>
    </div>
  );
}