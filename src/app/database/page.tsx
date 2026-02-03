import { Suspense } from 'react';
import { connectDB } from '@/lib/utils/database';
import { Job } from '@/schemas/Job';
import { DatabaseData } from '@/types';
import DatabaseClient from './DatabaseClient';

async function getDatabaseData(searchParams: Record<string, string>): Promise<DatabaseData> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Database access not allowed in production');
  }

  await connectDB();
  
  const limit = parseInt(searchParams.limit || '10');
  const skip = parseInt(searchParams.skip || '0');
  const source = searchParams.source;
  const processed = searchParams.processed;
  
  const query: Record<string, unknown> = {};
  if (source) query.source = source;
  if (processed !== undefined) query.processed = processed === 'true';
  
  const jobs = await Job.find(query)
    .sort({ scrapedAt: -1 })
    .limit(limit)
    .skip(skip)
    .lean();
  
  const total = await Job.countDocuments(query);
  
  const stats = await Job.aggregate([
    {
      $addFields: {
        isProperlyProcessed: {
          $and: [
            { $eq: ['$processed', true] },
            { $ne: ['$aiAnalysis', null] },
            { $ne: ['$aiAnalysis.summary', 'Job analysis failed'] },
            { $not: { $regexMatch: { input: '$aiAnalysis.summary', regex: 'Analysis unavailable' } } }
          ]
        }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        processed: { $sum: { $cond: ['$isProperlyProcessed', 1, 0] } },
        unprocessed: { $sum: { $cond: ['$isProperlyProcessed', 0, 1] } },
        sources: { $addToSet: '$source' },
        avgScore: { 
          $avg: { 
            $cond: [
              { $and: ['$isProperlyProcessed', { $ne: ['$aiAnalysis.score', null] }] },
              '$aiAnalysis.score',
              null
            ]
          }
        }
      }
    }
  ]);
  
  const sourceStats = await Job.aggregate([
    {
      $group: {
        _id: '$source',
        count: { $sum: 1 }
      }
    }
  ]);
  
  return {
    jobs: JSON.parse(JSON.stringify(jobs)),
    pagination: {
      total,
      limit,
      skip,
      hasMore: skip + limit < total
    },
    statistics: stats[0] || {},
    sourceBreakdown: sourceStats
  };
}

export default async function DatabaseViewer({
  searchParams
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  if (process.env.NODE_ENV === 'production') {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <h1 className="text-xl font-bold mb-2">Access Denied</h1>
          <p>Database viewer is not available in production environment for security reasons.</p>
        </div>
      </div>
    );
  }

  let data: DatabaseData;
  try {
    const resolvedSearchParams = await searchParams;
    data = await getDatabaseData(resolvedSearchParams);
  } catch (error) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <h1 className="text-xl font-bold mb-2">Error</h1>
          <p>Failed to load database data: {error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <DatabaseClient initialData={data} />
    </Suspense>
  );
}