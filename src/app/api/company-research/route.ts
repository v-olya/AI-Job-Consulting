import { NextRequest, NextResponse } from 'next/server';
import { searchCompanyInfo, generateCompanySummary } from '@/lib/ai/companyResearch';
import type { CompanyResearchResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { companyName } = await request.json();

    if (!companyName || typeof companyName !== 'string') {
      return NextResponse.json<CompanyResearchResponse>(
        { success: false, error: 'Company name is required' },
        { status: 400 }
      );
    }

    const companyInfo = await searchCompanyInfo(companyName.trim());

    if (!companyInfo) {
      return NextResponse.json<CompanyResearchResponse>(
        { success: false, error: 'No company information found' },
        { status: 404 }
      );
    }

    const summary = generateCompanySummary(companyInfo);

    return NextResponse.json<CompanyResearchResponse>({
      success: true,
      data: {
        companyInfo,
        summary
      }
    });

  } catch (error) {
    console.error('Company research API error:', error);
    return NextResponse.json<CompanyResearchResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}