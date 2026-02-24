import { create } from 'zustand';
import { sangjoFavoriteService } from '../services/sangjoFavoriteService';
import { FuneralCompany } from '../types';
import type { SupabaseClient } from '@supabase/supabase-js';

interface SangjoFavoriteState {
    favoritedIds: Set<string>;
    isLoading: boolean;

    // Actions
    fetchFavorites: (userId: string) => Promise<void>;
    toggleFavorite: (userId: string, company: FuneralCompany, client: SupabaseClient) => Promise<boolean>;
}

export const useSangjoFavoriteStore = create<SangjoFavoriteState>((set) => ({
    favoritedIds: new Set<string>(),
    isLoading: false,

    fetchFavorites: async (userId: string) => {
        if (!userId) return;
        set({ isLoading: true });
        try {
            const favorites = await sangjoFavoriteService.getFavorites(userId);
            set({ favoritedIds: new Set(favorites.map(f => f.company_id)) });
        } catch (error) {
            console.error('Failed to fetch sangjo favorites:', error);
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
        } catch (error) {
            console.error('Failed to toggle sangjo favorite:', error);
            return false;
        }
    }
}));
