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
    const currentChannel = channel;
    if (!isBrowser || !currentChannel) return;

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

    currentChannel.addEventListener('message', handleMessage);

    // Initial check on mount
    const checkServerState = async () => {
      try {
        const response = await fetch(`/api/operation-status?type=${operationType}&t=${Date.now()}`, {
          cache: 'no-store'
        });
        const result = await response.json();
        
        if (result.success) {
          if (result.isActive) {
            setActiveOperation(prev => {
              if (prev?.source === result.source) return prev;
              return { 
                type: operationType, 
                source: result.source || undefined 
              };
            });
          } else {
            setActiveOperation(null);
          }
        }
      } catch (error) {
        console.error('Failed to check server operation state:', error);
      }
    };

    checkServerState();

    return () => {
      currentChannel.removeEventListener('message', handleMessage);
    };
  }, [operationType, onOperationComplete]);

  const startOperation = useCallback((source?: string): boolean => {
    if (isOperationActive) return false;
    
    setActiveOperation({ type: operationType, source });

    if (isBrowser && channel) {
      channel.postMessage({ type: 'START', operationType, source });
    }

    return true;
  }, [operationType, isOperationActive]);

  const stopOperation = useCallback((payload?: T): void => {
    setActiveOperation(null);

    // Initiator syncs locally
    if (payload && onOperationComplete) {
      onOperationComplete(payload);
    }

    if (isBrowser && channel) {
      channel.postMessage({ type: 'STOP', operationType, payload });
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



