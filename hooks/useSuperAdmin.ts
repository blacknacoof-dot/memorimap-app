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

        async function checkSuperAdmin() {
            try {
                const { data, error } = await supabase
                    .from('super_admins')
                    .select('user_id, is_active')
                    .eq('user_id', userId)
                    .eq('is_active', true)
                    .single();

                setIsSuperAdmin(!!data && !error);
            } catch {
                setIsSuperAdmin(false);
            } finally {
                setLoading(false);
            }
        }

        checkSuperAdmin();
    }, [userId]);

    return { isSuperAdmin, loading };
}
