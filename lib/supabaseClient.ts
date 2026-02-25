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

/**
 * 중앙 인증 클라이언트 헬퍼.
 * Supabase Auth가 JWT를 자동 관리하므로 싱글톤 클라이언트를 반환.
 * - strict: true → 세션(access_token) 없으면 throw (관리자/쓰기 작업)
 * - strict: false (기본) → 세션 없으면 anon supabase 반환 (읽기 등 fallback OK)
 */
export async function getAuthClient(
  session: { access_token?: string | null } | null | undefined,
  options?: { strict?: boolean }
): Promise<SupabaseClient> {
  const strict = options?.strict ?? false;
  if (!session?.access_token) {
    if (strict) throw new Error('인증 세션이 필요합니다.');
    return supabase;
  }
  return supabase;
}
