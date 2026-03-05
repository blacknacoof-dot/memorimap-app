import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { getAuthClient } from '@/lib/supabaseClient';
import { UserNotification } from '@/types/db';
import { useAuth, useSession } from '../lib/auth';

export function useNotifications() {
    const { userId } = useAuth();
    const { session } = useSession();
    const queryClient = useQueryClient();

    // 알림 페칭 (auth client — 개인 데이터)
    const { data: notifications = [], isLoading, refetch } = useQuery({
        queryKey: ['notifications', userId],
        queryFn: async () => {
            if (!userId || !session) return [];
            const client = await getAuthClient(session, { strict: true });
            const { data, error } = await client
                .from('user_notifications')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as UserNotification[];
        },
        enabled: !!userId && !!session,
    });

    // 실시간 구독 [Realtime Sync] — auth client
    useEffect(() => {
        if (!userId || !session) return;

        let mounted = true;
        let cleanup: (() => void) | undefined;

        getAuthClient(session).then(client => {
            if (!mounted) return;
            const channel = client
                .channel(`notif-${userId}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'user_notifications',
                        filter: `user_id=eq.${userId}`
                    },
                    () => { refetch(); }
                )
                .subscribe();

            cleanup = () => {
                channel.unsubscribe();
                client.removeChannel(channel);
            };
        });

        return () => { mounted = false; cleanup?.(); };
    }, [userId, session, refetch]);

    // 읽음 처리 Mutation
    const markAsRead = useMutation({
        mutationFn: async (notificationId: string) => {
            const client = await getAuthClient(session, { strict: true });
            const { error } = await client
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
            const client = await getAuthClient(session, { strict: true });
            const { error } = await client
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

    // 개별 삭제
    const deleteNotification = useMutation({
        mutationFn: async (notificationId: string) => {
            const client = await getAuthClient(session, { strict: true });
            const { error } = await client
                .from('user_notifications')
                .delete()
                .eq('id', notificationId);

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
        deleteNotification: deleteNotification.mutate,
    };
}
