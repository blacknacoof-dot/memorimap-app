import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useSession } from '@/lib/auth';
import { supabase, createAuthenticatedClient } from '@/lib/supabaseClient';
import { fetchAllUsers, updateUserRole, UserProfile } from '@/lib/api/superAdmin';

async function getAuthClient(session: any) {
    try {
        const token = await session?.getToken?.({ template: 'supabase' });
        if (token) return createAuthenticatedClient(token);
    } catch { /* fallback */ }
    return supabase;
}

export function useAllUsers() {
    const { session } = useSession();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const client = await getAuthClient(session);
            const data = await fetchAllUsers(client);
            setUsers(data);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateRole = async (userId: string, newRole: string) => {
        try {
            const client = await getAuthClient(session);
            await updateUserRole(userId, newRole, client);
            toast.success('권한이 변경되었습니다.');
            await fetchUsers();
        } catch (error) {
            toast.error('권한 변경 중 오류가 발생했습니다.');
        }
    };

    useEffect(() => {
        if (session) fetchUsers();
    }, [session]);

    return {
        users,
        loading,
        refresh: fetchUsers,
        updateRole
    };
}
