import { OperationType } from '@/lib/utils/operationAbortRegistry';
import { useCallback, useState, useEffect } from 'react';

const isBrowser = typeof window !== 'undefined';

interface ActiveOperation {
  type: OperationType;
  source?: string;
}

const CHANNEL_NAME = 'job-operations-sync';

interface BroadcastMessage {
  type: 'START' | 'STOP';
  operationType: OperationType;
  source?: string;
}

export function useAsyncOperationState(options: {
  operationType: OperationType;
}) {
  const { operationType } = options;
  const [activeOperation, setActiveOperation] = useState<ActiveOperation | null>(null);
  const isOperationActive = activeOperation !== null;

  useEffect(() => {
    if (!isBrowser) return;

    const channel = new BroadcastChannel(CHANNEL_NAME);

    const handleMessage = (event: MessageEvent<BroadcastMessage>) => {
      const { type, operationType: msgOperationType, source } = event.data;

      if (msgOperationType !== operationType) return;

      if (type === 'START') {
        setActiveOperation({ type: operationType, source });
      }
      if (type === 'STOP') {
        setActiveOperation(null);
      }
    };

    channel.addEventListener('message', handleMessage);

    // Query server for operation state on mount
    const checkServerState = async () => {
      try {
        const response = await fetch(`/api/operation-status?type=${operationType}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        const result = await response.json();
        if (result.success && result.isActive) {
          setActiveOperation({ type: operationType });
        }
      } catch (error) {
        console.error('Failed to check server operation state:', error);
      }
    };

    checkServerState();

    return () => {
      channel.removeEventListener('message', handleMessage);
      channel.close();
    };
  }, [operationType]);

  // Check server before committing to local state to prevent race conditions
  const startOperation = useCallback((source?: string): boolean => {
    // Quick local check first (optimization)
    if (isOperationActive) {
      return false;
    }

    // Optimistically set local state and broadcast
    // If server rejects (409), caller should call stopOperation() to revert
    setActiveOperation({ type: operationType, source });

    try {
      if (isBrowser) {
        const channel = new BroadcastChannel(CHANNEL_NAME);
        channel.postMessage({ type: 'START', operationType, source });
        channel.close();
      }
    } catch (error) {
      console.error('Failed to broadcast start operation:', error);
    }

    return true;
  }, [operationType, isOperationActive]);

  const stopOperation = useCallback((): void => {
    setActiveOperation(null);

    try {
      if (isBrowser) {
        const channel = new BroadcastChannel(CHANNEL_NAME);
        channel.postMessage({ type: 'STOP', operationType });
        channel.close();
      }
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
    activeOperation,
    isOperationActive,
    startOperation,
    stopOperation,
    cancelOperation
  };
}
