import { supabase } from '../lib/supabaseClient';
import { isClerkConfigured } from '../lib/auth';

export interface Favorite {
    id: string;
    user_id: string;
    facility_id: string;
    created_at: string;
    memorial_spaces?: any; // Join된 시설 정보
}

const MOCK_STORAGE_KEY = 'memorimap_mock_favorites';

export const favoriteService = {
    // [Mock Only] Get local data
    _getLocalFavorites(): string[] {
        const stored = localStorage.getItem(MOCK_STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    },

    // 즐겨찾기 목록 조회
    async getFavorites(userId: string): Promise<Favorite[]> {
        // 🚑 [Direct Attack] Check session before Supabase call
        const { data: { session } } = await supabase.auth.getSession();

        // 🚑 Mock Mode Fallback (Explicit)
        if (!session || !isClerkConfigured() || userId.startsWith('mock-')) {
            const localFavIds = this._getLocalFavorites();
            return localFavIds.map(fid => ({
                id: `mock-${fid}`,
                user_id: userId,
                facility_id: fid,
                created_at: new Date().toISOString()
            }));
        }

        try {
            const { data, error } = await supabase
                .from('favorites')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) {
                // RLS or Auth Error Fallback
                if (error.code === '42501' || (error as any).status === 401) {
                    console.warn('[favoriteService] Supabase error, falling back to localStorage');
                    return this.getFavorites(`mock-${userId}`); // Recursively use mock logic
                }
                console.error('Error fetching favorites:', error);
                throw error;
            }
            return data || [];
        } catch (e) {
            console.warn('[favoriteService] Exception, falling back to localStorage');
            return this.getFavorites(`mock-${userId}`);
        }
    },

    // 즐겨찾기 여부 확인
    async checkFavorite(userId: string, facilityId: string): Promise<boolean> {
        // 🚑 [Direct Attack] Check session before Supabase call
        const { data: { session } } = await supabase.auth.getSession();

        // 🚑 Mock Mode Fallback (Explicit)
        if (!session || !isClerkConfigured() || userId.startsWith('mock-')) {
            const localFavIds = this._getLocalFavorites();
            return localFavIds.includes(facilityId);
        }

        try {
            const { data, error } = await supabase
                .from('favorites')
                .select('id')
                .eq('user_id', userId)
                .eq('facility_id', facilityId)
                .maybeSingle();

            if (error && error.code !== 'PGRST116') {
                if (error.code === '42501' || (error as any).status === 401) {
                    return this.checkFavorite(`mock-${userId}`, facilityId);
                }
                console.error('Error checking favorite:', error);
            }
            return !!data;
        } catch (e) {
            return this.checkFavorite(`mock-${userId}`, facilityId);
        }
    },

    // 즐겨찾기 추가/삭제 (Toggle)
    async toggleFavorite(userId: string, facilityId: string): Promise<boolean> {
        // 🚑 [Direct Attack] Check session before Supabase call
        const { data: { session } } = await supabase.auth.getSession();

        // 🚑 Mock Mode Fallback (Explicit)
        if (!session || !isClerkConfigured() || userId.startsWith('mock-')) {
            let localFavIds = this._getLocalFavorites();
            const exists = localFavIds.includes(facilityId);

            if (exists) {
                localFavIds = localFavIds.filter(id => id !== facilityId);
                localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(localFavIds));
                return false;
            } else {
                localFavIds.push(facilityId);
                localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(localFavIds));
                return true;
            }
        }

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
                    if (error.code === '42501' || (error as any).status === 401) {
                        return this.toggleFavorite(`mock-${userId}`, facilityId);
                    }
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
                        return this.toggleFavorite(`mock-${userId}`, facilityId);
                    }
                    throw error;
                }
                return true;
            }
        } catch (e: any) {
            // Check if it's already an error object we handled
            if (e.code === '42501' || e.status === 401) {
                return this.toggleFavorite(`mock-${userId}`, facilityId);
            }
            throw e;
        }
    }
};
