import { supabase } from '../lib/supabaseClient';
export interface Favorite {
    id: string;
    user_id: string;
    facility_id: string;
    created_at: string;
    memorial_spaces?: any; // Join된 시설 정보
}

export const favoriteService = {
    // 즐겨찾기 목록 조회
    async getFavorites(userId: string): Promise<Favorite[]> {
        // 🚑 [Direct Attack] Check session before Supabase call


        try {
            const { data, error } = await supabase
                .from('favorites')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching favorites:', error);
                throw error;
            }
            return data || [];
        } catch (e) {
            console.error('[favoriteService] Exception fetching favorites:', e);
            throw e;
        }
    },

    // 즐겨찾기 여부 확인
    async checkFavorite(userId: string, facilityId: string): Promise<boolean> {


        try {
            const { data, error } = await supabase
                .from('favorites')
                .select('id')
                .eq('user_id', userId)
                .eq('facility_id', facilityId)
                .maybeSingle();

            if (error && error.code !== 'PGRST116') {
                if (error.code === '42501' || (error as any).status === 401) {
                    throw error;
                }
                console.error('Error checking favorite:', error);
            }
            return !!data;
        } catch (e) {
            console.error('Error in checkFavorite:', e);
            return false;
        }
    },

    // 즐겨찾기 추가/삭제 (Toggle)
    async toggleFavorite(userId: string, facilityId: string): Promise<boolean> {


        try {
            // 1. 체크
            const isFav = await this.checkFavorite(userId, facilityId);

            if (isFav) {
                // 삭제
                const { error } = await supabase
                    .from('favorites')
                    .delete()
                    .eq('user_id', userId)
                    .eq('facility_id', facilityId);

                if (error) {
                    console.error('Error toggling favorite:', error);
                    throw error;
                }
                return false;
            } else {
                // 추가
                const { error } = await supabase
                    .from('favorites')
                    .insert({ user_id: userId, facility_id: facilityId });

                if (error) {
                    if (error.code === '42501' || (error as any).status === 401) {
                        throw error;
                    }
                    throw error;
                }
                return true;
            }
        } catch (e: any) {
            // Check if it's already an error object we handled
            if (e.code === '42501' || e.status === 401) {
                throw e;
            }
            throw e;
        }
    }
};
