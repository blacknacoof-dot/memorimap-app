import type { SupabaseClient } from '@supabase/supabase-js';

const PARTNER_DOC_PUBLIC_MARKER = '/storage/v1/object/public/partner_docs/';
const PARTNER_DOC_SIGNED_MARKER = '/storage/v1/object/sign/partner_docs/';

export const PARTNER_DOC_SIGNED_URL_TTL_SECONDS = 60;

export function normalizePartnerDocPath(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      const publicMarkerIndex = url.pathname.indexOf(PARTNER_DOC_PUBLIC_MARKER);
      if (publicMarkerIndex >= 0) {
        return decodeURIComponent(
          url.pathname.slice(publicMarkerIndex + PARTNER_DOC_PUBLIC_MARKER.length).replace(/^\/+/, ''),
        );
      }

      const signedMarkerIndex = url.pathname.indexOf(PARTNER_DOC_SIGNED_MARKER);
      if (signedMarkerIndex >= 0) {
        return decodeURIComponent(
          url.pathname.slice(signedMarkerIndex + PARTNER_DOC_SIGNED_MARKER.length).replace(/^\/+/, ''),
        );
      }
    } catch {
      return null;
    }

    return null;
  }

  if (trimmed.startsWith('partner_docs/')) {
    return trimmed.slice('partner_docs/'.length).replace(/^\/+/, '') || null;
  }

  if (trimmed.startsWith('licenses/')) {
    return trimmed;
  }

  const normalized = trimmed.replace(/^\/+/, '');
  return normalized || null;
}

export function hasPartnerDocument(value?: string | null): boolean {
  if (!value) return false;
  return normalizePartnerDocPath(value) !== null;
}

interface PartnerDocStorageClient {
  storage: Pick<SupabaseClient['storage'], 'from'>;
}

interface PartnerDocSignedUrlOptions {
  download?: boolean | string;
}

export async function createPartnerDocSignedUrl(
  client: PartnerDocStorageClient,
  storedValue: string,
  expiresIn = PARTNER_DOC_SIGNED_URL_TTL_SECONDS,
  options?: PartnerDocSignedUrlOptions,
): Promise<string> {
  const objectPath = normalizePartnerDocPath(storedValue);
  if (!objectPath) {
    throw new Error('INVALID_PARTNER_DOC_PATH');
  }

  const { data, error } = await client.storage
    .from('partner_docs')
    .createSignedUrl(objectPath, expiresIn, options);

  if (error || !data?.signedUrl) {
    throw error || new Error('PARTNER_DOC_SIGNED_URL_FAILED');
  }

  return data.signedUrl;
}
