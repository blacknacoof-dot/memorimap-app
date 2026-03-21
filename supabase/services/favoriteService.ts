import type { SupabaseClient } from '@supabase/supabase-js';

export interface Favorite {
    id: string;
    user_id: string;
    facility_id: string;
    created_at: string;
    memorial_spaces?: {
        id: number;
        name: string;
        address: string;
        category: string;
        description?: string | null;
        image_urls?: string[];
        verified: boolean;
    } | null;
}

export const favoriteService = {
    // 즐겨찾기 목록 조회 (auth client 필수)
    async getFavorites(userId: string, client: SupabaseClient): Promise<Favorite[]> {
        const { data, error } = await client
            .from('favorites')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            throw error;
        }
        return data || [];
    },

    // 즐겨찾기 여부 확인 (auth client 필수)
    async checkFavorite(userId: string, facilityId: string, client: SupabaseClient): Promise<boolean> {
        try {
            const { data, error } = await client
                .from('favorites')
                .select('id')
                .eq('user_id', userId)
                .eq('facility_id', facilityId)
                .maybeSingle();

            if (error && error.code !== 'PGRST116') {
                // error('Error checking favorite:', error);
            }
            return !!data;
        } catch (_e) {
            // error('Error in checkFavorite:', e);
            return false;
        }
    },

    // 즐겨찾기 추가/삭제 (Toggle)
    async toggleFavorite(userId: string, facilityId: string, client: SupabaseClient): Promise<boolean> {
        const isFav = await this.checkFavorite(userId, facilityId, client);

        if (isFav) {
            const { error } = await client
                .from('favorites')
                .delete()
                .eq('user_id', userId)
                .eq('facility_id', facilityId);

            if (error) {
                // error('Error toggling favorite:', error);
                throw error;
            }
            return false;
        } else {
            const { error } = await client
                .from('favorites')
                .insert({ user_id: userId, facility_id: facilityId });

            if (error) {
                // error('Error adding favorite:', error);
                throw error;
            }
            return true;
        }
    }
};
