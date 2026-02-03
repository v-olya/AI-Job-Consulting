import { ScrapingResult } from '@/types';

interface ScrapeResultAlertProps {
  result: ScrapingResult;
  onClose: () => void;
}

export function ScrapeResultAlert({ result, onClose }: ScrapeResultAlertProps) {
  return (
    <div className={`mb-6 p-4 rounded-lg shadow-sm relative ${
      result.success 
        ? 'bg-green-50 border-l-4 border-green-500' 
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
        <span className="text-xl">{result.success ? '✅' : '❌'}</span>
        {result.success ? 'Scraping Complete' : 'Scraping Failed'}
      </h3>
      {result.success ? (
        <div className="text-sm text-gray-700">
          <p className="mb-2">{result.message}</p>
          {result.stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
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
              <div className="bg-white p-2 rounded">
                <span className="text-sm text-gray-500">Data File</span>
                <p className="font-bold text-purple-700 truncate">{result.stats.dataFile}</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="text-red-700 text-sm pr-8">{result.error}</p>
      )}
    </div>
  );
}
