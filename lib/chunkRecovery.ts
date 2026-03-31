const CHUNK_RELOAD_KEY = 'memorimap:chunk-reload-attempted';

const CHUNK_ERROR_PATTERNS = [
  'Failed to fetch dynamically imported module',
  'Importing a module script failed',
  'ChunkLoadError',
  'Loading chunk',
];

const isChunkErrorMessage = (message?: string | null): boolean => {
  if (!message) return false;
  return CHUNK_ERROR_PATTERNS.some((pattern) => message.includes(pattern));
};

const reloadOnceForChunkError = () => {
  if (typeof window === 'undefined') return;
  if (window.sessionStorage.getItem(CHUNK_RELOAD_KEY) === '1') return;

  window.sessionStorage.setItem(CHUNK_RELOAD_KEY, '1');
  window.location.reload();
};

const extractEventMessage = (event: ErrorEvent): string | null => {
  if (typeof event.message === 'string' && event.message.length > 0) {
    return event.message;
  }

  const target = event.target;
  if (target instanceof HTMLScriptElement) {
    return `Asset load failure: ${target.src || 'unknown asset'}`;
  }

  if (target instanceof HTMLLinkElement) {
    return `Asset load failure: ${target.href || 'unknown asset'}`;
  }

  return null;
};

export const installChunkRecoveryHandlers = () => {
  if (typeof window === 'undefined') return;

  window.sessionStorage.removeItem(CHUNK_RELOAD_KEY);

  window.addEventListener('error', (event) => {
    const message = extractEventMessage(event);
    if (isChunkErrorMessage(message)) {
      reloadOnceForChunkError();
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const message =
      typeof reason === 'string'
        ? reason
        : typeof reason?.message === 'string'
          ? reason.message
          : null;

    if (isChunkErrorMessage(message)) {
      reloadOnceForChunkError();
    }
  });
};
