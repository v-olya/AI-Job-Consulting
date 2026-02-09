export type OperationType = 'scraping' | 'ai-processing';

interface OperationEntry {
  controller: AbortController;
  cleanup: () => void;
  source?: string;
}

const activeControllers = new Map<OperationType, OperationEntry>();

interface RegisteredOperation {
  ok: true;
  controller: AbortController;
  signal: AbortSignal;
  cleanup: () => void;
}

interface RejectedOperation {
  ok: false;
}

export async function withRegisteredOperation<T>(
  options: {
    type: OperationType;
    source?: string;
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

function registerOperation(options: {
  type: OperationType;
  source?: string;
  timeoutMs: number;
  onTimeout?: () => void;
}): RegisteredOperation | RejectedOperation {
  const { type, source, timeoutMs, onTimeout } = options;

  if (activeControllers.has(type)) {
    return { ok: false };
  }

  const controller = new AbortController();

  let cleanedUp = false;

  const cleanup = () => {
    if (cleanedUp) return;
    cleanedUp = true;

    clearTimeout(timeoutId);
    activeControllers.delete(type);
  };

  const timeoutId = setTimeout(() => {
    onTimeout?.();
    controller.abort();
    cleanup();
  }, timeoutMs);

  activeControllers.set(type, { controller, cleanup, source });

  return {
    ok: true,
    controller,
    signal: controller.signal,
    cleanup,
  };
}

export function abortOperation(type: OperationType): boolean {
  const entry = activeControllers.get(type);
  if (!entry) return false;

  entry.controller.abort();
  entry.cleanup();
  return true;
}

export function getActiveOperationInfo(type: OperationType) {
  const entry = activeControllers.get(type);
  if (!entry) return null;
  return {
    isActive: true,
    source: entry.source
  };
}

export function checkAbort(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new Error('Operation cancelled');
  }
}
