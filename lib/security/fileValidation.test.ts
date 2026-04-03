import { afterEach, describe, expect, it, vi } from 'vitest';

import {
    FILE_SIZE_LIMITS,
    buildSafeObjectName,
    validateFacilityImageFile,
    validatePartnerDocumentFile,
} from './fileValidation';

function createFile(parts: BlobPart[], name: string, type: string): File {
    return new File(parts, name, { type });
}

function base64ToUint8Array(value: string): Uint8Array {
    return Uint8Array.from(Buffer.from(value, 'base64'));
}

describe('fileValidation', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('accepts a valid png facility image', async () => {
        const pngBytes = base64ToUint8Array('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a7FoAAAAASUVORK5CYII=');
        const file = createFile([pngBytes], 'facility-photo.PNG', 'image/png');
        vi.stubGlobal('createImageBitmap', vi.fn(async () => ({ close: vi.fn() })));

        const result = await validateFacilityImageFile(file);

        expect(result).toMatchObject({
            valid: true,
            sanitizedExtension: 'png',
        });
    });

    it('fails safely when browser image decode support is unavailable', async () => {
        const pngBytes = base64ToUint8Array('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a7FoAAAAASUVORK5CYII=');
        const file = createFile([pngBytes], 'facility-photo.png', 'image/png');

        const result = await validateFacilityImageFile(file);

        expect(result.valid).toBe(false);
        expect(result.error).toContain('디코드');
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
