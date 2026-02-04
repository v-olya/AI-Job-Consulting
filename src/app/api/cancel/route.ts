import { NextResponse } from 'next/server';

const MAX_ACTIVE_CONTROLLERS = 10;
const activeControllers = new Map<string, AbortController>();

export function registerAbortController(tabId: string, controller: AbortController): boolean {
  if (activeControllers.has(tabId)) {
    return false;
  }

  if (activeControllers.size >= MAX_ACTIVE_CONTROLLERS) {
    const oldestKey = activeControllers.keys().next().value as string | undefined;
    if (oldestKey) {
      const oldController = activeControllers.get(oldestKey);
      if (oldController) {
        oldController.abort();
      }
      activeControllers.delete(oldestKey);
    }
  }
  
  activeControllers.set(tabId, controller);
  return true;
}

export function unregisterAbortController(tabId: string): void {
  activeControllers.delete(tabId);
}

export async function POST(request: Request) {
  try {
    const { tabId } = await request.json();

    if (!tabId) {
      return NextResponse.json(
        { success: false, error: 'Tab ID is required' },
        { status: 400 }
      );
    }

    const controller = activeControllers.get(tabId);
    if (controller) {
      controller.abort();
      activeControllers.delete(tabId);
      
      return NextResponse.json({
        success: true,
        message: 'Scraping cancelled successfully'
      });
    }

    return NextResponse.json({
      success: true,
      message: 'No active scraping session found'
    });

  } catch (error) {
    console.error('Error cancelling scraping:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
