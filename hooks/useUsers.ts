import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { fetchAllUsers, updateUserRole, UserProfile } from '@/lib/api/superAdmin';

export function useAllUsers() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await fetchAllUsers();
            setUsers(data);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateRole = async (userId: string, newRole: string) => {
        try {
            await updateUserRole(userId, newRole);
            await fetchUsers(); // Refresh the list
        } catch (error) {
            console.error('Failed to update user role:', error);
            toast.error('권한 변경 중 오류가 발생했습니다.');
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    return {
        users,
        loading,
        refresh: fetchUsers,
        updateRole
    };
}
