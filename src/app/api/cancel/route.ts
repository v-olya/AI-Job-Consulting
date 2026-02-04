import { NextResponse } from 'next/server';
import { abortOperation, type OperationType } from '@/lib/utils/operationAbortRegistry';

export async function POST(request: Request) {
  try {
    const { tabId, type } = await request.json();

    if (!tabId) {
      return NextResponse.json(
        { success: false, error: 'Tab ID is required' },
        { status: 400 }
      );
    }

    const operationType: OperationType = type || 'scraping';
    const didAbort = abortOperation(tabId, operationType);

    if (didAbort) {
      return NextResponse.json({
        success: true,
        message: 'Operation cancelled successfully'
      });
    }

    return NextResponse.json({
      success: true,
      message: 'No active operation found'
    });

  } catch (error) {
    console.error('Error cancelling operation:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
