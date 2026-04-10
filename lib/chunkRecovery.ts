const CHUNK_RELOAD_KEY = 'memorimap:chunk-reload-attempted';
const DEFAULT_INDEX_PATH = '/';

const CHUNK_ERROR_PATTERNS = [
  'failed to fetch dynamically imported module',
  'importing a module script failed',
  'chunkloaderror',
  'loading chunk',
  'asset load failure',
  'error loading dynamically imported module',
];

const normalizeMessage = (message?: string | null): string => (message || '').toLowerCase();

const isAssetReference = (message: string): boolean =>
  message.includes('/assets/') && (message.includes('.js') || message.includes('.css'));

const isChunkErrorMessage = (message?: string | null): boolean => {
  const normalized = normalizeMessage(message);
  if (!normalized) return false;

  if (CHUNK_ERROR_PATTERNS.some((pattern) => normalized.includes(pattern))) {
    return true;
  }

  return isAssetReference(normalized) && (
    normalized.includes('404')
    || normalized.includes('failed')
    || normalized.includes('error')
  );
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

const extractRejectionMessage = (reason: unknown): string | null => {
  if (typeof reason === 'string') {
    return reason;
  }

  if (reason && typeof reason === 'object') {
    const maybeMessage = (reason as { message?: unknown }).message;
    if (typeof maybeMessage === 'string') {
      return maybeMessage;
    }

    const maybeStack = (reason as { stack?: unknown }).stack;
    if (typeof maybeStack === 'string') {
      return maybeStack;
    }
  }

  return null;
};

const extractEntrySrcFromHtml = (html: string): string | null => {
  const entryMatch = html.match(/<script[^>]+type="module"[^>]+src="([^"]+)"/i);
  return entryMatch?.[1] ?? null;
};

const toAbsoluteUrl = (path: string): string => new URL(path, window.location.origin).href;

interface ChunkRecoveryOptions {
  currentEntryUrl?: string;
  indexPath?: string;
}

export const installChunkRecoveryHandlers = ({
  currentEntryUrl,
  indexPath = DEFAULT_INDEX_PATH,
}: ChunkRecoveryOptions = {}) => {
  if (typeof window === 'undefined') return;

  window.sessionStorage.removeItem(CHUNK_RELOAD_KEY);

  let isCheckingForUpdate = false;

  const verifyCurrentEntry = async () => {
    if (!currentEntryUrl || isCheckingForUpdate) return;

    isCheckingForUpdate = true;

    try {
      const response = await fetch(indexPath, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
      });

      if (!response.ok) return;

      const html = await response.text();
      const nextEntrySrc = extractEntrySrcFromHtml(html);
      if (!nextEntrySrc) return;

      const absoluteNextEntryUrl = toAbsoluteUrl(nextEntrySrc);
      if (absoluteNextEntryUrl !== currentEntryUrl) {
        reloadOnceForChunkError();
      }
    } catch {
      // Network/cache validation failure should not block the current session.
    } finally {
      isCheckingForUpdate = false;
    }
  };

  window.addEventListener('error', (event) => {
    const message = extractEventMessage(event);
    if (isChunkErrorMessage(message)) {
      reloadOnceForChunkError();
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    const message = extractRejectionMessage(event.reason);

    if (isChunkErrorMessage(message)) {
      reloadOnceForChunkError();
    }
  });

  window.addEventListener('focus', () => {
    void verifyCurrentEntry();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      void verifyCurrentEntry();
    }
  });
};
