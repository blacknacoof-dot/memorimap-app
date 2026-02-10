/**
 * File Upload Validation Utilities
 * Phase 1-4: Security Hardening
 */

/**
 * 허용된 이미지 MIME 타입
 */
const ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif'
] as const;

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * 파일 업로드 검증
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
    // 1. 파일 크기 검증
    if (file.size > MAX_FILE_SIZE) {
        return { valid: false, error: '파일 크기는 5MB 이하여야 합니다.' };
    }

    // 2. MIME 타입 검증
    if (!ALLOWED_IMAGE_TYPES.includes(file.type as any)) {
        return { valid: false, error: '지원하지 않는 파일 형식입니다. (JPEG, PNG, WebP, GIF만 허용)' };
    }

    // 3. 파일 확장자 이중 검증
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const allowedExts = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    if (!fileExt || !allowedExts.includes(fileExt)) {
        return { valid: false, error: '잘못된 파일 확장자입니다.' };
    }

    return { valid: true };
}
