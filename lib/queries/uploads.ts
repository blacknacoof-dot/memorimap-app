import type { SupabaseClient } from '@supabase/supabase-js';
import { buildSafeObjectName, validateFacilityImageFile } from '../security/fileValidation';
import { sanitizeImageFile } from '../security/imageSanitize';

export const uploadFacilityImage = async (facilityId: string, file: File, client: SupabaseClient) => {
    const validation = await validateFacilityImageFile(file);
    if (!validation.valid) {
        throw new Error(validation.error || '시설 이미지 업로드 실패');
    }

    const fileExt = validation.sanitizedExtension || 'jpg';
    const fileName = buildSafeObjectName(file, fileExt);
    const filePath = `${facilityId}/${fileName}`;
    const sanitizedFile = await sanitizeImageFile(file, fileExt);

    const { error: uploadError } = await client.storage
        .from('facility-images')
        .upload(filePath, sanitizedFile, {
            cacheControl: '3600',
            upsert: false,
            contentType: sanitizedFile.type,
        });

    if (uploadError) throw uploadError;

    return filePath;
};
