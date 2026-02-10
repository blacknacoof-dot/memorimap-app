import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { supabase } from '@/lib/supabaseClient';

export function useSuperAdmin() {
    const { userId } = useAuth();
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
                // ✅ [Security Fix] RPC 기반 서버 측 검증 (기존: 직접 테이블 SELECT)
                const { data, error } = await supabase.rpc('is_super_admin', { p_user_id: userId });
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
    }, [userId]);

    return { isSuperAdmin, loading };
}

