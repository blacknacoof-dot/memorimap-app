import { create } from 'zustand';
import { sangjoFavoriteService } from '../services/sangjoFavoriteService';
import { FuneralCompany } from '../types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import type { QuotaCheckResult } from '../types/subscription';

interface SangjoFavoriteState {
    favoritedIds: Set<string>;
    isLoading: boolean;
    quotaExceeded: QuotaCheckResult | null;

    // Actions — client 파라미터 필수
    fetchFavorites: (userId: string, client: SupabaseClient) => Promise<void>;
    toggleFavorite: (userId: string, company: FuneralCompany, client: SupabaseClient) => Promise<boolean>;
    clearQuotaExceeded: () => void;
    resetFavoritesState: () => void;
}

export const useSangjoFavoriteStore = create<SangjoFavoriteState>((set) => ({
    favoritedIds: new Set<string>(),
    isLoading: false,
    quotaExceeded: null,

    clearQuotaExceeded: () => set({ quotaExceeded: null }),
    resetFavoritesState: () => set({
        favoritedIds: new Set<string>(),
        isLoading: false,
        quotaExceeded: null,
    }),

    fetchFavorites: async (userId: string, client: SupabaseClient) => {
        if (!userId) return;
        set({ isLoading: true });
        try {
            const favorites = await sangjoFavoriteService.getFavorites(userId, client);
            set({ favoritedIds: new Set(favorites.map(f => f.company_id)) });
        } catch {
            toast.error('즐겨찾기 목록을 불러오지 못했습니다.');
        } finally {
            set({ isLoading: false });
        }
    },

    toggleFavorite: async (userId: string, company: FuneralCompany, client: SupabaseClient) => {
        if (!userId) return false;

        let quotaIncremented = false;

        try {
            // 기존 즐겨찾기 여부 확인
            const isFav = await sangjoFavoriteService.checkFavorite(userId, company.id, client);

            if (!isFav) {
                // 새 추가 → 쿼터 체크
                try {
                    const { data, error } = await client.rpc('check_and_increment_user_quota', {
                        p_quota_type: 'favorite',
                        p_category: 'sangjo',
                    });
                    if (!error && data) {
                        const result = data as QuotaCheckResult;
                        if (!result.allowed) {
                            set({ quotaExceeded: result });
                            toast.error(`즐겨찾기 한도(${result.limit}개)에 도달했습니다.`);
                            return false;
                        }
                        quotaIncremented = true;
                    }
                } catch {
                    // fail-open: 쿼터 체크 실패 시 통과
                }
            }

            const isAdded = await sangjoFavoriteService.toggleFavorite(userId, company, client);

            if (!isAdded) {
                // 삭제 시 카운터 감소
                try {
                    await client.rpc('decrement_user_favorites_count', { p_is_sangjo: true });
                } catch {
                    // decrement 실패 무시
                }
            }

            set((state) => {
                const next = new Set(state.favoritedIds);
                if (isAdded) {
                    next.add(company.id);
                } else {
                    next.delete(company.id);
                }
                return { favoritedIds: next };
            });

            return isAdded;
        } catch (_err) {
            // INSERT 실패 시 이미 증가된 쿼터 롤백
            if (quotaIncremented) {
                try {
                    await client.rpc('decrement_user_favorites_count', { p_is_sangjo: true });
                } catch {
                    // rollback 실패 무시
                }
            }
            toast.error('즐겨찾기 변경에 실패했습니다.');
            return false;
        }
    }
}));
