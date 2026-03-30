import { describe, expect, it } from 'vitest';

import { normalizeSafeRedirectUrl } from './browserDetection';

describe('normalizeSafeRedirectUrl', () => {
    const origin = 'https://memorimap.kr';

    it('allows same-origin absolute and relative URLs', () => {
        expect(normalizeSafeRedirectUrl('/#/mypage', origin)).toBe('https://memorimap.kr/#/mypage');
        expect(normalizeSafeRedirectUrl('https://memorimap.kr/#/super-admin', origin)).toBe('https://memorimap.kr/#/super-admin');
    });

    it('rejects external absolute URLs and protocol-relative URLs', () => {
        expect(normalizeSafeRedirectUrl('https://evil.example/phish', origin)).toBe(origin);
        expect(normalizeSafeRedirectUrl('//evil.example/phish', origin)).toBe(origin);
    });

    it('rejects javascript URLs and malformed values', () => {
        expect(normalizeSafeRedirectUrl(`java${'script'}:alert(1)`, origin)).toBe(origin);
        expect(normalizeSafeRedirectUrl('::::', origin)).toBe(origin);
    });
});
