export interface FileValidationResult {
    valid: boolean;
    error?: string;
    sanitizedExtension?: string;
}

interface FileValidationRule {
    allowedMimeTypes: readonly string[];
    allowedExtensions: readonly string[];
    maxBytes: number;
    label: string;
}

const IMAGE_SIGNATURES = {
    jpg: [0xff, 0xd8, 0xff],
    jpeg: [0xff, 0xd8, 0xff],
    png: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
} as const;

export const FILE_SIZE_LIMITS = {
    facilityImage: 5 * 1024 * 1024,
    reviewImage: 5 * 1024 * 1024,
    partnerDocument: 10 * 1024 * 1024,
} as const;

export const FILE_RULES = {
    facilityImage: {
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'] as const,
        allowedExtensions: ['jpg', 'jpeg', 'png', 'webp'] as const,
        maxBytes: FILE_SIZE_LIMITS.facilityImage,
        label: '이미지',
    },
    reviewImage: {
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'] as const,
        allowedExtensions: ['jpg', 'jpeg', 'png', 'webp'] as const,
        maxBytes: FILE_SIZE_LIMITS.reviewImage,
        label: '이미지',
    },
    partnerDocument: {
        allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'] as const,
        allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png', 'webp'] as const,
        maxBytes: FILE_SIZE_LIMITS.partnerDocument,
        label: '사업자등록증 파일',
    },
} as const satisfies Record<string, FileValidationRule>;

function formatMaxSize(bytes: number): string {
    const mb = bytes / (1024 * 1024);
    return Number.isInteger(mb) ? `${mb}MB` : `${mb.toFixed(1)}MB`;
}

function getFileExtension(fileName: string): string | null {
    const extension = fileName.split('.').pop()?.trim().toLowerCase();
    return extension || null;
}

function matchesSignature(bytes: Uint8Array, signature: readonly number[]): boolean {
    if (bytes.length < signature.length) return false;
    return signature.every((value, index) => bytes[index] === value);
}

function isWebp(bytes: Uint8Array): boolean {
    if (bytes.length < 12) return false;
    return (
        String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
        String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
    );
}

function isPdf(bytes: Uint8Array): boolean {
    if (bytes.length < 5) return false;
    return String.fromCharCode(...bytes.slice(0, 5)) === '%PDF-';
}

async function readFileHeader(file: File, size = 16): Promise<Uint8Array> {
    const buffer = await file.slice(0, size).arrayBuffer();
    return new Uint8Array(buffer);
}

async function matchesDeclaredFileType(file: File, extension: string): Promise<boolean> {
    const header = await readFileHeader(file);

    if (extension === 'pdf') {
        return isPdf(header);
    }

    if (extension === 'webp') {
        return isWebp(header);
    }

    const signature = IMAGE_SIGNATURES[extension as keyof typeof IMAGE_SIGNATURES];
    if (signature) {
        return matchesSignature(header, signature);
    }

    return false;
}

function isImageExtension(extension: string): boolean {
    return ['jpg', 'jpeg', 'png', 'webp'].includes(extension);
}

async function canDecodeImage(file: File): Promise<boolean> {
    try {
        if (typeof createImageBitmap === 'function') {
            const bitmap = await createImageBitmap(file);
            bitmap.close();
            return true;
        }
    } catch {
        return false;
    }

    return false;
}

export async function validateFile(file: File, rule: FileValidationRule): Promise<FileValidationResult> {
    if (file.size > rule.maxBytes) {
        return {
            valid: false,
            error: `${rule.label}는 ${formatMaxSize(rule.maxBytes)} 이하만 업로드할 수 있습니다.`,
        };
    }

    const extension = getFileExtension(file.name);
    if (!extension || !rule.allowedExtensions.includes(extension)) {
        return {
            valid: false,
            error: `${rule.label} 형식이 올바르지 않습니다. 허용 형식: ${rule.allowedExtensions.join(', ')}`,
        };
    }

    if (!rule.allowedMimeTypes.includes(file.type)) {
        return {
            valid: false,
            error: `${rule.label} MIME 타입이 허용되지 않습니다.`,
        };
    }

    const signatureMatches = await matchesDeclaredFileType(file, extension);
    if (!signatureMatches) {
        return {
            valid: false,
            error: `${rule.label} 내용과 확장자가 일치하지 않습니다.`,
        };
    }

    if (isImageExtension(extension)) {
        const decodeMatches = await canDecodeImage(file);
        if (!decodeMatches) {
            return {
                valid: false,
                error: `${rule.label} 파일을 디코드할 수 없습니다.`,
            };
        }
    }

    return {
        valid: true,
        sanitizedExtension: extension,
    };
}

export async function validateImageFile(file: File): Promise<FileValidationResult> {
    return validateFile(file, FILE_RULES.reviewImage);
}

export async function validateFacilityImageFile(file: File): Promise<FileValidationResult> {
    return validateFile(file, FILE_RULES.facilityImage);
}

export async function validatePartnerDocumentFile(file: File): Promise<FileValidationResult> {
    return validateFile(file, FILE_RULES.partnerDocument);
}

function sanitizeFileStem(originalName: string): string {
    const stem = originalName.replace(/\.[^.]+$/, '').toLowerCase();
    const sanitized = stem
        .normalize('NFKD')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 40);

    return sanitized || 'upload';
}

export function buildSafeObjectName(file: File, extension: string): string {
    const safeStem = sanitizeFileStem(file.name);
    return `${Date.now()}_${crypto.randomUUID().slice(0, 8)}_${safeStem}.${extension}`;
}
