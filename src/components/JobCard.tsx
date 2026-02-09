import { JobData } from '@types';
import { formatDate } from '@lib/utils/textUtils';
import { SectionHeader } from './SectionHeader';
import { InfoSection } from './InfoSection';

interface JobCardProps {
  job: JobData;
}

export function JobCard({ job }: JobCardProps) {
  return (
    <div className="border border-gray-200 rounded-xl p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-xl font-bold text-gray-800 flex-1">{job.title}</h3>
        <div className="flex gap-2 ml-4">
          {job.processed && job.aiAnalysis?.score && (
            <button className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100">
              {job.aiAnalysis.recommendation}&nbsp; ⭐{job.aiAnalysis.score}&thinsp;/10
            </button>
          )}
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
          {job.tags.map((tag) => (
            <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
              {tag}
            </span>
          ))}
        </div>
      )}
      
      {job.aiAnalysis && (
        <InfoSection variant="blue-purple">
          <SectionHeader 
            icon="🤖" 
            title="AI Analysis" 
            colorClass="text-blue-900" 
          />

          {job.processed && (
            <div className="space-y-3">
              {job.aiAnalysis.body.summary && (
                <p className="text-sm text-gray-700 leading-relaxed"><b className="underline pr-1">Shrnutí:</b> {job.aiAnalysis.body.summary}</p>
              )}
              {job.aiAnalysis.body.analysis && (
                <p className="text-sm text-gray-700 leading-relaxed"><b className="underline pr-1">Analýza:</b> {job.aiAnalysis.body.analysis}</p>
              )}
              {job.aiAnalysis.body.risks_opportunities && (
                <p className="text-sm text-gray-700 leading-relaxed"><b className="underline pr-1">Rizika a příležitosti:</b> {job.aiAnalysis.body.risks_opportunities}</p>
              )}
            </div>
          )}
        </InfoSection>
      )}

      {job.companyResearch?.name && (
        <InfoSection variant="green-emerald">
          <SectionHeader 
            icon="🏢" 
            title={job.companyResearch.name} 
            colorClass="text-green-900" 
          />
          
          <div className="space-y-2">
            <span className="text-sm">Website:</span> {job.companyResearch.website && (
              <a 
                href={job.companyResearch.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
              >
                {job.companyResearch.website}
              </a>
            )}
            {job.companyResearch.keyFacts?.length > 0 && (
              <div className="text-sm text-gray-700">
                <ul className="list-disc list-inside space-y-1 mt-1">
                  {job.companyResearch.keyFacts.map((fact) => (
                    <li key={fact} className="leading-relaxed">{fact.trim()}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </InfoSection>
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
