import { useLocalStorage } from 'usehooks-ts';
import { useEffect, useMemo, useState, useRef } from 'react';

export interface ScrapingSession {
  source: string;
  startedAt: number;
  lastHeartbeat: number;
  tabId: string;
}

const STORAGE_KEY = 'scraping-session';
const SESSION_TIMEOUT_MS = 2 * 60 * 1000;
const HEARTBEAT_INTERVAL_MS = 5000;

function generateTabId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function useScrapingState() {
  const [session, setSession] = useLocalStorage<ScrapingSession | null>(STORAGE_KEY, null);
  const [tabId] = useState(generateTabId);
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

  const isScrapingActive = session !== null;

  const isOwnSession = useMemo(() => {
    return session?.tabId === tabId;
  }, [session, tabId]);

  const canStartScraping = useMemo(() => {
    return !isScrapingActive || isOwnSession;
  }, [isScrapingActive, isOwnSession]);

  const startScraping = (source: string): boolean => {
    if (!canStartScraping) {
      return false;
    }

    const now = Date.now();
    setSession({
      source,
      startedAt: now,
      lastHeartbeat: now,
      tabId
    });

    return true;
  };

  const stopScraping = (): void => {
    if (isOwnSession) {
      setSession(null);
    }
  };

  const cancelScraping = async (): Promise<void> => {
    if (!isOwnSession) return;

    try {
      await fetch('/api/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tabId })
      });
    } catch (error) {
      console.error('Failed to cancel scraping:', error);
    }

    stopScraping();
  };

  const forceStopSession = (): void => {
    if (session?.tabId) {
      fetch('/api/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tabId: session.tabId })
      }).catch(error => {
        console.error('Failed to cancel backend session:', error);
      });
    }
    setSession(null);
  };

  useEffect(() => {
    return () => {
      if (isOwnSession && session) {
        const blob = new Blob(
          [JSON.stringify({ tabId: session.tabId })],
          { type: 'application/json' }
        );
        navigator.sendBeacon('/api/cancel', blob);
      }
    };
  }, [isOwnSession, session]);

  return {
    session,
    tabId,
    isScrapingActive,
    isOwnSession,
    canStartScraping,
    startScraping,
    stopScraping,
    cancelScraping,
    forceStopSession
  };
}
