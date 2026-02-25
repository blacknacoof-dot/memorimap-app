import type { SupabaseClient } from '@supabase/supabase-js';
import { toast } from 'sonner';

/**
 * API 자동 재시도 유틸리티
 * - 네트워크 오류: Exponential backoff 재시도
 * - 5xx 서버 오류: 자동 재시도
 * - 401 (토큰 만료): Supabase Auth가 자동 갱신하므로 재시도만 수행
 */

interface RetryOptions {
  maxRetries?: number;
  /** 재시도 시 토스트 표시 여부 */
  silent?: boolean;
}

/** Supabase/Postgrest 에러 형태 */
interface SupabaseErrorLike {
  status?: number;
  code?: string;
  message?: string;
}

/** unknown 값에서 SupabaseErrorLike 형태인지 확인 */
function isSupabaseErrorLike(value: unknown): value is SupabaseErrorLike {
  return typeof value === 'object' && value !== null;
}

/** Supabase 에러에서 HTTP 상태코드 추출 */
function getErrorStatus(error: unknown): number | null {
  if (!isSupabaseErrorLike(error)) return null;
  if (error.status) return error.status;
  if (error.code === 'PGRST301' || error.message?.includes('JWT')) return 401;
  if (error.code === '401') return 401;
  if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) return 0;
  return null;
}

function isRetryableError(error: unknown): boolean {
  const status = getErrorStatus(error);
  if (status === 0) return true; // 네트워크 오류
  if (status === 401) return true; // 토큰 만료 (Supabase Auth 자동 갱신 후 재시도)
  if (status !== null && status >= 500) return true; // 서버 오류
  if (error instanceof TypeError && error.message?.includes('fetch')) return true;
  return false;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Supabase API 호출을 자동 재시도하는 래퍼
 *
 * @example
 * const data = await withRetry(
 *   () => client.from('table').select('*')
 * );
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries = 3, silent = false } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      lastError = error;

      if (!isRetryableError(error) || attempt === maxRetries) {
        throw error;
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

/** Supabase 쿼리 결과 타입 (에러 포함) */
interface QueryResult<T> {
  data: T | null;
  error: SupabaseErrorLike | null;
}

/**
 * Supabase 쿼리 결과에서 에러를 자동 감지하고 재시도
 *
 * @example
 * const { data } = await withQueryRetry(
 *   () => client.from('facilities').select('*')
 * );
 */
export async function withQueryRetry<T>(
  fn: (authClient?: SupabaseClient) => Promise<QueryResult<T>>,
  options: RetryOptions = {}
): Promise<QueryResult<T>> {
  const { maxRetries = 3, silent = false } = options;

  let lastResult: QueryResult<T> = { data: null, error: null };

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const result = await fn();
    lastResult = result;

    if (!result.error) return result;

    if (!isRetryableError(result.error) || attempt === maxRetries) {
      return result;
    }

    // backoff
    const backoffMs = Math.min(1000 * Math.pow(2, attempt), 8000);
    if (!silent && attempt > 0) {
      toast.info(`네트워크 오류, ${Math.round(backoffMs / 1000)}초 후 재시도...`, { duration: backoffMs });
    }
    await delay(backoffMs);
  }

  return lastResult;
}
