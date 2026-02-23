import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';
import { toast } from 'sonner';

/**
 * API 자동 재시도 유틸리티
 * - 401 (토큰 만료): Clerk 토큰 갱신 후 재시도
 * - 네트워크 오류: Exponential backoff 재시도
 * - 5xx 서버 오류: 자동 재시도
 */

interface RetryOptions {
  maxRetries?: number;
  /** Clerk session.getToken 함수 */
  getToken?: () => Promise<string | null>;
  /** 재시도 시 토스트 표시 여부 */
  silent?: boolean;
}

/** Supabase 에러에서 HTTP 상태코드 추출 */
function getErrorStatus(error: any): number | null {
  if (error?.status) return error.status;
  if (error?.code === 'PGRST301' || error?.message?.includes('JWT')) return 401;
  if (error?.code === '401') return 401;
  if (error?.message?.includes('Failed to fetch') || error?.message?.includes('NetworkError')) return 0;
  return null;
}

function isRetryableError(error: any): boolean {
  const status = getErrorStatus(error);
  if (status === 0) return true; // 네트워크 오류
  if (status === 401) return true; // 토큰 만료
  if (status !== null && status >= 500) return true; // 서버 오류
  if (error instanceof TypeError && error.message?.includes('fetch')) return true;
  return false;
}

function isAuthError(error: any): boolean {
  const status = getErrorStatus(error);
  return status === 401;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Supabase API 호출을 자동 재시도하는 래퍼
 *
 * @example
 * const data = await withRetry(
 *   (client) => client.from('table').select('*'),
 *   { getToken: () => session.getToken({ template: 'supabase' }) }
 * );
 */
export async function withRetry<T>(
  fn: (authClient?: SupabaseClient) => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries = 3, getToken, silent = false } = options;

  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // 재시도 불가능한 에러는 즉시 throw
      if (!isRetryableError(error) || attempt === maxRetries) {
        throw error;
      }

      // 401: 토큰 갱신 후 새 클라이언트로 재시도
      if (isAuthError(error) && getToken) {
        try {
          const newToken = await getToken();
          if (newToken) {
            const newClient = supabase;
            if (!silent) {
              toast.info('인증을 갱신했습니다.', { duration: 2000 });
            }
            // 갱신된 클라이언트로 즉시 재시도
            return await fn(newClient);
          }
        } catch {
          // 토큰 갱신 실패 → 다음 시도로
        }
      }

      // 네트워크/서버 오류: exponential backoff
      const backoffMs = Math.min(1000 * Math.pow(2, attempt), 8000);
      if (!silent && attempt > 0) {
        toast.info(`네트워크 오류, ${Math.round(backoffMs / 1000)}초 후 재시도...`, { duration: backoffMs });
      }
      await delay(backoffMs);
    }
  }

  throw lastError;
}

/**
 * Supabase 쿼리 결과에서 에러를 자동 감지하고 재시도
 * .from().select() 등의 결과를 감싸서 사용
 *
 * @example
 * const { data } = await withQueryRetry(
 *   (client) => (client || supabase).from('facilities').select('*'),
 *   { getToken }
 * );
 */
export async function withQueryRetry<T>(
  fn: (authClient?: SupabaseClient) => Promise<{ data: T | null; error: any }>,
  options: RetryOptions = {}
): Promise<{ data: T | null; error: any }> {
  const { maxRetries = 3, getToken, silent = false } = options;

  let lastResult: { data: T | null; error: any } = { data: null, error: null };

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const result = await fn();
    lastResult = result;

    if (!result.error) return result;

    // 재시도 불가능하면 즉시 반환
    if (!isRetryableError(result.error) || attempt === maxRetries) {
      return result;
    }

    // 401: 토큰 갱신
    if (isAuthError(result.error) && getToken) {
      try {
        const newToken = await getToken();
        if (newToken) {
          const newClient = supabase;
          if (!silent) {
            toast.info('인증을 갱신했습니다.', { duration: 2000 });
          }
          return await fn(newClient);
        }
      } catch {
        // 갱신 실패 → 다음 시도
      }
    }

    // backoff
    const backoffMs = Math.min(1000 * Math.pow(2, attempt), 8000);
    await delay(backoffMs);
  }

  return lastResult;
}
