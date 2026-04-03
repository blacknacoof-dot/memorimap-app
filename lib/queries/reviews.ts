import type { SupabaseClient } from '@supabase/supabase-js';
import type { Review } from '../../types';
import { supabase } from '../supabaseClient';
import { createSignedStorageImageUrl, SIGNED_IMAGE_URL_TTL_SECONDS } from '../security/storageImage';

async function signReviewImageList(values: string[], client: SupabaseClient = supabase): Promise<string[]> {
    if (values.length === 0) return [];

    const resolved = await Promise.allSettled(
        values.map((value) => createSignedStorageImageUrl(client, 'review-images', value, SIGNED_IMAGE_URL_TTL_SECONDS)),
    );

    return resolved
        .filter((result): result is PromiseFulfilledResult<string> => result.status === 'fulfilled')
        .map((result) => result.value)
        .filter(Boolean);
}

function extractReviewPhotoPaths(row: Record<string, unknown>): string[] {
    if (Array.isArray(row.images)) {
        return row.images.filter((value): value is string => typeof value === 'string');
    }

    if (Array.isArray(row.photos)) {
        return row.photos
            .map((item) => {
                if (typeof item === 'string') return item;
                if (item && typeof item === 'object' && 'url' in item && typeof item.url === 'string') {
                    return item.url;
                }
                return null;
            })
            .filter((value): value is string => Boolean(value));
    }

    return [];
}

export const getReviews = async (facilityId: string) => {
    try {
        const { data, error } = await supabase
            .from('facility_reviews')
            .select('*')
            .eq('facility_id', facilityId)
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (error) {
            return [];
        }

        const sortedRows = (data || []).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        const resolvedRows: Review[] = await Promise.all(sortedRows.map(async (row: Record<string, unknown>) => ({
            id: String(row.id || ''),
            user_id: typeof row.user_id === 'string' ? row.user_id : undefined,
            userName: String(row.author_name || row.userName || '익명'),
            rating: Number(row.rating || 0),
            content: String(row.content || ''),
            images: await signReviewImageList(extractReviewPhotoPaths(row)),
            created_at: row.created_at ? String(row.created_at) : undefined,
            date: row.created_at ? new Date(String(row.created_at)).toLocaleDateString() : new Date().toLocaleDateString(),
        })));

        return resolvedRows;
    } catch (_error) {
        return [];
    }
};

export const getUserReviews = async (userId: string, client: SupabaseClient) => {
    const { data, error } = await client
        .from('facility_reviews')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

    if (error) {
        return [];
    }

    const sortedRows = (data || []).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return Promise.all(sortedRows.map(async (row: Record<string, unknown>): Promise<Review> => ({
        id: String(row.id || ''),
        user_id: typeof row.user_id === 'string' ? row.user_id : undefined,
        userName: String(row.author_name || row.userName || '익명'),
        rating: Number(row.rating || 0),
        content: String(row.content || ''),
        images: await signReviewImageList(extractReviewPhotoPaths(row), client),
        created_at: row.created_at ? String(row.created_at) : undefined,
        date: row.created_at ? new Date(String(row.created_at)).toLocaleDateString() : new Date().toLocaleDateString(),
    })));
};

export const getReviewsBySpace = getReviews;
