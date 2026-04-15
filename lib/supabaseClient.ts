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

export async function getAuthClient(
  session: { access_token?: string | null } | null | undefined,
  options?: { strict?: boolean }
): Promise<SupabaseClient> {
  const strict = options?.strict ?? false;
  if (session?.access_token) return supabase;

  const { data: { session: currentSession } } = await supabase.auth.getSession();
  if (currentSession?.access_token) return supabase;

  if (strict) throw new Error('Authenticated session is required.');
  return supabase;
}
