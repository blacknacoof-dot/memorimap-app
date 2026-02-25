import { useState, useEffect, useCallback } from 'react';
import { useSession } from '../lib/auth';
import { getAuthClient } from '../lib/supabaseClient';
import type { SupabaseClient } from '@supabase/supabase-js';

interface SuperAdminAuthState {
  client: SupabaseClient | null;
  isSuperAdmin: boolean;
  loading: boolean;
  error: string | null;
  recheck: () => void;
}

export function useSuperAdminAuth(): SuperAdminAuthState {
  const { session } = useSession();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [client, setClient] = useState<SupabaseClient | null>(null);
  const [recheckFlag, setRecheckFlag] = useState(0);

  const recheck = useCallback(() => setRecheckFlag((f) => f + 1), []);

  useEffect(() => {
    let cancelled = false;

    const verify = async () => {
      setLoading(true);
      setError(null);

      if (!session?.access_token) {
        setIsSuperAdmin(false);
        setClient(null);
        setLoading(false);
        setError('로그인이 필요합니다.');
        return;
      }

      try {
        const authClient = await getAuthClient(session, { strict: true });
        const { data, error: rpcError } = await authClient.rpc('is_super_admin');

        if (cancelled) return;

        if (rpcError) {
          setError(`권한 확인 실패: ${rpcError.message}`);
          setIsSuperAdmin(false);
          setClient(null);
        } else if (!data) {
          setError('슈퍼관리자 권한이 없습니다.');
          setIsSuperAdmin(false);
          setClient(null);
        } else {
          setIsSuperAdmin(true);
          setClient(authClient);
          setError(null);
        }
      } catch (err: unknown) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : '인증 오류';
        setError(message);
        setIsSuperAdmin(false);
        setClient(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    verify();
    return () => { cancelled = true; };
  }, [session?.access_token, recheckFlag]);

  return { client, isSuperAdmin, loading, error, recheck };
}
