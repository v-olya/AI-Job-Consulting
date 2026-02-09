import { channel } from '@/lib/utils/broadcastChannel';
import { OperationType } from '@/lib/utils/operationAbortRegistry';
import { useCallback, useState, useEffect } from 'react';

const isBrowser = typeof window !== 'undefined';

interface ActiveOperation {
  type: OperationType;
  source?: string;
}

  interface BroadcastMessage<T = unknown> {
  type: 'START' | 'STOP';
  operationType: OperationType;
  source?: string;
  payload?: T;
}

export function useAsyncOperationState<T = unknown>(options: {
  operationType: OperationType;
  onOperationComplete?: (payload: T) => void;
}) {
  const { operationType, onOperationComplete } = options;
  const [activeOperation, setActiveOperation] = useState<ActiveOperation | null>(null);
  const isOperationActive = activeOperation !== null;

  useEffect(() => {
    if (!isBrowser) return;

    const handleMessage = (event: MessageEvent<BroadcastMessage<T>>) => {
      const { type, operationType: msgOperationType, source, payload } = event.data;

      if (msgOperationType !== operationType) return;

      if (type === 'START') {
        setActiveOperation({ type: operationType, source });
      }
      if (type === 'STOP') {
        setActiveOperation(null);
        if (payload && onOperationComplete) {
          onOperationComplete(payload);
        }
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
    };
  }, [operationType, onOperationComplete]);

  // Check server before committing to local state to prevent race conditions
  const startOperation = useCallback((source?: string): boolean => {
    if (isOperationActive) {
      return false;
    }
    // Optimistically set local state and broadcast
    // If server rejects (409), a caller calls stopOperation() from .tsx
    setActiveOperation({ type: operationType, source });

    try {
      if (isBrowser) {
        channel.postMessage({ type: 'START', operationType, source });
      }
    } catch (error) {
      console.error('Failed to broadcast start operation:', error);
    }

    return true;
  }, [operationType, isOperationActive]);

  const stopOperation = useCallback((payload?: T): void => {
    setActiveOperation(null);

    // Update the initiating tab since BroadcastChannel doesn't send messages to self
    if (payload && onOperationComplete) {
      onOperationComplete(payload);
    }

    try {
      if (isBrowser) {
        channel.postMessage({ type: 'STOP', operationType, payload });
      }
    } catch (error) {
      console.error('Failed to broadcast stop operation:', error);
    }
  }, [operationType, onOperationComplete]);

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
