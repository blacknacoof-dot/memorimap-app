import type { SupabaseClient } from '@supabase/supabase-js';

export type StorageImageBucket = 'facility-images' | 'review-images';

export const SIGNED_IMAGE_URL_TTL_SECONDS = 60 * 60;

const PRIVATE_STORAGE_BUCKETS = new Set<StorageImageBucket>(['review-images']);

type TransformOptions = {
    width?: number;
    height?: number;
    quality?: number;
};

type CacheEntry = {
    expiresAt: number;
    url: string;
};

const signedUrlCache = new Map<string, CacheEntry>();

function getCacheKey(bucket: StorageImageBucket, path: string, expiresIn: number, transform?: TransformOptions): string {
    return `${bucket}:${path}:${expiresIn}:${transform?.width || ''}:${transform?.height || ''}:${transform?.quality || ''}`;
}

function isAbsoluteHttpUrl(value: string): boolean {
    return /^https?:\/\//i.test(value);
}

function stripBucketPrefix(bucket: StorageImageBucket, value: string): string {
    return value.startsWith(`${bucket}/`) ? value.slice(bucket.length + 1) : value;
}

function isBlockedDirectValue(value: string): boolean {
    return value.startsWith('/') || value.startsWith('data:');
}

function allowsUnsignedPassthrough(bucket: StorageImageBucket): boolean {
    return !PRIVATE_STORAGE_BUCKETS.has(bucket);
}

function resolveUnsignedPassthrough(bucket: StorageImageBucket, value: string): string | null {
    if (allowsUnsignedPassthrough(bucket)) {
        return value;
    }

    return null;
}

function createPublicStorageImageUrl(
    client: SupabaseClient,
    bucket: StorageImageBucket,
    objectPath: string,
    transform?: TransformOptions,
): string {
    const { data } = client.storage
        .from(bucket)
        .getPublicUrl(objectPath, transform ? { transform } : undefined);

    if (!data?.publicUrl) {
        throw new Error('PUBLIC_IMAGE_URL_FAILED');
    }

    return data.publicUrl;
}

export function normalizeStorageObjectPath(bucket: StorageImageBucket, value?: string | null): string | null {
    if (!value) return null;

    const trimmed = value.trim();
    if (!trimmed) return null;

    if (!isAbsoluteHttpUrl(trimmed)) {
        if (isBlockedDirectValue(trimmed)) {
            return null;
        }
        return stripBucketPrefix(bucket, trimmed);
    }

    try {
        const url = new URL(trimmed);
        const path = decodeURIComponent(url.pathname);

        const patterns = [
            `/storage/v1/object/public/${bucket}/`,
            `/storage/v1/object/sign/${bucket}/`,
            `/storage/v1/object/authenticated/${bucket}/`,
            `/storage/v1/render/image/public/${bucket}/`,
            `/storage/v1/render/image/sign/${bucket}/`,
            `/storage/v1/render/image/authenticated/${bucket}/`,
        ];

        for (const marker of patterns) {
            const index = path.indexOf(marker);
            if (index >= 0) {
                return path.slice(index + marker.length);
            }
        }
    } catch {
        return null;
    }

    return null;
}

export function isPrivateStorageBucket(bucket: StorageImageBucket): boolean {
    return PRIVATE_STORAGE_BUCKETS.has(bucket);
}

export async function createSignedStorageImageUrl(
    client: SupabaseClient,
    bucket: StorageImageBucket,
    storedValue: string,
    expiresIn = SIGNED_IMAGE_URL_TTL_SECONDS,
    transform?: TransformOptions,
): Promise<string> {
    const objectPath = normalizeStorageObjectPath(bucket, storedValue);
    if (!objectPath) {
        const passthrough = resolveUnsignedPassthrough(bucket, storedValue);
        if (passthrough) {
            return passthrough;
        }

        throw new Error('INVALID_STORAGE_IMAGE_URL');
    }

    const cacheKey = getCacheKey(bucket, objectPath, expiresIn, transform);
    const now = Date.now();
    const cached = signedUrlCache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
        return cached.url;
    }

    if (!isPrivateStorageBucket(bucket)) {
        const publicUrl = createPublicStorageImageUrl(client, bucket, objectPath, transform);
        signedUrlCache.set(cacheKey, {
            url: publicUrl,
            expiresAt: now + Math.max(expiresIn - 60, 60) * 1000,
        });
        return publicUrl;
    }

    const { data, error } = await client.storage
        .from(bucket)
        .createSignedUrl(objectPath, expiresIn, transform ? { transform } : undefined);

    if (error || !data?.signedUrl) {
        throw error || new Error('SIGNED_IMAGE_URL_FAILED');
    }

    signedUrlCache.set(cacheKey, {
        url: data.signedUrl,
        expiresAt: now + Math.max(expiresIn - 60, 60) * 1000,
    });

    return data.signedUrl;
}

export async function createSignedStorageImageUrls(
    client: SupabaseClient,
    bucket: StorageImageBucket,
    storedValues: string[],
    expiresIn = SIGNED_IMAGE_URL_TTL_SECONDS,
): Promise<string[]> {
    const resolved = await Promise.all(
        storedValues.map((value) => createSignedStorageImageUrl(client, bucket, value, expiresIn)),
    );

    return resolved.filter(Boolean);
}
