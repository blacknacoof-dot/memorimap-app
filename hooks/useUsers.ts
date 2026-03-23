import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useSession } from '@/lib/auth';
import { getAuthClient } from '@/lib/supabaseClient';
import { fetchAllUsers, updateUserRole, UserProfile } from '@/lib/api/superAdmin';

const isTestUserProfile = (profile: Pick<UserProfile, 'email' | 'full_name'>) => {
    const email = profile.email?.toLowerCase() || '';
    const fullName = profile.full_name?.toLowerCase() || '';

    return (
        email.endsWith('@example.com') ||
        email.includes('subscription-flow-') ||
        email.includes('core-flow-') ||
        email.includes('e2e') ||
        fullName.includes('subscription-flow-') ||
        fullName.includes('core-flow-') ||
        fullName.includes('fixture') ||
        fullName.includes('e2e')
    );
};

export function useAllUsers() {
    const { session } = useSession();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [includeTestUsers, setIncludeTestUsers] = useState(false);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const client = await getAuthClient(session, { strict: true });
            const data = await fetchAllUsers(client);
            setUsers(includeTestUsers ? data : data.filter((user) => !isTestUserProfile(user)));
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
        } catch (_error) {
            toast.error('권한 변경 중 오류가 발생했습니다.');
        }
    };

    useEffect(() => {
        if (session) fetchUsers();
    }, [includeTestUsers, session]);

    return {
        users,
        loading,
        refresh: fetchUsers,
        updateRole,
        includeTestUsers,
        setIncludeTestUsers,
    };
}
