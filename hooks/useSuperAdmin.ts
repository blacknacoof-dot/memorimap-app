import { useEffect, useState } from 'react';
import { useAuth, useSession } from '../lib/auth';
import { supabase, createAuthenticatedClient } from '@/lib/supabaseClient';

export function useSuperAdmin() {
    const { userId } = useAuth();
    const { session } = useSession();
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) {
            setIsSuperAdmin(false);
            setLoading(false);
            return;
        }

        const checkAdmin = async () => {
            try {
                // 인증 클라이언트로 RPC 호출 (RLS 통과 필요)
                let client = supabase;
                if (session) {
                    try {
                        const token = await session.getToken({ template: 'supabase' });
                        if (token) client = createAuthenticatedClient(token);
                    } catch { /* fallback to anon */ }
                }

                const { data, error } = await client.rpc('is_super_admin');
                if (error) {
                    console.error('[useSuperAdmin] RPC check failed:', error);
                    setIsSuperAdmin(false);
                } else {
                    setIsSuperAdmin(data === true);
                }
            } catch (err) {
                console.error('[useSuperAdmin] Unexpected error:', err);
                setIsSuperAdmin(false);
            } finally {
                setLoading(false);
            }
        };

        checkAdmin();
    }, [userId, session]);

    return { isSuperAdmin, loading };
}

