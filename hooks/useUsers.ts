import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useSession } from '@/lib/auth';
import { getAuthClient } from '@/lib/supabaseClient';
import { fetchAllUsers, updateUserRole, UserProfile } from '@/lib/api/superAdmin';

export function useAllUsers() {
    const { session } = useSession();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const client = await getAuthClient(session, { strict: true });
            const data = await fetchAllUsers(client);
            setUsers(data);
        } catch {
            toast.error('유저 목록 로딩 실패');
        } finally {
            setLoading(false);
        }
    };

    const updateRole = async (userId: string, newRole: string, actorId?: string) => {
        try {
            const client = await getAuthClient(session, { strict: true });
            await updateUserRole(userId, newRole, client, actorId);
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
