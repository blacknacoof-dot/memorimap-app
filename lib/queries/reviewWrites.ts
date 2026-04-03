import type { SupabaseClient } from '@supabase/supabase-js';
import { buildSafeObjectName, validateImageFile } from '../security/fileValidation';
import { sanitizeImageFile } from '../security/imageSanitize';
import { logger } from '../../utils/logger';
import { z } from 'zod';
import { isZodIssueCode } from '../validation/commonSchema';
import { reviewContentSchema } from '../validation/reviewSchema';

function logValidationFailure(scope: string, error: z.ZodError) {
    const firstIssue = error.issues[0];
    logger.error('Validation failed', {
        scope,
        code: isZodIssueCode(firstIssue?.message || ''),
        field: firstIssue?.path?.join('.') || 'unknown',
        issueCount: error.issues.length,
    });
}

function validateReviewContent(content: string): string {
    const result = reviewContentSchema.safeParse(content);
    if (!result.success) {
        logValidationFailure('createReview', result.error);
        throw result.error;
    }
    return result.data;
}

export const checkExistingReview = async (userId: string, facilityId: string, client: SupabaseClient) => {
    const { data, error } = await client
        .from('facility_reviews')
        .select('id')
        .eq('user_id', userId)
        .eq('facility_id', facilityId)
        .eq('is_active', true)
        .maybeSingle();

    if (error) {
        return false;
    }

    return !!data;
};

export const checkConfirmedReservationForReview = async (userId: string, facilityId: string, client: SupabaseClient) => {
    const { data, error } = await client
        .from('reservations')
        .select('id')
        .eq('user_id', userId)
        .eq('facility_id', facilityId)
        .eq('status', 'confirmed')
        .limit(1)
        .maybeSingle();

    if (error) {
        return false;
    }

    return !!data;
};

export const uploadReviewImage = async (userId: string, file: File, client: SupabaseClient) => {
    const validation = await validateImageFile(file);
    if (!validation.valid) {
        throw new Error(validation.error || '파일 검증 실패');
    }

    const fileExt = validation.sanitizedExtension || 'jpg';
    const fileName = buildSafeObjectName(file, fileExt);
    const filePath = `review-images/${userId}/${fileName}`;
    const sanitizedFile = await sanitizeImageFile(file, fileExt);

    const { error: uploadError } = await client.storage
        .from('review-images')
        .upload(filePath, sanitizedFile, {
            cacheControl: '3600',
            upsert: false,
            contentType: sanitizedFile.type,
        });

    if (uploadError) throw uploadError;

    return filePath;
};

export const createReview = async (
    facilityId: string,
    userId: string,
    rating: number,
    content: string,
    userName: string | undefined,
    images: string[],
    client: SupabaseClient,
): Promise<Record<string, unknown> | null> => {
    const validatedContent = validateReviewContent(content);
    const insertData = {
        facility_id: facilityId,
        user_id: userId,
        rating,
        content: validatedContent,
        author_name: userName || '익명',
        photos: images.map((url) => ({ url })),
        is_active: true,
        created_at: new Date().toISOString(),
    };

    const { data, error } = await client
        .from('facility_reviews')
        .insert([insertData])
        .select()
        .single();

    if (error) throw error;
    return data;
};
