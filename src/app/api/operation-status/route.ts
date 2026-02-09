import { NextResponse } from 'next/server';
import { getActiveOperationInfo, type OperationType } from '@/lib/utils/operationAbortRegistry';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as OperationType | null;

    if (!type || !['scraping', 'ai-processing'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid operation type' },
        { status: 400 }
      );
    }

    const info = getActiveOperationInfo(type);

    return NextResponse.json({
      success: true,
      operationType: type,
      isActive: !!info,
      source: info?.source
    });
  } catch (error) {
    console.error('Error checking operation status:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

