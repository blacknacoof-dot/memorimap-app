import { describe, expect, it, vi } from 'vitest';

import { resolveFacilityDetailImages } from '../../lib/facilityImageResolver';

describe('resolveFacilityDetailImages', () => {
    it('signs main and gallery image paths for detail rendering', async () => {
        const signImage = vi.fn(async (value: string) => `signed:${value}`);

        const result = await resolveFacilityDetailImages({
            image_url: 'facility-1/main.jpg',
            images: ['facility-1/gallery-1.jpg', 'facility-1/gallery-2.jpg'],
        }, { signImage });

        expect(result).toEqual({
            imageUrl: 'signed:facility-1/main.jpg',
            galleryImages: ['signed:facility-1/gallery-1.jpg', 'signed:facility-1/gallery-2.jpg'],
        });
        expect(signImage).toHaveBeenCalledTimes(3);
    });

    it('falls back to the first signed gallery image when the main image is absent', async () => {
        const result = await resolveFacilityDetailImages({
            image_url: '',
            images: ['facility-1/gallery-1.jpg'],
        }, {
            signImage: async (value: string) => `signed:${value}`,
        });

        expect(result.imageUrl).toBe('signed:facility-1/gallery-1.jpg');
        expect(result.galleryImages).toEqual(['signed:facility-1/gallery-1.jpg']);
    });

    it('keeps the original value when signing fails so existing public URLs still render', async () => {
        const result = await resolveFacilityDetailImages({
            image_url: 'https://cdn.example.com/main.jpg',
            images: ['facility-1/gallery-1.jpg'],
        }, {
            signImage: async (value: string) => {
                if (value.startsWith('https://cdn.example.com/')) {
                    throw new Error('sign failed');
                }
                return `signed:${value}`;
            },
        });

        expect(result.imageUrl).toBe('https://cdn.example.com/main.jpg');
        expect(result.galleryImages).toEqual(['signed:facility-1/gallery-1.jpg']);
    });
});
