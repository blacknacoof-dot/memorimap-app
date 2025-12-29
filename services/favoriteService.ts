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
    async getFavorites(userId: string) {
        const { data, error } = await supabase
            .from('favorites')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching favorites:', error);
            throw error;
        }
        return data;
    },

    // 즐겨찾기 여부 확인
    async checkFavorite(userId: string, facilityId: string) {
        const { data, error } = await supabase
            .from('favorites')
            .select('id')
            .eq('user_id', userId)
            .eq('facility_id', facilityId)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116: Returns 0 rows
            console.error('Error checking favorite:', error);
        }
        return !!data;
    },

    // 즐겨찾기 추가/삭제 (Toggle)
    async toggleFavorite(userId: string, facilityId: string) {
        // 1. 체크
        const isFav = await this.checkFavorite(userId, facilityId);

        if (isFav) {
            // 삭제
            const { error } = await supabase
                .from('favorites')
                .delete()
                .eq('user_id', userId)
                .eq('facility_id', facilityId);

            if (error) throw error;
            return false; // 이제 즐겨찾기 아님
        } else {
            // 추가
            const { error } = await supabase
                .from('favorites')
                .insert({ user_id: userId, facility_id: facilityId });

            if (error) throw error;
            return true; // 이제 즐겨찾기임
        }
    }
};
