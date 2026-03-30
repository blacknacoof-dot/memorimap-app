import { describe, expect, it } from 'vitest';

import { normalizePartnerDocPath } from './PartnerAdmissions';

describe('normalizePartnerDocPath', () => {
    it('supports legacy public URLs', () => {
        expect(
            normalizePartnerDocPath('https://example.supabase.co/storage/v1/object/public/partner_docs/licenses/user-1/license.pdf'),
        ).toBe('licenses/user-1/license.pdf');
    });

    it('supports signed URLs and bucket-prefixed paths', () => {
        expect(
            normalizePartnerDocPath('https://example.supabase.co/storage/v1/object/sign/partner_docs/licenses/user-1/license.pdf?token=abc'),
        ).toBe('licenses/user-1/license.pdf');
        expect(normalizePartnerDocPath('partner_docs/licenses/user-1/license.pdf')).toBe('licenses/user-1/license.pdf');
    });

    it('keeps normalized storage paths and rejects malformed URLs', () => {
        expect(normalizePartnerDocPath('licenses/user-1/license.pdf')).toBe('licenses/user-1/license.pdf');
        expect(normalizePartnerDocPath('https://example.com/other/path')).toBeNull();
    });
});
