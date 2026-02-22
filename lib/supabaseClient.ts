import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Key is missing.');
}

// Single Supabase client — session auto-managed
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// --- Backward-compatible exports (no-ops) ---
// These kept so consumer files don't need immediate changes.
// createAuthenticatedClient just returns the singleton — Supabase Auth
// handles the session/token automatically.

/** @deprecated No longer needed. Supabase Auth auto-manages tokens. */
export const setSupabaseAuth = async (_token: string | null) => {};

/** @deprecated Returns the shared supabase client. Token param is ignored. */
export const createAuthenticatedClient = (_token?: string): SupabaseClient => supabase;

/** @deprecated No-op. */
export const resetAuthenticatedClient = (): void => {};

/** @deprecated Prefer supabase.auth.getSession(). This helper exists for non-hook code. */
export const getCurrentAccessToken = async (): Promise<string | null> => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
};

export const isSupabaseConfigured = () => {
  return !!supabaseUrl && !!supabaseAnonKey && supabaseUrl !== 'YOUR_SUPABASE_URL';
};
