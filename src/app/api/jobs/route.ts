import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/utils/database';
import { Job } from '@/schemas/Job';

export async function GET(request: Request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source');
    const processed = searchParams.get('processed');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = parseInt(searchParams.get('skip') || '0');
    
    const filter: Record<string, unknown> = {};
    if (source) filter.source = source;
    if (processed !== null) filter.processed = processed === 'true';
    
    const jobs = await Job.find(filter)
      .sort({ scrapedAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();
    
    const total = await Job.countDocuments(filter);
    
    return NextResponse.json({
      success: true,
      jobs,
      pagination: {
        total,
        limit,
        skip,
        hasMore: skip + limit < total
      }
    });
    
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}