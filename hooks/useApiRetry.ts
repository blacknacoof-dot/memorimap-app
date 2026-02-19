import { useCallback } from 'react';
import { useSession } from '../lib/auth';
import { withRetry, withQueryRetry } from '../lib/apiRetry';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * API 자동 재시도 훅
 * Clerk 세션에서 토큰을 자동으로 가져와 401 시 갱신 후 재시도
 *
 * @example
 * const { callWithRetry, queryWithRetry } = useApiRetry();
 *
 * // throw 패턴 (submitPartnerApplication 등)
 * const result = await callWithRetry((client) => submitPartnerApplication(data, client));
 *
 * // { data, error } 패턴 (supabase.from().select() 등)
 * const { data } = await queryWithRetry((client) =>
 *   (client || supabase).from('facilities').select('*')
 * );
 */
export function useApiRetry() {
  const { session } = useSession();

  const getToken = useCallback(async (): Promise<string | null> => {
    if (!session) return null;
    try {
      return await session.getToken({ template: 'supabase' });
    } catch {
      return null;
    }
  }, [session]);

  /** throw 기반 API 함수 래퍼 */
  const callWithRetry = useCallback(
    <T>(fn: (authClient?: SupabaseClient) => Promise<T>, silent = false): Promise<T> => {
      return withRetry(fn, { getToken, silent });
    },
    [getToken]
  );

  /** { data, error } 기반 Supabase 쿼리 래퍼 */
  const queryWithRetry = useCallback(
    <T>(
      fn: (authClient?: SupabaseClient) => Promise<{ data: T | null; error: any }>,
      silent = false
    ): Promise<{ data: T | null; error: any }> => {
      return withQueryRetry(fn, { getToken, silent });
    },
    [getToken]
  );

  return { callWithRetry, queryWithRetry, getToken };
}
