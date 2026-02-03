import { NextResponse } from 'next/server';
import { getScrapingConfig } from '@/configureFilters';

export async function GET() {
  try {
    const config = getScrapingConfig();
    
    return NextResponse.json({
      success: true,
      config,
      description: {
        startupJobs: {
          fields: 'Job categories to search for',
          locations: 'Geographic locations (lat_lng;radius_km)',
          locationPreference: 'Work arrangement preferences',
          seniority: 'Experience levels to include',
          startupOnly: 'Filter to startup companies only'
        },
        jobsCz: {
          queries: 'Search terms/technologies',
          locality: 'Location settings for Prague area',
          scraping: 'Continues until 4xx/5xx error (no page limit)'
        }
      }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}