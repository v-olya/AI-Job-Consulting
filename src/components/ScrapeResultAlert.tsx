import { ScrapingResult } from '@/types';

interface ScrapeResultAlertProps {
  result: ScrapingResult;
  onClose: () => void;
}

export function ScrapeResultAlert({ result, onClose }: ScrapeResultAlertProps) {
  const isSuccess = result.success;
  const isCancelled = result.cancelled;
  
  return (
    <div className={`mb-6 p-4 rounded-lg shadow-sm relative ${
      isSuccess 
        ? 'bg-green-50 border-l-4 border-green-500' 
        : isCancelled
        ? 'bg-yellow-50 border-l-4 border-yellow-500'
        : 'bg-red-50 border-l-4 border-red-500'
    }`}>
      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 transition-colors"
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
              <div className="bg-white p-2 rounded">
                <span className="text-sm text-gray-500">Total Scraped</span>
                <p className="font-bold text-green-700">{result.stats.totalScraped}</p>
              </div>
              <div className="bg-white p-2 rounded">
                <span className="text-sm text-gray-500">New Jobs</span>
                <p className="font-bold text-blue-700">{result.stats.newJobs}</p>
              </div>
              <div className="bg-white p-2 rounded">
                <span className="text-sm text-gray-500">Skipped</span>
                <p className="font-bold text-gray-700">{result.stats.skippedJobs}</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-700">{result.message || result.error}</p>
      )}
    </div>
  );
}
