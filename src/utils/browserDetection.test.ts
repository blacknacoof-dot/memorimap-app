import { describe, expect, it } from 'vitest';

import { getInAppBrowserNameFromUserAgent, normalizeSafeRedirectUrl, resolveExternalGuideBrowser } from './browserDetection';

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

describe('resolveExternalGuideBrowser', () => {
    it('prefers a valid explicit browser query parameter', () => {
        expect(resolveExternalGuideBrowser('naver', 'Mozilla/5.0 KAKAOTALK')).toBe('naver');
    });

    it('falls back to the detected user-agent browser', () => {
        expect(getInAppBrowserNameFromUserAgent('Mozilla/5.0 NAVER(inapp; search;)')).toBe('naver');
        expect(resolveExternalGuideBrowser(null, 'Mozilla/5.0 NAVER(inapp; search;)')).toBe('naver');
        expect(resolveExternalGuideBrowser(null, 'Mozilla/5.0 KAKAOTALK 10.0.5')).toBe('kakaotalk');
    });

    it('uses a generic guide when no known in-app browser is detected', () => {
        expect(resolveExternalGuideBrowser(null, 'Mozilla/5.0 Safari/604.1')).toBe('generic');
        expect(resolveExternalGuideBrowser('unknown', 'Mozilla/5.0 Safari/604.1')).toBe('generic');
    });
});
