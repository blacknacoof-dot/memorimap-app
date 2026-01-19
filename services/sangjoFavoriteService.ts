import { supabase } from '../lib/supabaseClient';
import { FuneralCompany } from '../types';

export interface SangjoFavorite {
    id: string;
    user_id: string;
    company_id: string;
    company_name: string;
    created_at: string;
}

export const sangjoFavoriteService = {
    /**
     * 사용자의 상조 즐겨찾기 목록 조회
     */
    async getFavorites(userId: string): Promise<SangjoFavorite[]> {
        const { data, error } = await supabase
            .from('sangjo_favorites')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching sangjo favorites:', error);
            throw error;
        }
        return data || [];
    },

    /**
     * 특정 회사가 즐겨찾기되어 있는지 확인
     */
    async checkFavorite(userId: string, companyId: string): Promise<boolean> {
        const { data, error } = await supabase
            .from('sangjo_favorites')
            .select('id')
            .eq('user_id', userId)
            .eq('company_id', companyId)
            .maybeSingle();

        if (error && error.code !== 'PGRST116') {
            console.error('Error checking sangjo favorite:', error);
        }
        return !!data;
    },

    /**
     * 즐겨찾기 추가/삭제 토글
     * @returns true면 추가됨, false면 삭제됨
     */
    async toggleFavorite(
        userId: string,
        company: FuneralCompany
    ): Promise<boolean> {
        const isFav = await this.checkFavorite(userId, company.id);

        if (isFav) {
            // 삭제
            const { error } = await supabase
                .from('sangjo_favorites')
                .delete()
                .eq('user_id', userId)
                .eq('company_id', company.id);

            if (error) {
                console.error('Error removing sangjo favorite:', error);
                throw error;
            }
            return false;
        } else {
            // 추가
            const { error } = await supabase
                .from('sangjo_favorites')
                .insert({
                    user_id: userId,
                    company_id: company.id,
                    company_name: company.name
                });

            if (error) {
                console.error('Error adding sangjo favorite:', error);
                throw error;
            }
            return true;
        }
    }
};
