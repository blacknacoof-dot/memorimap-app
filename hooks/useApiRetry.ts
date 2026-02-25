import { useCallback } from 'react';
import { withRetry, withQueryRetry } from '../lib/apiRetry';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * API 자동 재시도 훅
 * Supabase Auth 기반 — 토큰 갱신은 supabase 클라이언트가 자동 처리
 *
 * @example
 * const { callWithRetry, queryWithRetry } = useApiRetry();
 *
 * // throw 패턴
 * const result = await callWithRetry(() => submitPartnerApplication(data, client));
 *
 * // { data, error } 패턴
 * const { data } = await queryWithRetry(() => client.from('facilities').select('*'));
 */
export function useApiRetry() {
  /** throw 기반 API 함수 래퍼 */
  const callWithRetry = useCallback(
    <T>(fn: () => Promise<T>, silent = false): Promise<T> => {
      return withRetry(fn, { silent });
    },
    []
  );

  /** { data, error } 기반 Supabase 쿼리 래퍼 */
  interface SupabaseQueryError {
    status?: number;
    code?: string;
    message?: string;
  }
  const queryWithRetry = useCallback(
    <T>(
      fn: (authClient?: SupabaseClient) => Promise<{ data: T | null; error: SupabaseQueryError | null }>,
      silent = false
    ): Promise<{ data: T | null; error: SupabaseQueryError | null }> => {
      return withQueryRetry(fn, { silent });
    },
    []
  );

  return { callWithRetry, queryWithRetry };
}
