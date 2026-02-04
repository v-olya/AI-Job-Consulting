export type OperationType = 'scraping' | 'ai-processing';

const MAX_ACTIVE_CONTROLLERS = 20;

interface OperationEntry {
  controller: AbortController;
  cleanup: () => void;
}

const activeControllers = new Map<string, OperationEntry>();

function getControllerKey(tabId: string, type: OperationType): string {
  return `${tabId}:${type}`;
}

export interface RegisteredOperation {
  ok: true;
  controller: AbortController;
  signal: AbortSignal;
  cleanup: () => void;
}

export interface RejectedOperation {
  ok: false;
}

export type RegisterOperationResult = RegisteredOperation | RejectedOperation;

export async function withRegisteredOperation<T>(
  options: {
    tabId: string;
    type: OperationType;
    timeoutMs: number;
    onTimeout?: () => void;
  },
  fn: (signal: AbortSignal) => Promise<T>
): Promise<{ ok: true; result: T } | { ok: false }> {
  const registered = registerOperation(options);
  if (!registered.ok) {
    return { ok: false };
  }

  try {
    const result = await fn(registered.signal);
    return { ok: true, result };
  } finally {
    registered.cleanup();
  }
}

export function registerOperation(options: {
  tabId: string;
  type: OperationType;
  timeoutMs: number;
  onTimeout?: () => void;
}): RegisterOperationResult {
  const { tabId, type, timeoutMs, onTimeout } = options;

  const key = getControllerKey(tabId, type);
  if (activeControllers.has(key)) {
    return { ok: false };
  }

  if (activeControllers.size >= MAX_ACTIVE_CONTROLLERS) {
    const oldestKey = activeControllers.keys().next().value as string | undefined;
    if (oldestKey) {
      const oldestEntry = activeControllers.get(oldestKey);
      if (oldestEntry) {
        oldestEntry.controller.abort();
        oldestEntry.cleanup();
      }
    }
  }

  const controller = new AbortController();

  let cleanedUp = false;

  const cleanup = () => {
    if (cleanedUp) return;
    cleanedUp = true;

    clearTimeout(timeoutId);
    activeControllers.delete(key);
  };

  const timeoutId = setTimeout(() => {
    onTimeout?.();
    controller.abort();
    cleanup();
  }, timeoutMs);

  activeControllers.set(key, { controller, cleanup });

  return {
    ok: true,
    controller,
    signal: controller.signal,
    cleanup,
  };
}

export function abortOperation(tabId: string, type: OperationType): boolean {
  const key = getControllerKey(tabId, type);
  const entry = activeControllers.get(key);
  if (!entry) return false;

  entry.controller.abort();
  entry.cleanup();
  return true;
}
