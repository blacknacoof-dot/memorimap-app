import { supabase, createAuthenticatedClient, getCurrentAccessToken } from '../lib/supabaseClient';
import { FuneralCompany } from '../types';

export interface SangjoFavorite {
    id: string;
    user_id: string;
    company_id: string;
    company_name: string;
    created_at: string;
}

/** 인증된 클라이언트 반환 (토큰 있으면 authClient, 없으면 싱글톤) */
function getClient() {
    const token = getCurrentAccessToken();
    return token ? createAuthenticatedClient(token) : supabase;
}

export const sangjoFavoriteService = {
    async getFavorites(userId: string): Promise<SangjoFavorite[]> {
        try {
            const { data, error } = await getClient()
                .from('sangjo_favorites')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching sangjo favorites:', error);
                throw error;
            }
            return data || [];
        } catch (e) {
            console.error('Exception fetching sangjo favorites:', e);
            throw e;
        }
    },

    async checkFavorite(userId: string, companyId: string): Promise<boolean> {
        try {
            const { data, error } = await getClient()
                .from('sangjo_favorites')
                .select('id')
                .eq('user_id', userId)
                .eq('company_id', companyId)
                .maybeSingle();

            if (error && error.code !== 'PGRST116') {
                if (error.code === '42501' || (error as any).status === 401) {
                    throw error;
                }
                console.error('Error checking sangjo favorite:', error);
            }
            return !!data;
        } catch (e) {
            console.error('Error in checkFavorite:', e);
            return false;
        }
    },

    async toggleFavorite(
        userId: string,
        company: FuneralCompany
    ): Promise<boolean> {
        try {
            const client = getClient();
            const isFav = await this.checkFavorite(userId, company.id);

            if (isFav) {
                const { error } = await client
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
                const { error } = await client
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
        } catch (e: any) {
            if (e.code === '42501' || e.status === 401) {
                throw e;
            }
            throw e;
        }
    }
};
