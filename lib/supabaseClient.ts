import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment-agnostic variable access
const getEnv = (key: string): string => {
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    // @ts-ignore
    return import.meta.env[key] || '';
  }
  return process.env[key] || '';
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Key is missing. Check your environment variables.');
  console.warn('VITE_SUPABASE_URL:', supabaseUrl ? 'SET' : 'MISSING');
  console.warn('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'SET' : 'MISSING');
}

// 1. Create the default anonymous client
let currentClient = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,       // ✅ Session persists across page refresh
      autoRefreshToken: true,     // ✅ Token auto-refresh enabled
      detectSessionInUrl: false,
      storageKey: 'sb-memorimap-auth'  // Unique storage key
    }
  }
);

// 2. Export the single client instance
export const supabase = currentClient;

// 3. Helper to inject Clerk Token manually (Deprecated: use supabase.auth.setSession instead)
export const setSupabaseAuth = async (token: string | null) => {
  if (!token) {
    await supabase.auth.signOut();
    return;
  }

  // 🚑 Hotfix: If it's a mock token (e.g., in development/preview), 
  // skip updating the session to avoid 401 errors from PostgREST.
  if (token.startsWith('mock-')) {
    console.log('[SupabaseAuth] Skipping mock token session update.');
    return;
  }

  await supabase.auth.setSession({
    access_token: token,
    refresh_token: '',
  });
};

export const isSupabaseConfigured = () => {
  return !!supabaseUrl && !!supabaseAnonKey && supabaseUrl !== 'YOUR_SUPABASE_URL';
};