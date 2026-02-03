import { JobData } from '@/types';
import { formatDate, formatScore } from '@/lib/utils/textUtils';

interface JobCardProps {
  job: JobData;
}

export function JobCard({ job }: JobCardProps) {
  return (
    <div className="border border-gray-200 rounded-xl p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-xl font-bold text-gray-800 flex-1">{job.title}</h3>
        <div className="flex gap-2 ml-4">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            job.processed 
              ? 'bg-green-100 text-green-800' 
              : 'bg-orange-100 text-yellow-800'
          }`}>
            {job.processed ? '✓ Processed' : '⏳ Pending'}
          </span>
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            {job.source}
          </span>
        </div>
      </div>
      
      <p className="text-gray-600 mb-3 flex items-center gap-2">
        <span className="font-medium">{job.company}</span>
        {job.location && job.location !== 'Not detected' && (
          <>
            <span className="text-gray-400">•</span>
            <span className="text-gray-500">{job.location}</span>
          </>
        )}
      </p>
      
      {job.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {job.tags.map((tag, idx) => (
            <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
              {tag}
            </span>
          ))}
        </div>
      )}
      
      {job.aiAnalysis && (
        <div className="mt-4 p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-100">
          <h4 className="font-semibold text-sm mb-2 text-blue-900 flex items-center gap-2">
            <span>🤖</span>
            AI Analysis
          </h4>
          <p className="text-sm text-gray-700 mb-3 leading-relaxed">{job.aiAnalysis.summary}</p>
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="bg-white px-3 py-1 rounded-full text-gray-700 font-medium">
              👔 {job.aiAnalysis.seniority}
            </span>
            <span className="bg-white px-3 py-1 rounded-full text-gray-700 font-medium">
              {job.aiAnalysis.remote ? '🏠 Remote' : '🏢 On-site'}
            </span>
            <span className="bg-white px-3 py-1 rounded-full text-blue-700 font-bold">
              ⭐ {formatScore(job.aiAnalysis.score)}
            </span>
          </div>
        </div>
      )}
      
      <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200 text-sm text-gray-500">
        <span>📅 Posted: {formatDate(job.postedDate)}</span>
        <span>🕒 Scraped: {formatDate(job.scrapedAt)}</span>
        <a 
          href={job.url} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
        >
          View Original →
        </a>
      </div>
    </div>
  );
}
