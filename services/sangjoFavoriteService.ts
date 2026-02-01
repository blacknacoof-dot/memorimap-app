import { supabase } from '../lib/supabaseClient';
import { FuneralCompany } from '../types';
import { isClerkConfigured } from '../lib/auth';

export interface SangjoFavorite {
    id: string;
    user_id: string;
    company_id: string;
    company_name: string;
    created_at: string;
}

const MOCK_SANGJO_STORAGE_KEY = 'memorimap_mock_sangjo_favorites';

export const sangjoFavoriteService = {
    // [Mock Only] Get local data
    _getLocalFavorites(): { id: string, name: string }[] {
        const stored = localStorage.getItem(MOCK_SANGJO_STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    },

    /**
     * 사용자의 상조 즐겨찾기 목록 조회
     */
    async getFavorites(userId: string): Promise<SangjoFavorite[]> {
        // 🚑 [Direct Attack] Check session before Supabase call
        const { data: { session } } = await supabase.auth.getSession();

        // 🚑 Mock Mode Fallback (Explicit)
        if (!session || !isClerkConfigured() || userId.startsWith('mock-')) {
            const localFavs = this._getLocalFavorites();
            return localFavs.map(f => ({
                id: `mock-s-${f.id}`,
                user_id: userId,
                company_id: f.id,
                company_name: f.name,
                created_at: new Date().toISOString()
            }));
        }

        try {
            const { data, error } = await supabase
                .from('sangjo_favorites')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) {
                if (error.code === '42501' || (error as any).status === 401) {
                    return this.getFavorites(`mock-${userId}`);
                }
                console.error('Error fetching sangjo favorites:', error);
                throw error;
            }
            return data || [];
        } catch (e) {
            return this.getFavorites(`mock-${userId}`);
        }
    },

    /**
     * 특정 회사가 즐겨찾기되어 있는지 확인
     */
    async checkFavorite(userId: string, companyId: string): Promise<boolean> {
        // 🚑 [Direct Attack] Check session before Supabase call
        const { data: { session } } = await supabase.auth.getSession();

        // 🚑 Mock Mode Fallback (Explicit)
        if (!session || !isClerkConfigured() || userId.startsWith('mock-')) {
            const localFavs = this._getLocalFavorites();
            return localFavs.some(f => f.id === companyId);
        }

        try {
            const { data, error } = await supabase
                .from('sangjo_favorites')
                .select('id')
                .eq('user_id', userId)
                .eq('company_id', companyId)
                .maybeSingle();

            if (error && error.code !== 'PGRST116') {
                if (error.code === '42501' || (error as any).status === 401) {
                    return this.checkFavorite(`mock-${userId}`, companyId);
                }
                console.error('Error checking sangjo favorite:', error);
            }
            return !!data;
        } catch (e) {
            return this.checkFavorite(`mock-${userId}`, companyId);
        }
    },

    /**
     * 즐겨찾기 추가/삭제 토글
     * @returns true면 추가됨, false면 삭제됨
     */
    async toggleFavorite(
        userId: string,
        company: FuneralCompany
    ): Promise<boolean> {
        // 🚑 [Direct Attack] Check session before Supabase call
        const { data: { session } } = await supabase.auth.getSession();

        // 🚑 Mock Mode Fallback (Explicit)
        if (!session || !isClerkConfigured() || userId.startsWith('mock-')) {
            let localFavs = this._getLocalFavorites();
            const exists = localFavs.some(f => f.id === company.id);

            if (exists) {
                localFavs = localFavs.filter(f => f.id !== company.id);
                localStorage.setItem(MOCK_SANGJO_STORAGE_KEY, JSON.stringify(localFavs));
                return false;
            } else {
                localFavs.push({ id: company.id, name: company.name });
                localStorage.setItem(MOCK_SANGJO_STORAGE_KEY, JSON.stringify(localFavs));
                return true;
            }
        }

        try {
            const isFav = await this.checkFavorite(userId, company.id);

            if (isFav) {
                // 삭제
                const { error } = await supabase
                    .from('sangjo_favorites')
                    .delete()
                    .eq('user_id', userId)
                    .eq('company_id', company.id);

                if (error) {
                    if (error.code === '42501' || (error as any).status === 401) {
                        return this.toggleFavorite(`mock-${userId}`, company);
                    }
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
                    if (error.code === '42501' || (error as any).status === 401) {
                        return this.toggleFavorite(`mock-${userId}`, company);
                    }
                    console.error('Error adding sangjo favorite:', error);
                    throw error;
                }
                return true;
            }
        } catch (e: any) {
            if (e.code === '42501' || e.status === 401) {
                return this.toggleFavorite(`mock-${userId}`, company);
            }
            throw e;
        }
    }
};
