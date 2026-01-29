import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Vite requires STATIC references to import.meta.env.VITE_* for build-time replacement
// Dynamic access like import.meta.env[key] does NOT work!
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

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
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storageKey: 'sb-anon-client'
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

  await supabase.auth.setSession({
    access_token: token,
    refresh_token: '',
  });
};

export const isSupabaseConfigured = () => {
  return !!supabaseUrl && !!supabaseAnonKey && supabaseUrl !== 'YOUR_SUPABASE_URL';
};