import { useLocalStorage } from 'usehooks-ts';
import { useEffect, useMemo, useState, useRef, useCallback } from 'react';

export type OperationType = 'scraping' | 'ai-processing';

export interface AsyncOperationSession {
  type: OperationType;
  source?: string;
  startedAt: number;
  lastHeartbeat: number;
  tabId: string;
}

const STORAGE_KEY_PREFIX = 'async-operation-session:';
const TAB_ID_STORAGE_KEY = 'async-operation-tab-id';
const SESSION_TIMEOUT_MS = 2 * 60 * 1000;
const HEARTBEAT_INTERVAL_MS = 5000;

function generateTabId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function getOrCreateTabId(): string {
  if (typeof window === 'undefined') {
    return generateTabId();
  }

  try {
    const existing = window.sessionStorage.getItem(TAB_ID_STORAGE_KEY);
    if (existing) {
      return existing;
    }

    const created = generateTabId();
    window.sessionStorage.setItem(TAB_ID_STORAGE_KEY, created);
    return created;
  } catch {
    return generateTabId();
  }
}

export interface UseAsyncOperationStateOptions {
  operationType: OperationType;
}

export function useAsyncOperationState(options: UseAsyncOperationStateOptions) {
  const { operationType } = options;
  const storageKey = `${STORAGE_KEY_PREFIX}${operationType}`;

  const [session, setSession] = useLocalStorage<AsyncOperationSession | null>(storageKey, null, {
    initializeWithValue: false,
  });
  const [tabId] = useState(getOrCreateTabId);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const stalenessCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    stalenessCheckIntervalRef.current = setInterval(() => {
      if (session) {
        const timeSinceHeartbeat = Date.now() - session.lastHeartbeat;
        if (timeSinceHeartbeat > SESSION_TIMEOUT_MS) {
          setSession(null);
        }
      }
    }, 1000);

    return () => {
      if (stalenessCheckIntervalRef.current) {
        clearInterval(stalenessCheckIntervalRef.current);
      }
    };
  }, [session, setSession]);

  useEffect(() => {
    if (session && session.tabId === tabId) {
      heartbeatIntervalRef.current = setInterval(() => {
        setSession(prev => prev ? { ...prev, lastHeartbeat: Date.now() } : null);
      }, HEARTBEAT_INTERVAL_MS);
    } else {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
    }

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, [session, tabId, setSession]);

  const isOperationActive = session !== null;
  const isSameType = useMemo(() => session?.type === operationType, [session, operationType]);

  const startOperation = useCallback((source?: string): boolean => {
    if (isOperationActive) {
      return false;
    }

    const now = Date.now();
    setSession({
      type: operationType,
      source,
      startedAt: now,
      lastHeartbeat: now,
      tabId
    });

    return true;
  }, [operationType, tabId, setSession, isOperationActive]);

  const stopOperation = useCallback((): void => {
      setSession(null);
  }, [setSession]);

  const cancelOperation = useCallback(async (): Promise<void> => {
    if (!isOperationActive) return;

    try {
      await fetch('/api/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tabId, type: operationType })
      });
    } catch (error) {
      console.error(`Failed to cancel ${operationType}:`, error);
    }

    stopOperation();
  }, [operationType, tabId, stopOperation, isOperationActive]);


  return {
    session,
    tabId,
    isOperationActive,
    isSameType,
    startOperation,
    stopOperation,
    cancelOperation
  };
}
