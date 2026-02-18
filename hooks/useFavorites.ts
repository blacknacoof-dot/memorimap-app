import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import type { UserFavorite, EndingNote, FavoriteAnalysis } from '@/types/favorites';

/**
 * 찜 목록 조회
 */
import { useAuth } from '@clerk/clerk-react';

/**
 * 찜 목록 조회
 */
export function useMyFavorites() {
    const { userId, isSignedIn } = useAuth();

    return useQuery({
        queryKey: ['my-favorites', userId],
        queryFn: async () => {
            const { data, error } = await supabase.rpc('get_my_favorites');
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

    return useMutation({
        mutationFn: async (params: {
            facility_id: string;
            private_memo?: string;
            private_rating?: number;
        }) => {
            const { data, error } = await supabase.rpc('toggle_favorite', {
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
        },
    });
}

/**
 * 찜 해제
 */
export function useRemoveFavorite() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (facilityId: string) => {
            const { data, error } = await supabase.rpc('remove_favorite', {
                p_facility_id: facilityId,
            });
            if (error) throw error;
            return data as boolean;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-favorites'] });
            queryClient.invalidateQueries({ queryKey: ['my-journey'] });
            queryClient.invalidateQueries({ queryKey: ['favorite-analysis'] }); // Also update analysis
        },
    });
}

/**
 * 엔딩 노트 조회
 */
export function useMyEndingNote() {
    return useQuery({
        queryKey: ['my-ending-note'],
        queryFn: async () => {
            const { data, error } = await supabase.rpc('get_my_ending_note');
            if (error) throw error;
            // 리스트로 반환될 수 있으므로 단일 객체 리턴 처리
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

    return useMutation({
        mutationFn: async (params: Partial<EndingNote>) => {
            const { data, error } = await supabase.rpc('upsert_ending_note', {
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
            queryClient.invalidateQueries({ queryKey: ['my-journey'] }); // Updating note creates journey event? Maybe.
        },
    });
}

/**
 * AI 분석 조회
 */
export function useFavoriteAnalysis() {
    return useQuery({
        queryKey: ['favorite-analysis'],
        queryFn: async () => {
            const { data, error } = await supabase.rpc('analyze_favorite_patterns');
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
    return useQuery({
        queryKey: ['admin', 'user-favorites', userId],
        queryFn: async () => {
            const { data, error } = await supabase.rpc('admin_get_user_favorites', {
                p_user_id: userId,
            });
            if (error) throw error;
            return data as UserFavorite[];
        },
        enabled: Boolean(userId),
    });
}
