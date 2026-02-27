import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAuthClient } from '@/lib/supabaseClient';
import type { UserFavorite, EndingNote, FavoriteAnalysis } from '@/types/favorites';
import { useAuth, useSession } from '../lib/auth';
import { useQuotaGate } from './useQuotaGate';

/**
 * 찜 목록 조회
 */
export function useMyFavorites() {
    const { userId, isSignedIn } = useAuth();
    const { session } = useSession();

    return useQuery({
        queryKey: ['my-favorites', userId],
        queryFn: async () => {
            const client = await getAuthClient(session, { strict: true });
            const { data, error } = await client.rpc('get_my_favorites');
            if (error) {
                throw error;
            }
            return data as UserFavorite[];
        },
        staleTime: 2 * 60 * 1000,
        enabled: !!isSignedIn && !!userId,
    });
}

/**
 * 찜 추가/토글
 */
export function useToggleFavorite() {
    const queryClient = useQueryClient();
    const { session } = useSession();
    const { checkQuota } = useQuotaGate();

    return useMutation({
        mutationFn: async (params: {
            facility_id: string;
            private_memo?: string;
            private_rating?: number;
        }) => {
            const client = await getAuthClient(session, { strict: true });

            // 기존 즐겨찾기 여부 확인
            const { data: existing } = await client
                .from('user_favorites')
                .select('id')
                .eq('facility_id', params.facility_id)
                .maybeSingle();

            // 새 추가인 경우 쿼터 체크
            if (!existing) {
                const result = await checkQuota('favorite', 'facility');
                if (!result.allowed) {
                    throw Object.assign(new Error('즐겨찾기 한도에 도달했습니다.'), {
                        quotaExceeded: true,
                        current: result.current,
                        limit: result.limit,
                    });
                }
            }

            const { data, error } = await client.rpc('toggle_favorite', {
                p_facility_id: params.facility_id,
                p_private_memo: params.private_memo,
                p_private_rating: params.private_rating,
            });
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-favorites'] });
            queryClient.invalidateQueries({ queryKey: ['my-journey'] });
            queryClient.invalidateQueries({ queryKey: ['favorite-analysis'] });
            queryClient.invalidateQueries({ queryKey: ['user-plan'] });
        },
    });
}

/**
 * 찜 해제
 */
export function useRemoveFavorite() {
    const queryClient = useQueryClient();
    const { session } = useSession();
    const { decrementFavorite } = useQuotaGate();

    return useMutation({
        mutationFn: async (facilityId: string) => {
            const client = await getAuthClient(session, { strict: true });
            const { data, error } = await client.rpc('remove_favorite', {
                p_facility_id: facilityId,
            });
            if (error) throw error;
            return data as boolean;
        },
        onSuccess: () => {
            decrementFavorite(false);
            queryClient.invalidateQueries({ queryKey: ['my-favorites'] });
            queryClient.invalidateQueries({ queryKey: ['my-journey'] });
            queryClient.invalidateQueries({ queryKey: ['favorite-analysis'] });
            queryClient.invalidateQueries({ queryKey: ['user-plan'] });
        },
    });
}

/**
 * 엔딩 노트 조회
 */
export function useMyEndingNote() {
    const { session } = useSession();

    return useQuery({
        queryKey: ['my-ending-note'],
        queryFn: async () => {
            const client = await getAuthClient(session, { strict: true });
            const { data, error } = await client.rpc('get_my_ending_note');
            if (error) throw error;
            if (Array.isArray(data)) {
                return (data[0] || null) as EndingNote | null;
            }
            return (data || null) as EndingNote | null;
        },
        staleTime: 5 * 60 * 1000,
    });
}

/**
 * 엔딩 노트 저장
 */
export function useUpsertEndingNote() {
    const queryClient = useQueryClient();
    const { session } = useSession();

    return useMutation({
        mutationFn: async (params: Partial<EndingNote>) => {
            const client = await getAuthClient(session, { strict: true });
            const { data, error } = await client.rpc('upsert_ending_note', {
                p_preferred_method: params.preferred_method,
                p_emergency_contact_name: params.emergency_contact_name,
                p_emergency_contact_phone: params.emergency_contact_phone,
                p_emergency_contact_relation: params.emergency_contact_relation,
                p_final_message: params.final_message,
                p_photo_preference: params.photo_preference,
            });
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-ending-note'] });
            queryClient.invalidateQueries({ queryKey: ['my-journey'] });
        },
    });
}

/**
 * AI 분석 조회
 */
export function useFavoriteAnalysis() {
    const { session } = useSession();

    return useQuery({
        queryKey: ['favorite-analysis'],
        queryFn: async () => {
            const client = await getAuthClient(session, { strict: true });
            const { data, error } = await client.rpc('analyze_favorite_patterns');
            if (error) throw error;
            return data as FavoriteAnalysis;
        },
        staleTime: 5 * 60 * 1000,
    });
}

/**
 * [관리자] 특정 사용자의 찜 목록 조회
 */
export function useAdminUserFavorites(userId: string) {
    const { session } = useSession();

    return useQuery({
        queryKey: ['admin', 'user-favorites', userId],
        queryFn: async () => {
            const client = await getAuthClient(session, { strict: true });
            const { data, error } = await client.rpc('admin_get_user_favorites', {
                p_user_id: userId,
            });
            if (error) throw error;
            return data as UserFavorite[];
        },
        enabled: Boolean(userId),
    });
}
