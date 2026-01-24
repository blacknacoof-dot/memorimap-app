import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { UserNotification } from '@/types/db';
import { useAuth } from '@clerk/clerk-react';

export function useNotifications() {
    const { userId } = useAuth();
    const queryClient = useQueryClient();

    // 알림 페칭
    const { data: notifications = [], isLoading, refetch } = useQuery({
        queryKey: ['notifications', userId],
        queryFn: async () => {
            if (!userId) return [];
            const { data, error } = await supabase
                .from('user_notifications')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as UserNotification[];
        },
        enabled: !!userId,
    });

    // 읽음 처리 Mutation
    const markAsRead = useMutation({
        mutationFn: async (notificationId: string) => {
            const { error } = await supabase
                .from('user_notifications')
                .update({ is_read: true })
                .eq('id', notificationId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
        },
    });

    // 모두 읽음 처리
    const markAllAsRead = useMutation({
        mutationFn: async () => {
            if (!userId) return;
            const { error } = await supabase
                .from('user_notifications')
                .update({ is_read: true })
                .eq('user_id', userId)
                .eq('is_read', false);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
        },
    });

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return {
        notifications,
        unreadCount,
        isLoading,
        refetch,
        markAsRead: markAsRead.mutate,
        markAllAsRead: markAllAsRead.mutate,
    };
}
