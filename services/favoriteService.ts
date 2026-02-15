import { supabase, createAuthenticatedClient } from '../lib/supabaseClient';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface Favorite {
    id: string;
    user_id: string;
    facility_id: string;
    created_at: string;
    memorial_spaces?: any; // Join된 시설 정보
}

/** Clerk 세션 토큰으로 인증된 Supabase 클라이언트 반환 */
const getAuthClient = async (): Promise<SupabaseClient> => {
    try {
        const clerk = (window as any).Clerk;
        if (clerk?.session) {
            const token = await clerk.session.getToken({ template: 'supabase' });
            if (token) return createAuthenticatedClient(token);
        }
    } catch {
        // fallback
    }
    return supabase;
};

export const favoriteService = {
    // 즐겨찾기 목록 조회
    async getFavorites(userId: string): Promise<Favorite[]> {
        try {
            const client = await getAuthClient();
            const { data, error } = await client
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
            const client = await getAuthClient();
            const { data, error } = await client
                .from('favorites')
                .select('id')
                .eq('user_id', userId)
                .eq('facility_id', facilityId)
                .maybeSingle();

            if (error && error.code !== 'PGRST116') {
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
        const client = await getAuthClient();

        // 1. 체크
        const isFav = await this.checkFavorite(userId, facilityId);

        if (isFav) {
            // 삭제
            const { error } = await client
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
            const { error } = await client
                .from('favorites')
                .insert({ user_id: userId, facility_id: facilityId });

            if (error) {
                console.error('Error adding favorite:', error);
                throw error;
            }
            return true;
        }
    }
};
