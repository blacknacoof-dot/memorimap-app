import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { getAuthClient } from '@/lib/supabaseClient';
import { UserNotification } from '@/types/db';
import { useAuth, useSession } from '../lib/auth';
import { toast } from 'sonner';
import { logger } from '../utils/logger';

export function useNotifications() {
    const { userId } = useAuth();
    const { session } = useSession();
    const queryClient = useQueryClient();

    // 알림 페칭 (auth client — 개인 데이터)
    const { data: notifications = [], isLoading, refetch, error } = useQuery({
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

    useEffect(() => {
        if (!error || !userId) return;
        logger.error('Failed to fetch notifications', { userId, error });
        toast.error('알림을 불러오지 못했습니다. "다시 불러오기"를 눌러 재시도하고, 반복되면 고객센터로 문의해 주세요.');
    }, [error, userId]);

    // ✅ [3-2] 실시간 구독 — channelRef로 cleanup race 수정
    useEffect(() => {
        if (!userId || !session) return;

        let mounted = true;
        // ✅ [3-2] Promise 외부에 channelRef 선언 — cleanup이 즉시 해제 가능
        let channelRef: ReturnType<Awaited<ReturnType<typeof getAuthClient>>['channel']> | null = null;

        getAuthClient(session)
            .then(client => {
                if (!mounted) return;
                channelRef = client
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
            })
            .catch((channelError: unknown) => {
                logger.error('Failed to subscribe to notification channel', { userId, error: channelError });
                toast.error('실시간 알림 연결에 실패했습니다. 알림을 수동으로 다시 불러오고, 반복되면 고객센터로 문의해 주세요.');
            });

        return () => {
            mounted = false;
            // ✅ [3-2] 채널이 이미 생성됐으면 즉시 해제
            channelRef?.unsubscribe();
        };
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
        onError: (mutationError: unknown) => {
            logger.error('Failed to mark notification as read', { userId, error: mutationError });
            toast.error('알림 읽음 처리에 실패했습니다. 잠시 후 다시 시도하고, 반복되면 고객센터로 문의해 주세요.');
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
        onError: (mutationError: unknown) => {
            logger.error('Failed to mark all notifications as read', { userId, error: mutationError });
            toast.error('전체 읽음 처리에 실패했습니다. 잠시 후 다시 시도하고, 반복되면 고객센터로 문의해 주세요.');
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
        onError: (mutationError: unknown) => {
            logger.error('Failed to delete notification', { userId, error: mutationError });
            toast.error('알림 삭제에 실패했습니다. 잠시 후 다시 시도하고, 반복되면 고객센터로 문의해 주세요.');
        },
    });

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return {
        notifications,
        unreadCount,
        isLoading,
        notificationLoadError: error ? '알림을 불러오지 못했습니다.' : null,
        retryNotifications: () => { void refetch(); },
        refetch,
        markAsRead: markAsRead.mutate,
        markAllAsRead: markAllAsRead.mutate,
        deleteNotification: deleteNotification.mutate,
    };
}
