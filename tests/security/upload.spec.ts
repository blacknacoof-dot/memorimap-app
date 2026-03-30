import { describe, expect, it, vi } from 'vitest';
import sharp from 'sharp';

import { validateFacilityImageFile } from '../../lib/security/fileValidation';
import { sanitizeImageBufferWithSharp } from '../../lib/security/imageSanitize';
import { createSignedStorageImageUrl, normalizeStorageObjectPath, SIGNED_IMAGE_URL_TTL_SECONDS } from '../../lib/security/storageImage';

function createFile(parts: BlobPart[], name: string, type: string): File {
    return new File(parts, name, { type });
}

describe('upload security hardening', () => {
    it('removes image metadata during server-side sanitize', async () => {
        const originalBuffer = await sharp({
            create: {
                width: 2,
                height: 2,
                channels: 3,
                background: { r: 120, g: 80, b: 40 },
            },
        })
            .jpeg()
            .withMetadata({ orientation: 6 })
            .toBuffer();

        const originalMetadata = await sharp(originalBuffer).metadata();
        const sanitizedBuffer = await sanitizeImageBufferWithSharp(originalBuffer, 'jpg');
        const sanitizedMetadata = await sharp(sanitizedBuffer).metadata();

        expect(originalMetadata.orientation).toBe(6);
        expect(sanitizedMetadata.orientation).toBeUndefined();
    });

    it('rejects image files that match the header but cannot be decoded', async () => {
        const invalidPng = createFile(
            [new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x01, 0x02, 0x03])],
            'polyglot.png',
            'image/png',
        );

        const result = await validateFacilityImageFile(invalidPng);

        expect(result.valid).toBe(false);
        expect(result.error).toContain('디코드');
    });

    it('creates signed storage URLs instead of exposing bucket public URLs', async () => {
        const createSignedUrl = vi.fn().mockResolvedValue({
            data: {
                signedUrl: 'https://example.supabase.co/storage/v1/object/sign/facility-images/facility-1/image.jpg?token=abc',
            },
            error: null,
        });

        const client = {
            storage: {
                from: vi.fn().mockReturnValue({ createSignedUrl }),
            },
        } as unknown as Parameters<typeof createSignedStorageImageUrl>[0];

        const signedUrl = await createSignedStorageImageUrl(
            client,
            'facility-images',
            'https://example.supabase.co/storage/v1/object/public/facility-images/facility-1/image.jpg',
            SIGNED_IMAGE_URL_TTL_SECONDS,
        );

        expect(normalizeStorageObjectPath('facility-images', 'facility-1/image.jpg')).toBe('facility-1/image.jpg');
        expect(createSignedUrl).toHaveBeenCalledWith('facility-1/image.jpg', SIGNED_IMAGE_URL_TTL_SECONDS, undefined);
        expect(signedUrl).toContain('/object/sign/facility-images/');
        expect(signedUrl).toContain('token=');
    });

    it('normalizes old review public URLs and reissues signed URLs', async () => {
        const createSignedUrl = vi.fn().mockResolvedValue({
            data: {
                signedUrl: 'https://example.supabase.co/storage/v1/object/sign/review-images/review-images/user-1/image.jpg?token=def',
            },
            error: null,
        });

        const client = {
            storage: {
                from: vi.fn().mockReturnValue({ createSignedUrl }),
            },
        } as unknown as Parameters<typeof createSignedStorageImageUrl>[0];

        const signedUrl = await createSignedStorageImageUrl(
            client,
            'review-images',
            'https://example.supabase.co/storage/v1/object/public/review-images/review-images/user-1/image.jpg',
            SIGNED_IMAGE_URL_TTL_SECONDS,
        );

        expect(normalizeStorageObjectPath('review-images', 'https://example.supabase.co/storage/v1/object/public/review-images/review-images/user-1/image.jpg'))
            .toBe('review-images/user-1/image.jpg');
        expect(createSignedUrl).toHaveBeenCalledWith('review-images/user-1/image.jpg', SIGNED_IMAGE_URL_TTL_SECONDS, undefined);
        expect(signedUrl).toContain('/object/sign/review-images/');
    });

    it('blocks arbitrary external URLs for private review images', async () => {
        const client = {
            storage: {
                from: vi.fn(),
            },
        } as unknown as Parameters<typeof createSignedStorageImageUrl>[0];

        await expect(
            createSignedStorageImageUrl(
                client,
                'review-images',
                'https://evil.example/review-images/user-1/image.jpg',
                SIGNED_IMAGE_URL_TTL_SECONDS,
            ),
        ).rejects.toThrow('INVALID_STORAGE_IMAGE_URL');
    });

    it('keeps facility-images compatible with existing public URLs', async () => {
        const client = {
            storage: {
                from: vi.fn(),
            },
        } as unknown as Parameters<typeof createSignedStorageImageUrl>[0];

        await expect(
            createSignedStorageImageUrl(
                client,
                'facility-images',
                'https://cdn.example.com/facility-1/image.jpg',
                SIGNED_IMAGE_URL_TTL_SECONDS,
            ),
        ).resolves.toBe('https://cdn.example.com/facility-1/image.jpg');
    });
});
