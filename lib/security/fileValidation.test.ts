import { describe, expect, it } from 'vitest';

import {
    FILE_SIZE_LIMITS,
    buildSafeObjectName,
    validateFacilityImageFile,
    validatePartnerDocumentFile,
} from './fileValidation';

function createFile(parts: BlobPart[], name: string, type: string): File {
    return new File(parts, name, { type });
}

describe('fileValidation', () => {
    it('accepts a valid png facility image', async () => {
        const pngHeader = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
        const file = createFile([pngHeader], 'facility-photo.PNG', 'image/png');

        const result = await validateFacilityImageFile(file);

        expect(result).toMatchObject({
            valid: true,
            sanitizedExtension: 'png',
        });
    });

    it('rejects a spoofed partner document when signature does not match', async () => {
        const fakePdf = createFile([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], 'license.pdf', 'application/pdf');

        const result = await validatePartnerDocumentFile(fakePdf);

        expect(result.valid).toBe(false);
        expect(result.error).toContain('일치');
    });

    it('rejects files that exceed the configured size limit', async () => {
        const oversized = createFile(
            [new Uint8Array(FILE_SIZE_LIMITS.partnerDocument + 1)],
            'license.pdf',
            'application/pdf',
        );

        const result = await validatePartnerDocumentFile(oversized);

        expect(result.valid).toBe(false);
        expect(result.error).toContain('10MB');
    });

    it('builds a safe storage object name from untrusted file names', () => {
        const file = createFile([new Uint8Array([1, 2, 3])], '사업자등록증 FINAL!!.pdf', 'application/pdf');

        const objectName = buildSafeObjectName(file, 'pdf');

        expect(objectName).toMatch(/^\d{13}_[a-f0-9]{8}_[a-z0-9-]+\.pdf$/);
        expect(objectName).not.toContain('FINAL!!');
    });
});
