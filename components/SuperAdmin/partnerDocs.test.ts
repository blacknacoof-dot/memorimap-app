import { describe, expect, it, vi } from 'vitest';

import {
  createPartnerDocSignedUrl,
  hasPartnerDocument,
  normalizePartnerDocPath,
  PARTNER_DOC_SIGNED_URL_TTL_SECONDS,
} from './partnerDocs';

describe('partnerDocs', () => {
  it('supports legacy public URLs and signed URLs', () => {
    expect(
      normalizePartnerDocPath('https://example.supabase.co/storage/v1/object/public/partner_docs/licenses/user-1/license.pdf'),
    ).toBe('licenses/user-1/license.pdf');

    expect(
      normalizePartnerDocPath('https://example.supabase.co/storage/v1/object/sign/partner_docs/licenses/user-1/license.pdf?token=abc'),
    ).toBe('licenses/user-1/license.pdf');
  });

  it('keeps normalized storage paths and rejects unrelated external URLs', () => {
    expect(normalizePartnerDocPath('partner_docs/licenses/user-1/license.pdf')).toBe('licenses/user-1/license.pdf');
    expect(normalizePartnerDocPath('licenses/user-1/license.pdf')).toBe('licenses/user-1/license.pdf');
    expect(normalizePartnerDocPath('https://example.com/other/path')).toBeNull();
    expect(hasPartnerDocument('https://example.com/other/path')).toBe(false);
  });

  it('creates a signed URL only for normalized partner_docs paths', async () => {
    const createSignedUrl = vi.fn().mockResolvedValue({
      data: { signedUrl: 'https://example.supabase.co/storage/v1/object/sign/partner_docs/licenses/user-1/license.pdf?token=abc' },
      error: null,
    });
    const client = {
      storage: {
        from: vi.fn().mockReturnValue({ createSignedUrl }),
      },
    };

    const signedUrl = await createPartnerDocSignedUrl(
      client as never,
      'partner_docs/licenses/user-1/license.pdf',
    );

    expect(client.storage.from).toHaveBeenCalledWith('partner_docs');
    expect(createSignedUrl).toHaveBeenCalledWith('licenses/user-1/license.pdf', PARTNER_DOC_SIGNED_URL_TTL_SECONDS, undefined);
    expect(signedUrl).toContain('/storage/v1/object/sign/partner_docs/');
  });

  it('passes the download option through to Supabase signed URLs', async () => {
    const createSignedUrl = vi.fn().mockResolvedValue({
      data: { signedUrl: 'https://example.supabase.co/storage/v1/object/sign/partner_docs/licenses/user-1/license.pdf?token=abc&download=' },
      error: null,
    });
    const client = {
      storage: {
        from: vi.fn().mockReturnValue({ createSignedUrl }),
      },
    };

    await createPartnerDocSignedUrl(
      client as never,
      'licenses/user-1/license.pdf',
      PARTNER_DOC_SIGNED_URL_TTL_SECONDS,
      { download: true },
    );

    expect(createSignedUrl).toHaveBeenCalledWith(
      'licenses/user-1/license.pdf',
      PARTNER_DOC_SIGNED_URL_TTL_SECONDS,
      { download: true },
    );
  });

  it('blocks malformed or external document paths', async () => {
    const client = {
      storage: {
        from: vi.fn(),
      },
    };

    await expect(
      createPartnerDocSignedUrl(client as never, 'https://evil.example/license.pdf'),
    ).rejects.toThrow('INVALID_PARTNER_DOC_PATH');
  });
});
