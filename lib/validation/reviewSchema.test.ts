import { describe, expect, it } from 'vitest';

import { reviewContentSchema } from './reviewSchema';

describe('reviewContentSchema', () => {
    it('trims and accepts content between 10 and 1000 chars', () => {
        const result = reviewContentSchema.safeParse('   유효한 리뷰 내용입니다.   ');

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data).toBe('유효한 리뷰 내용입니다.');
        }
    });

    it('rejects too short or too long content', () => {
        expect(reviewContentSchema.safeParse('짧다').success).toBe(false);
        expect(reviewContentSchema.safeParse('a'.repeat(1001)).success).toBe(false);
    });
});
