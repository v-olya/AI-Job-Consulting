import { useEffect, useState, useCallback } from 'react';
import { ScrapingResult } from '@/types';

interface ScrapeResultAlertProps {
  result: ScrapingResult;
  onClose: () => void;
}

export function ScrapeResultAlert({ result, onClose }: ScrapeResultAlertProps) {
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  
  const isSuccess = result.success;
  const isCancelled = result.cancelled;

  // Handle entry animation
  useEffect(() => {
    const timer = requestAnimationFrame(() => {
      setIsVisible(true);
    });
    return () => cancelAnimationFrame(timer);
  }, []);

  // Handle exit logic
  const handleClose = useCallback(() => {
    setIsVisible(false);
    setIsExiting(true);
    setTimeout(onClose, 500); // Match transition duration
  }, [onClose]);

  useEffect(() => {
    if (isPaused || isExiting) return;

    const duration = 5000;
    const interval = 10;
    const step = (interval / duration) * 100;

    const timer = setTimeout(() => {
      handleClose();
    }, (progress / 100) * duration);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const next = Math.max(0, prev - step);
        if (next === 0) {
          clearInterval(progressInterval);
        }
        return next;
      });
    }, interval);

    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
    };
  }, [handleClose, isPaused, progress, isExiting]);
  
  return (
    <div className={`grid transition-[grid-template-rows,margin-bottom,opacity] duration-500 ease-in-out ${
      isVisible ? 'grid-rows-[1fr] mb-6 opacity-100' : 'grid-rows-[0fr] mb-0 opacity-0'
    }`}>
      <div className="overflow-hidden">
        <div 
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          className={`p-4 rounded-lg shadow-md relative overflow-hidden transition-all duration-500 ${
          isSuccess 
            ? 'bg-green-50 border-l-4 border-green-500' 
            : isCancelled
            ? 'bg-yellow-50 border-l-4 border-yellow-500'
            : 'bg-red-50 border-l-4 border-red-500'
        }`}>
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 transition-colors z-10"
            aria-label="Close alert"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <h3 className="font-semibold mb-2 flex items-center gap-2 pr-8">
            <span className="text-xl">
              {isSuccess ? '✅' : isCancelled ? '⏹️' : '❌'}
            </span>
            {isSuccess ? 'Scraping Complete' : isCancelled ? 'Scraping Cancelled' : 'Scraping Failed'}
          </h3>
          
          {isSuccess ? (
            <div className="text-sm text-gray-700">
              <p className="mb-2">{result.message}</p>
              {result.stats && (
                <div className="grid grid-cols-3 gap-3 mt-3">
                  <div className="bg-white/50 p-2 rounded backdrop-blur-sm">
                    <span className="text-xs text-gray-500 block">Total Scraped</span>
                    <p className="font-bold text-green-700">{result.stats.totalScraped}</p>
                  </div>
                  <div className="bg-white/50 p-2 rounded backdrop-blur-sm">
                    <span className="text-xs text-gray-500 block">New Jobs</span>
                    <p className="font-bold text-blue-700">{result.stats.newJobs}</p>
                  </div>
                  <div className="bg-white/50 p-2 rounded backdrop-blur-sm">
                    <span className="text-xs text-gray-500 block">Skipped</span>
                    <p className="font-bold text-gray-700">{result.stats.skippedJobs}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-700">{result.message || result.error}</p>
          )}

          {/* Progress bar indicator */}
          <div className="absolute bottom-0 left-0 h-1 bg-current opacity-20 transition-all duration-100 ease-linear" 
               style={{ width: `${progress}%`, color: isSuccess ? '#10b981' : isCancelled ? '#f59e0b' : '#ef4444' }} />
        </div>
      </div>
    </div>
  );
}


