import { describe, expect, it } from 'vitest';

import { facilityUpdateSchema } from './facilitySchema';

describe('facilityUpdateSchema', () => {
    it('accepts trimmed name, description, and https URL', () => {
        const result = facilityUpdateSchema.safeParse({
            name: '  추모시설  ',
            description: '  설명  ',
            website: ' https://memorimap.kr ',
        });

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.name).toBe('추모시설');
            expect(result.data.description).toBe('설명');
            expect(result.data.website).toBe('https://memorimap.kr');
        }
    });

    it('rejects invalid URL and overly long text', () => {
        expect(facilityUpdateSchema.safeParse({
            name: '시설명',
            description: 'd'.repeat(3001),
            website: 'ftp://memorimap.kr',
        }).success).toBe(false);
    });
});
