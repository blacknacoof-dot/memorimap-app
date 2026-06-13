export const SANGJO_REPRESENTATIVE_PLACEHOLDER = '/images/placeholders/sangjo-representative.svg';

const EMPTY_IMAGE_VALUES = new Set(['', 'null', 'undefined']);
const SANGJO_GALLERY_PATH = '/images/sangjo/gallery/';

const COMPANY_IMAGE_OVERRIDES: Record<string, string> = {
  "\ud504\ub9ac\ub4dc\ub77c\uc774\ud504": '/images/logos/fc_new_1.png',
  "\uad50\uc6d0\ub77c\uc774\ud504": '/images/logos/fc_new_2.png',
  "\ub300\uba85\uc2a4\ud14c\uc774\uc158": '/images/logos/fc_new_3.png',
  "\ub354\ucf00\uc774\uc608\ub2e4\ud568": '/images/logos/\uc608\ub2e4\ud568\uc0c1\uc870.JPG',
  "\ub354\ub9ac\ubcf8": '/images/logos/\ub354\ub9ac\ubcf8.JPG',
  "\ubd80\ubaa8\uc0ac\ub791": '/images/logos/fc_new_7.png',
  "\ub354\ud53c\ud50c\ub77c\uc774\ud504": '/images/logos/fc_new_9.png',
  "\uc0c1\uc870114": '/images/logos/\uc0c1\uc870114.JPG',
  "\ub298\uacc1\uc560\ub77c\uc774\ud504\uc628": '/images/logos/\ub298\uacc1\uc560\ub77c\uc774\ud504\uc628.JPG',
  "\uacbd\uc6b0\ub77c\uc774\ud504": '/images/logos/\uacbd\uc6b0\ub77c\uc774\ud504.JPG',
  "\ub2e4\uc628\ud50c\ub79c": '/images/logos/\ub2e4\uc628\ud50c\ub79c.JPG',
  "\uae08\ud638\ub77c\uc774\ud504": '/images/logos/\uae08\ud638\ub77c\uc774\ud504.JPG',
  "\ubcf4\ub78c\uc0c1\uc870": '/images/logos/\ubcf4\ub78c\uc0c1\uc870.JPG',
  "\ubcf4\ub78c\uc0c1\uc870\uac1c\ubc1c": '/images/logos/\ubcf4\ub78c\uc0c1\uc870.JPG',
  "\ubcf4\ub78c\uc0c1\uc870\ub77c\uc774\ud504": '/images/logos/\ubcf4\ub78c\uc0c1\uc870.JPG',
  "\ubcf4\ub78c\uc0c1\uc870\ub9ac\ub354\uc2a4": '/images/logos/\ubcf4\ub78c\uc0c1\uc870.JPG',
  "\ubcf4\ub78c\uc0c1\uc870\ud53c\ud50c": '/images/logos/\ubcf4\ub78c\uc0c1\uc870\ud53c\ud50c.JPG',
  "\ubcf4\ub78c\uc0c1\uc870\uc560\ub2c8\ucf5c": '/images/logos/\ubcf4\ub78c\uc0c1\uc870.JPG',
  "\ubcf4\ub78c\uc0c1\uc870\uc2e4\ub85c\uc554": '/images/logos/\ubcf4\ub78c\uc0c1\uc870.JPG',
  "\uc0c8\ubd80\uc0b0\uc0c1\uc870": SANGJO_REPRESENTATIVE_PLACEHOLDER,
  "3\uc77c\uc758\uc57d\uc18d": 'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/sangjo/promise_3days.JPG?t=1770006705845',
  "\ubc14\ub978\ub77c\uc774\ud504": 'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/sangjo/bareun_life.JPG?t=1770006464299',
  "\ucc29\ud55c\uc0c1\uc870": 'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/sangjo/good_sangjo_1770009186749.jpg',
};

function normalizeImageValue(value: unknown): string | null {
  if (value == null) return null;

  const normalized = String(value).trim();
  if (EMPTY_IMAGE_VALUES.has(normalized.toLowerCase())) return null;

  if (/^(data:|blob:)/i.test(normalized)) return normalized;

  if (/^https?:\/\//i.test(normalized)) {
    if (/\s/.test(normalized)) return null;
    try {
      return new URL(normalized).toString();
    } catch {
      return null;
    }
  }

  if (normalized.startsWith('/images/') || normalized.startsWith('/assets/')) {
    try {
      return encodeURI(decodeURI(normalized));
    } catch {
      return encodeURI(normalized);
    }
  }

  return null;
}

function normalizeCompanyName(companyName?: unknown): string {
  return String(companyName || '').replace(/\s/g, '');
}

function getCompanyImageOverride(companyName?: unknown): string | null {
  const override = COMPANY_IMAGE_OVERRIDES[normalizeCompanyName(companyName)];
  return override ? normalizeImageValue(override) : null;
}

export function isGalleryImagePath(value: unknown): boolean {
  const normalized = normalizeImageValue(value);
  return normalized ? normalized.includes(SANGJO_GALLERY_PATH) : false;
}

export function isValidRepresentativeImage(value: unknown): value is string {
  return normalizeImageValue(value) !== null && !isGalleryImagePath(value);
}

interface RepresentativeImageCandidates {
  companyName?: unknown;
  logoUrl?: unknown;
  representativeImage?: unknown;
  staticImageUrl?: unknown;
  imageUrl?: unknown;
  facilityImageUrl?: unknown;
}

export function getSangjoRepresentativeImage(candidates: RepresentativeImageCandidates): string {
  const representativeImage = [
    getCompanyImageOverride(candidates.companyName),
    candidates.logoUrl,
    candidates.representativeImage,
    candidates.staticImageUrl,
    candidates.imageUrl,
    candidates.facilityImageUrl,
  ].find(isValidRepresentativeImage);

  return representativeImage ? String(representativeImage).trim() : SANGJO_REPRESENTATIVE_PLACEHOLDER;
}

export function getSangjoGalleryImages(values: unknown, fallbackImage?: unknown, companyName?: unknown): string[] {
  if (!Array.isArray(values)) return [];

  const representativeImage = getSangjoRepresentativeImage({
    companyName,
    imageUrl: fallbackImage,
  });
  const excludedImages = new Set(
    [representativeImage, normalizeImageValue(fallbackImage)]
      .filter((value): value is string => Boolean(value)),
  );

  return Array.from(new Set(
    values
      .map(normalizeImageValue)
      .filter((value): value is string => value !== null)
      .filter((value) => !excludedImages.has(value)),
  ));
}
