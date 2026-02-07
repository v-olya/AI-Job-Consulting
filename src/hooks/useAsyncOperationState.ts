import { useCallback, useState, useEffect, useRef } from 'react';

export type OperationType = 'scraping' | 'ai-processing';

export interface AsyncOperationSession {
  type: OperationType;
  source?: string;
}

export interface UseAsyncOperationStateOptions {
  operationType: OperationType;
}

const CHANNEL_NAME = 'job-operations-sync';

interface BroadcastMessage {
  type: 'START' | 'STOP' | 'REQUEST_STATE';
  operationType: OperationType;
  source?: string;
}

export function useAsyncOperationState(options: UseAsyncOperationStateOptions) {
  const { operationType } = options;
  const [session, setSession] = useState<AsyncOperationSession | null>(null);
  const isOperationActive = session !== null;
  const isOperationActiveRef = useRef(false);

  useEffect(() => {
    isOperationActiveRef.current = isOperationActive;
  }, [isOperationActive]);

  useEffect(() => {
    const channel = new BroadcastChannel(CHANNEL_NAME);

    const handleMessage = (event: MessageEvent<BroadcastMessage>) => {
      const { type, operationType: msgOperationType, source } = event.data;

      if (msgOperationType !== operationType) return;

      if (type === 'START') {
        setSession({ type: operationType, source });
      }
      if (type === 'STOP') {
        setSession(null);
      }
      if (type === 'REQUEST_STATE' && isOperationActiveRef.current && session) {
        channel.postMessage({ 
          type: 'START', 
          operationType, 
          source: session.source 
        });
      }
    };

    channel.addEventListener('message', handleMessage);

    channel.postMessage({ type: 'REQUEST_STATE', operationType });

    return () => {
      channel.removeEventListener('message', handleMessage);
      channel.close();
    };
  }, [operationType, session]);

  const startOperation = useCallback((source?: string): boolean => {
    if (isOperationActive) {
      return false;
    }

    const newSession = { type: operationType, source };
    setSession(newSession);

    try {
      const channel = new BroadcastChannel(CHANNEL_NAME);
      channel.postMessage({ type: 'START', operationType, source });
      channel.close();
    } catch (error) {
      console.error('Failed to broadcast start operation:', error);
    }

    return true;
  }, [operationType, isOperationActive]);

  const stopOperation = useCallback((): void => {
    setSession(null);

    try {
      const channel = new BroadcastChannel(CHANNEL_NAME);
      channel.postMessage({ type: 'STOP', operationType });
      channel.close();
    } catch (error) {
      console.error('Failed to broadcast stop operation:', error);
    }
  }, [operationType]);

  const cancelOperation = useCallback(async (): Promise<void> => {
    try {
      await fetch('/api/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: operationType })
      });
    } catch (error) {
      console.error(`Failed to cancel ${operationType}:`, error);
    }

    stopOperation();
  }, [operationType, stopOperation]);

  return {
    session,
    isOperationActive,
    startOperation,
    stopOperation,
    cancelOperation
  };
}
