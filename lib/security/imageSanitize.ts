import { logger } from '../logger';

const IMAGE_MIME_BY_EXTENSION: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
};

function getTargetMimeType(extension: string | undefined, fallbackType: string): string {
    if (extension) {
        const normalized = extension.toLowerCase();
        if (IMAGE_MIME_BY_EXTENSION[normalized]) {
            return IMAGE_MIME_BY_EXTENSION[normalized];
        }
    }

    return IMAGE_MIME_BY_EXTENSION[fallbackType.split('/')[1]?.toLowerCase?.() || ''] || fallbackType || 'image/jpeg';
}

async function sanitizeImageFileInBrowser(file: File, extension?: string): Promise<File> {
    if (typeof window === 'undefined' || typeof createImageBitmap !== 'function' || typeof document === 'undefined') {
        return file;
    }

    const mimeType = getTargetMimeType(extension, file.type);
    const bitmap = await createImageBitmap(file);

    try {
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;

        const context = canvas.getContext('2d');
        if (!context) {
            return file;
        }

        context.drawImage(bitmap, 0, 0);

        const blob = await new Promise<Blob | null>((resolve) => {
            canvas.toBlob(resolve, mimeType, mimeType === 'image/jpeg' ? 0.92 : undefined);
        });

        if (!blob) {
            return file;
        }

        return new File([blob], file.name, {
            type: mimeType,
            lastModified: file.lastModified,
        });
    } finally {
        bitmap.close();
    }
}

export async function sanitizeImageFile(file: File, extension?: string): Promise<File> {
    try {
        return await sanitizeImageFileInBrowser(file, extension);
    } catch (error) {
        logger.warn('Image sanitize fallback: keeping original file', {
            code: 'IMAGE_SANITIZE_FALLBACK',
            name: file.name,
            type: file.type,
            error,
        });
        return file;
    }
}
