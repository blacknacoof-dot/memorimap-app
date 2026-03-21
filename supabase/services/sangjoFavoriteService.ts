import type { SupabaseClient } from '@supabase/supabase-js';
import { FuneralCompany } from '../types';

export interface SangjoFavorite {
    id: string;
    user_id: string;
    company_id: string;
    company_name: string;
    created_at: string;
}

export const sangjoFavoriteService = {
    async getFavorites(userId: string, client: SupabaseClient): Promise<SangjoFavorite[]> {
        const { data, error } = await client
            .from('sangjo_favorites')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async checkFavorite(userId: string, companyId: string, client: SupabaseClient): Promise<boolean> {
        const { data, error } = await client
            .from('sangjo_favorites')
            .select('id')
            .eq('user_id', userId)
            .eq('company_id', companyId)
            .maybeSingle();

        if (error && error.code !== 'PGRST116') {
            if (error.code === '42501' || error.code === '401') {
                throw error;
            }
        }
        return !!data;
    },

    async toggleFavorite(
        userId: string,
        company: FuneralCompany,
        client: SupabaseClient
    ): Promise<boolean> {
        const isFav = await this.checkFavorite(userId, company.id, client);

        if (isFav) {
            const { error } = await client
                .from('sangjo_favorites')
                .delete()
                .eq('user_id', userId)
                .eq('company_id', company.id);

            if (error) throw error;
            return false;
        } else {
            const { error } = await client
                .from('sangjo_favorites')
                .insert({
                    user_id: userId,
                    company_id: company.id,
                    company_name: company.name
                });

            if (error) throw error;
            return true;
        }
    }
};
