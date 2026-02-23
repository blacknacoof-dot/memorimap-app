import { useEffect, useState } from 'react';
import { useAuth, useSession } from '../lib/auth';
import { getAuthClient } from '@/lib/supabaseClient';

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
                const client = await getAuthClient(session, { strict: true });
                const { data, error } = await client.rpc('is_super_admin');
                if (error) {
                    setIsSuperAdmin(false);
                } else {
                    setIsSuperAdmin(data === true);
                }
            } catch {
                setIsSuperAdmin(false);
            } finally {
                setLoading(false);
            }
        };

        checkAdmin();
    }, [userId, session]);

    return { isSuperAdmin, loading };
}

