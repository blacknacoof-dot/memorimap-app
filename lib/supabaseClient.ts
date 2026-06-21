import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL or Key is missing.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

let publicAnonClient: SupabaseClient | null = null;

export type SupabaseClientKind = 'authenticated' | 'public-anon' | 'cleanup-after-invalid';

export const getPublicAnonClient = (): SupabaseClient => {
  if (!publicAnonClient) {
    publicAnonClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }
  return publicAnonClient;
};

// Legacy exports kept for older call sites while auth is centralized on the shared client.
export const setSupabaseAuth = async (_token: string | null) => {};

export const createAuthenticatedClient = (_token?: string): SupabaseClient => supabase;

export const resetAuthenticatedClient = (): void => {};

export const getCurrentAccessToken = async (): Promise<string | null> => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
};

export const isSupabaseConfigured = () => {
  return !!supabaseUrl && !!supabaseAnonKey && supabaseUrl !== 'YOUR_SUPABASE_URL';
};

export const AUTH_SESSION_EXPIRED_MESSAGE = 'Authentication session is invalid or expired.';

const AUTH_STORAGE_PREFIXES = ['sb-'] as const;
const AUTH_STORAGE_EXACT_KEYS = ['supabase.auth.token'] as const;

const shouldRemoveAuthStorageKey = (key: string): boolean => (
  AUTH_STORAGE_EXACT_KEYS.includes(key as typeof AUTH_STORAGE_EXACT_KEYS[number]) ||
  AUTH_STORAGE_PREFIXES.some(prefix => key.startsWith(prefix))
);

const clearAuthStorage = (storage: Storage) => {
  const keys: string[] = [];
  for (let i = 0; i < storage.length; i += 1) {
    const key = storage.key(i);
    if (key && shouldRemoveAuthStorageKey(key)) keys.push(key);
  }
  keys.forEach(key => storage.removeItem(key));
};

export function isInvalidAuthSessionError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  const maybeError = error as {
    status?: number;
    code?: string;
    name?: string;
    message?: string;
  };

  const status = maybeError.status;
  const code = maybeError.code || '';
  const name = maybeError.name || '';
  const message = (maybeError.message || '').toLowerCase();

  if (name === 'AuthSessionInvalidError') return true;
  if (code === 'PGRST301') return true;
  if (status === 401) return true;
  if (name === 'AuthApiError' && status === 400 && message.includes('refresh')) return true;

  return (
    message.includes(AUTH_SESSION_EXPIRED_MESSAGE.toLowerCase()) ||
    message.includes('authenticated session is required') ||
    message.includes('invalid jwt') ||
    message.includes('jwt expired') ||
    message.includes('invalid refresh token') ||
    message.includes('refresh_token_not_found') ||
    message.includes('refresh token not found') ||
    message.includes('session_not_found') ||
    message.includes('unauthorized') ||
    message.includes('user from sub claim in jwt does not exist')
  );
}

export async function clearInvalidAuthSession(options: { openLogin?: boolean } = {}) {
  try {
    await supabase.auth.signOut({ scope: 'local' });
  } catch {
    // Storage cleanup below is the fallback for broken refresh-token state.
  }

  if (typeof window !== 'undefined') {
    clearAuthStorage(window.localStorage);
    clearAuthStorage(window.sessionStorage);
    window.dispatchEvent(new Event('memorimap-auth-session-cleared'));
    if (options.openLogin ?? true) {
      window.dispatchEvent(new Event('open-login-modal'));
    }
  }
}

const createInvalidAuthSessionError = () => {
  const error = new Error(AUTH_SESSION_EXPIRED_MESSAGE);
  error.name = 'AuthSessionInvalidError';
  return error;
};

async function ensureCurrentSessionIsUsable(
  accessToken: string,
  options: { openLoginOnInvalid?: boolean } = {}
): Promise<void> {
  const { data, error } = await supabase.auth.getUser(accessToken);
  if (!error && data.user) return;

  if (error && !isInvalidAuthSessionError(error)) {
    throw error;
  }

  const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
  if (!refreshError && refreshed.session?.access_token) {
    const { data: refreshedUser, error: refreshedUserError } = await supabase.auth.getUser(refreshed.session.access_token);
    if (!refreshedUserError && refreshedUser.user) return;
    if (refreshedUserError && !isInvalidAuthSessionError(refreshedUserError)) {
      throw refreshedUserError;
    }
  } else if (refreshError && !isInvalidAuthSessionError(refreshError)) {
    throw refreshError;
  }

  await clearInvalidAuthSession({ openLogin: options.openLoginOnInvalid ?? true });
  throw createInvalidAuthSessionError();
}

export async function getAuthClient(
  session: { access_token?: string | null } | null | undefined,
  options?: { strict?: boolean; openLoginOnInvalid?: boolean }
): Promise<SupabaseClient> {
  const strict = options?.strict ?? false;
  const providedAccessToken = session?.access_token;
  if (providedAccessToken) {
    try {
      await ensureCurrentSessionIsUsable(providedAccessToken, {
        openLoginOnInvalid: options?.openLoginOnInvalid,
      });
      return supabase;
    } catch (error) {
      if (isInvalidAuthSessionError(error)) {
        if (strict) throw error;
        return supabase;
      }
      throw error;
    }
  }

  const { data: { session: currentSession } } = await supabase.auth.getSession();
  if (currentSession?.access_token) {
    try {
      await ensureCurrentSessionIsUsable(currentSession.access_token, {
        openLoginOnInvalid: options?.openLoginOnInvalid,
      });
      return supabase;
    } catch (error) {
      if (isInvalidAuthSessionError(error)) {
        if (strict) throw error;
        return supabase;
      }
      throw error;
    }
  }

  if (strict) throw new Error('Authenticated session is required.');
  return supabase;
}

export async function getConsultationSubmitClient(
  session: { access_token?: string | null } | null | undefined
): Promise<{ client: SupabaseClient; clientKind: SupabaseClientKind }> {
  const providedAccessToken = session?.access_token;
  if (providedAccessToken) {
    try {
      await ensureCurrentSessionIsUsable(providedAccessToken, { openLoginOnInvalid: false });
      return { client: supabase, clientKind: 'authenticated' };
    } catch (error) {
      if (!isInvalidAuthSessionError(error)) throw error;
      await clearInvalidAuthSession({ openLogin: false });
      return { client: getPublicAnonClient(), clientKind: 'cleanup-after-invalid' };
    }
  }

  const { data: { session: currentSession } } = await supabase.auth.getSession();
  if (currentSession?.access_token) {
    try {
      await ensureCurrentSessionIsUsable(currentSession.access_token, { openLoginOnInvalid: false });
      return { client: supabase, clientKind: 'authenticated' };
    } catch (error) {
      if (!isInvalidAuthSessionError(error)) throw error;
      await clearInvalidAuthSession({ openLogin: false });
      return { client: getPublicAnonClient(), clientKind: 'cleanup-after-invalid' };
    }
  }

  return { client: getPublicAnonClient(), clientKind: 'public-anon' };
}
