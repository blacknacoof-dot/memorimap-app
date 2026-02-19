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
  console.warn('Supabase URL or Key is missing.');
}

// 싱글톤 인스턴스 및 상태 관리
let supabaseInstance: SupabaseClient | null = null;
let currentAccessToken: string | null = null;

// Supabase 클라이언트 생성 함수 (싱글톤 패턴)
// [Security Fix] 토큰 변경 시 인스턴스를 재생성하여 내부 헤더 직접 조작 제거
const createSupabaseClient = (token?: string | null): SupabaseClient => {
  // 토큰이 동일하면 기존 인스턴스 재사용
  if (supabaseInstance && token === currentAccessToken) {
    return supabaseInstance;
  }

  // 토큰 변경 또는 최초 생성 — 새 인스턴스 생성
  const client = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-key',
    {
      auth: {
        persistSession: false, // 로컬 스토리지 사용 금지 (Clerk 연동)
        autoRefreshToken: false, // Clerk이 관리하므로 자동 갱신 불필요
        detectSessionInUrl: false,
        storageKey: `memorimap-auth-${Date.now()}`, // Prevent "Multiple GoTrueClient" warning
      },
      global: {
        headers: token ? {
          Authorization: `Bearer ${token}`,
        } : {},
        fetch: (...args) => fetch(...args),
      },
    }
  );

  supabaseInstance = client;
  return client;
};

// Proxy를 통한 싱글톤 접근 (외부 참조 유지용)
export const supabase = new Proxy({} as SupabaseClient, {
  get: (_target, prop) => {
    // 인스턴스가 없으면 (아직 로그인 전이라도) 생성해서 반환
    const instance = supabaseInstance || createSupabaseClient();
    const value = (instance as any)[prop];
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
  },
});

// [FINAL FIX v2] 토큰 업데이트 - 인스턴스 재사용 (Header Mutation Only)
// auth.setSession은 Supabase User를 fetch하려고 시도하다가 Clerk 토큰에서 400 에러를 발생시킵니다.
// 따라서 단순히 PostgREST 요청에 필요한 헤더만 교체하는 것이 가장 안전하고 확실합니다.
export const setSupabaseAuth = async (token: string | null) => {
  if (token === currentAccessToken && supabaseInstance) {
    return;
  }

  if (token?.startsWith('mock-')) {
    return;
  }

  // [Bug Fix] createSupabaseClient 호출 전에 currentAccessToken을 변경하면
  // 내부 비교(token === currentAccessToken)가 항상 true → 인스턴스 재생성 안됨
  // 따라서 호출 후에 업데이트해야 함
  createSupabaseClient(token);
  currentAccessToken = token;
};

// [NEW] 캐싱된 인증 클라이언트 및 토큰
let cachedAuthClient: SupabaseClient | null = null;
let cachedToken: string | null = null;
let clientInstanceCounter = 0;

/**
 * JWT 토큰 유효성 검증
 * @param token - JWT 토큰
 * @returns 토큰이 유효한지 여부
 */
function isTokenValid(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

// [NEW] 토큰 기반으로 즉석에서 인증된 클라이언트 생성 (캐싱 적용)
export const createAuthenticatedClient = (token: string): SupabaseClient => {
  // 토큰이 동일하고 유효한 경우 재사용
  if (cachedAuthClient && cachedToken === token && isTokenValid(token)) {
    return cachedAuthClient;
  }

  // Generate unique storage key to prevent "Multiple GoTrueClient instances" warning
  // This is safe since we disable session persistence anyway
  clientInstanceCounter++;
  const uniqueStorageKey = `clerk-sync-auth-${clientInstanceCounter}-${Date.now()}`;

  const client = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-key',
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
        // Unique storage key prevents "Multiple GoTrueClient instances" warning
        storageKey: uniqueStorageKey,
      },
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    }
  );

  // 캐시 업데이트
  cachedAuthClient = client;
  cachedToken = token;

  return client;
};

/**
 * 인증된 클라이언트 초기화 (로그아웃 시 호출)
 */
export const resetAuthenticatedClient = (): void => {
  cachedAuthClient = null;
  cachedToken = null;
  clientInstanceCounter = 0;
};

/**
 * 현재 저장된 액세스 토큰 반환
 */
export const getCurrentAccessToken = (): string | null => currentAccessToken;

export const isSupabaseConfigured = () => {
  return !!supabaseUrl && !!supabaseAnonKey && supabaseUrl !== 'YOUR_SUPABASE_URL';
};
