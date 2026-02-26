import { create } from 'zustand';
import { sangjoFavoriteService } from '../services/sangjoFavoriteService';
import { FuneralCompany } from '../types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { toast } from 'sonner';

interface SangjoFavoriteState {
    favoritedIds: Set<string>;
    isLoading: boolean;

    // Actions — client 파라미터 필수
    fetchFavorites: (userId: string, client: SupabaseClient) => Promise<void>;
    toggleFavorite: (userId: string, company: FuneralCompany, client: SupabaseClient) => Promise<boolean>;
}

export const useSangjoFavoriteStore = create<SangjoFavoriteState>((set) => ({
    favoritedIds: new Set<string>(),
    isLoading: false,

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

        try {
            const isAdded = await sangjoFavoriteService.toggleFavorite(userId, company, client);

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
        } catch {
            toast.error('즐겨찾기 변경에 실패했습니다.');
            return false;
        }
    }
}));
