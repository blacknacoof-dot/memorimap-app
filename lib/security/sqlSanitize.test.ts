import { describe, expect, it } from 'vitest';

import { buildSafeOrFilter, createSafeIlikePattern, normalizeSearchInput } from './sqlSanitize';

describe('sqlSanitize', () => {
    it('removes common SQL keywords and wildcard/control characters from search input', () => {
        const input = "서울'; DROP TABLE facilities; %_";

        const sanitized = normalizeSearchInput(input);

        expect(sanitized).toContain('서울');
        expect(sanitized).toContain('TABLE facilities');
        expect(sanitized).not.toMatch(/drop|%|_|'|;/i);
    });

    it('caps unusually long input to 200 characters', () => {
        const input = 'a'.repeat(400);

        const sanitized = normalizeSearchInput(input);

        expect(sanitized).toHaveLength(200);
    });

    it('creates an ilike pattern from sanitized text only', () => {
        const pattern = createSafeIlikePattern('부산%_테스트');

        expect(pattern).toBe('%부산테스트%');
    });

    it('rejects unsafe or filter fragments', () => {
        expect(() => buildSafeOrFilter(['email.ilike.%safe%', 'full_name.ilike.%ok%'])).not.toThrow();
        expect(() => buildSafeOrFilter(['email.ilike.%safe%', 'full_name.ilike.%bad,evil%'])).toThrow('Unsafe OR filter');
    });
});
