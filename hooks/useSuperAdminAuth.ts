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

const SUPER_ADMIN_RPC_TIMEOUT_MS = 12000;

function withTimeout<T>(promise: PromiseLike<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`is_super_admin RPC timeout (${timeoutMs}ms)`));
    }, timeoutMs);

    Promise.resolve(promise)
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

function shouldRetryRpcWithoutArgs(message?: string): boolean {
  if (!message) return false;
  const normalized = message.toLowerCase();
  return (
    normalized.includes('is_super_admin') &&
    (
      normalized.includes('could not find the function') ||
      normalized.includes('no function matches') ||
      normalized.includes('pgrst202') ||
      normalized.includes('pgrst301')
    )
  );
}

function parseIsSuperAdminResult(data: unknown): boolean {
  if (typeof data === 'boolean') return data;

  if (Array.isArray(data)) {
    const first = data[0];
    if (typeof first === 'boolean') return first;
    if (first && typeof first === 'object') {
      const record = first as Record<string, unknown>;
      if (typeof record.is_super_admin === 'boolean') return record.is_super_admin;
      if (typeof record.result === 'boolean') return record.result;
      if (typeof record.exists === 'boolean') return record.exists;
    }
    return Boolean(first);
  }

  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    if (typeof record.is_super_admin === 'boolean') return record.is_super_admin;
    if (typeof record.result === 'boolean') return record.result;
    if (typeof record.exists === 'boolean') return record.exists;
  }

  return Boolean(data);
}

export function useSuperAdminAuth(): SuperAdminAuthState {
  const { session } = useSession();
  const accessToken = session?.access_token ?? null;
  const userId = session?.user?.id ?? null;
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

      if (!accessToken) {
        setIsSuperAdmin(false);
        setClient(null);
        setLoading(false);
        setError('Login is required.');
        return;
      }

      try {
        const authClient = await getAuthClient({ access_token: accessToken }, { strict: true });
        const runCheck = (args?: Record<string, unknown>) =>
          withTimeout(authClient.rpc('is_super_admin', args), SUPER_ADMIN_RPC_TIMEOUT_MS);

        let rpcResult = await runCheck(userId ? { p_user_id: userId } : undefined);
        if (rpcResult.error && shouldRetryRpcWithoutArgs(rpcResult.error.message)) {
          rpcResult = await runCheck();
        }
        if (rpcResult.error && userId && shouldRetryRpcWithoutArgs(rpcResult.error.message)) {
          rpcResult = await runCheck({ check_user_id: userId });
        }

        if (cancelled) return;

        if (rpcResult.error) {
          setError(`Failed to verify super admin permission: ${rpcResult.error.message}`);
          setIsSuperAdmin(false);
          setClient(null);
          return;
        }

        const hasSuperAdminPermission = parseIsSuperAdminResult(rpcResult.data);
        if (!hasSuperAdminPermission) {
          setError('Super admin permission is missing.');
          setIsSuperAdmin(false);
          setClient(null);
        } else {
          setIsSuperAdmin(true);
          setClient(authClient);
          setError(null);
        }
      } catch (err: unknown) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        setIsSuperAdmin(false);
        setClient(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    verify();
    return () => { cancelled = true; };
  }, [accessToken, userId, recheckFlag]);

  return { client, isSuperAdmin, loading, error, recheck };
}
