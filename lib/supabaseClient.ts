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

// 2. Export a Proxy that always delegates to the 'currentClient'
// This allows us to swap the underlying client (to add auth headers) without breaking imports.
export const supabase = new Proxy({} as SupabaseClient, {
  get: (_, prop) => {
    // @ts-ignore
    const value = currentClient[prop];
    if (typeof value === 'function') {
      return value.bind(currentClient);
    }
    return value;
  }
});

// 3. Helper to inject Clerk Token manually
// This bypasses 'supabase.auth.setSession' which forces UUID validation.
let currentToken: string | null = null;

export const setSupabaseAuth = (token: string | null) => {
  if (token === currentToken) return; // Avoid recreating if token hasn't changed

  currentToken = token;

  if (token) {
    // console.log("🔄 Re-creating Supabase Client with Clerk Token...");
    currentClient = createClient(
      supabaseUrl || 'https://placeholder.supabase.co',
      supabaseAnonKey || 'placeholder-key',
      {
        auth: {
          persistSession: false, // Disable Supabase auth persistence (Clerk handles it)
          autoRefreshToken: false,
          detectSessionInUrl: false,
          storageKey: `clerk-${Date.now()}` // Dynamic key to ensure uniqueness per instance so Supabase doesn't warn about collisions
        },
        global: {
          headers: { Authorization: `Bearer ${token}` }
        }
      }
    );
  } else {
    // Revert to anon
    currentClient = createClient(
      supabaseUrl || 'https://placeholder.supabase.co',
      supabaseAnonKey || 'placeholder-key',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        }
      }
    );
  }
};

export const isSupabaseConfigured = () => {
  return !!supabaseUrl && !!supabaseAnonKey && supabaseUrl !== 'YOUR_SUPABASE_URL';
};