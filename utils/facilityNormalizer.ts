/**
 * Facility Normalizer - App.tsx에서 3벌 중복되던 타입 정규화/이미지 로직 통합
 */
import type { FacilityCategoryType } from '../types';
import { FUNERAL_COMPANIES } from '../constants';

// ── Bad URL Detection ──
// 주의: '/defaults/'는 DB에 의도적으로 배정한 기본 이미지 경로이므로 차단 대상이 아님
const BAD_URL_PATTERNS = [
  'placeholder', 'placehold.it', 'placehold.co',
  'mediahub.seoul.go.kr',
  'noimage', 'no-image', 'guitar',
  '_random',
];

const MISSING_ONLY_PATTERNS = ['placeholder', 'noimage', 'guitar'];

export function isBadUrl(url: string): boolean {
  if (!url) return true;
  return BAD_URL_PATTERNS.some(pattern => url.toLowerCase().includes(pattern));
}

function isOnlyMissing(url: string): boolean {
  if (!url) return true;
  return MISSING_ONLY_PATTERNS.some(p => url.toLowerCase().includes(p));
}

// ── 공용/기본 이미지 판별 (목록 썸네일에서 반복 실사 착각 방지) ──
// DB에 대량 배정된 공용 이미지 경로 패턴 (시설별 고유 사진이 아님)
const SHARED_IMAGE_PATTERNS = [
  '/images/defaults/',           // 로컬 기본 이미지 (funeral_1~8.webp 등)
  'funeral_real/funeral_real_',  // 대량 배정된 장례식장 공용 사진 (8종, 각 64~83건)
  'optimized-park/Image_fx',    // AI 생성 공원묘지 공용 사진 (6종, 각 45~117건)
];

/** 대량 배정된 공용/기본 이미지인지 판별. 목록 썸네일에서만 사용. */
export function isSharedDefaultImage(url: string): boolean {
  if (!url) return true;
  return SHARED_IMAGE_PATTERNS.some(pattern => url.includes(pattern));
}

// ── Sangjo Detection ──
const SANGJO_KEYWORDS = ['프리드라이프', '대명스테이션', '보람상조', '교원라이프', '상조', '라이프'];

// FUNERAL_COMPANIES 이름 + DB에만 존재하는 추가 상조회사명
const SANGJO_COMPANY_NAMES = new Set([
  ...FUNERAL_COMPANIES.map(c => c.name),
  '금강문화허브', '두레문화', '에스제인산림조합', '전국서비스',
]);

function isSangjoByName(name: string): boolean {
  if (SANGJO_COMPANY_NAMES.has(name)) return true;
  return SANGJO_KEYWORDS.some(keyword => name.includes(keyword));
}

// ── Type Normalization ──
const TYPE_MAP: Record<string, string> = {
  'funeral_home': 'funeral', 'funeral': 'funeral', 'funeral_hall': 'funeral',
  '장례식장': 'funeral',
  'charnel_house': 'charnel', 'charnel': 'charnel', 'memorial': 'charnel', 'columbarium': 'charnel',
  '봉안시설': 'charnel',
  'natural_burial': 'natural', 'natural': 'natural', 'tree_burial': 'natural',
  '자연장': 'natural',
  'park_cemetery': 'park', 'park': 'park', 'complex': 'park', 'cemetery': 'park',
  '공원묘지': 'park',
  'pet_funeral': 'pet', 'pet': 'pet', 'pet_memorial': 'pet',
  '동물장례': 'pet',
  'sea_burial': 'sea', 'sea': 'sea',
  '해양장': 'sea',
  'sangjo': 'sangjo', '상조': 'sangjo',
};

// fetchFacilities / handleMapBoundsChange 용 (DB 카테고리명 반환)
const CATEGORY_DB_MAP: Record<string, string> = {
  'funeral': 'funeral_home',
  'charnel': 'columbarium',
  'natural': 'natural_burial',
  'park': 'cemetery',
  'pet': 'pet_funeral',
  'sea': 'sea_burial',
  'sangjo': 'sangjo',
};

// fetchFacilityDetails 용 (한글 라벨 반환)
const CATEGORY_LABEL_MAP: Record<string, string> = {
  'funeral': '장례식장',
  'charnel': '봉안시설',
  'natural': '자연장',
  'park': '공원묘지',
  'pet': '동물장례',
  'sea': '해양장',
  'sangjo': '상조',
};

export function normalizeType(rawType: string, name: string): string {
  if (rawType === 'sangjo' || rawType === '상조') return 'sangjo';
  const mapped = TYPE_MAP[rawType];
  if (mapped) return mapped;
  if (isSangjoByName(name)) return 'sangjo';
  return 'charnel';
}

export function getCategoryDb(type: string): FacilityCategoryType {
  return (CATEGORY_DB_MAP[type] || 'columbarium') as FacilityCategoryType;
}

export function getCategoryLabel(type: string): FacilityCategoryType {
  return (CATEGORY_LABEL_MAP[type] || '봉안시설') as FacilityCategoryType;
}

// ── Default Image Map ──
// fetchFacilities & handleMapBoundsChange 에서 사용 (로컬 경로 기반)
const DEFAULT_IMAGE_MAP_LOCAL: Record<string, string[]> = {
  'funeral': Array.from({ length: 8 }, (_, i) => `/images/defaults/funeral/funeral_${i + 1}.jpg`),
  'charnel': Array.from({ length: 13 }, (_, i) => `/images/defaults/columbarium/columbarium_${i + 1}.jpg`),
  'natural': Array.from({ length: 8 }, (_, i) => `/images/defaults/natural/natural_${i + 1}.png`),
  'park': Array.from({ length: 11 }, (_, i) => `/images/defaults/cemetery/cemetery_${i + 1}.png`),
  'cemetery': Array.from({ length: 11 }, (_, i) => `/images/defaults/cemetery/cemetery_${i + 1}.png`),
  'sangjo': [
    'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/defaults/funeral.jpg',
    'https://images.unsplash.com/photo-1595852504369-0268ec35c678?q=80&w=800',
    'https://images.unsplash.com/photo-1518655007328-97c7689d0b61?q=80&w=800',
  ],
  'pet': [
    'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/defaults/pet.jpg',
    'https://images.unsplash.com/photo-1544568100-847a948585b9?q=80&w=800',
    'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=800',
    'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=800',
  ],
  'sea': [
    'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/defaults/sea.jpg',
    'https://images.unsplash.com/photo-1505228395891-9a51e7e86bf6?q=80&w=800',
    'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?q=80&w=800',
    'https://images.unsplash.com/photo-1483683804023-6ccdb62f86ef?q=80&w=800',
  ],
};

// fetchFacilityDetails 에서 사용 (원격 URL 기반)
const DEFAULT_IMAGE_MAP_REMOTE: Record<string, string[]> = {
  'funeral': [
    'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/defaults/funeral.jpg',
    'https://images.unsplash.com/photo-1516733968668-dbdce39c4a41?q=80&w=800',
    'https://images.unsplash.com/photo-1544161515-4af62f4b92ba?q=80&w=800',
  ],
  'charnel': [
    'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/defaults/charnel.jpg',
    'https://images.unsplash.com/photo-1518135714426-c18f5fe26967?q=80&w=800',
    'https://images.unsplash.com/photo-1471623197343-ccb79a1bd717?q=80&w=800',
  ],
  'natural': [
    'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/defaults/natural.jpg',
    'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?q=80&w=800',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=800',
  ],
  'park': [
    'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/defaults/park.jpg',
    'https://images.unsplash.com/photo-1531171012276-10f293385226?q=80&w=800',
    'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?q=80&w=800',
  ],
  'pet': [
    'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/defaults/pet.jpg',
    'https://images.unsplash.com/photo-1544568100-847a948585b9?q=80&w=800',
    'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=800',
  ],
  'sea': [
    'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/defaults/sea.jpg',
    'https://images.unsplash.com/photo-1505228395891-9a51e7e86bf6?q=80&w=800',
    'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?q=80&w=800',
  ],
  'sangjo': [
    'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/defaults/funeral.jpg',
    'https://images.unsplash.com/photo-1595852504369-0268ec35c678?q=80&w=800',
    'https://images.unsplash.com/photo-1518655007328-97c7689d0b61?q=80&w=800',
  ],
};

// ── FNV-1a Hash (결정론적, 균일 분산) ──
function fnv1aHash(str: string): number {
  if (!str) return 0;
  let hash = 0x811c9dc5; // FNV offset basis (32-bit)
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193); // FNV prime (32-bit)
  }
  return Math.abs(hash);
}

// ── Image Selection ──
export function selectFacilityImage(
  rawImages: string[],
  dbImageUrl: string,
  type: string,
  id: string,
  useRemoteDefaults = false
): string {
  // 1. First Pass: REAL photo
  let selectedImage = rawImages.find((url: string) => !isBadUrl(url));
  if (!selectedImage && dbImageUrl && !isBadUrl(dbImageUrl)) {
    selectedImage = dbImageUrl;
  }

  // 2. Second Pass: Allow internal placeholders if no real photo
  if (!selectedImage) {
    selectedImage = rawImages.find((url: string) => !isOnlyMissing(url))
      || (isOnlyMissing(dbImageUrl) ? null : dbImageUrl)
      || undefined;
  }

  // 3. Ultimate Fallback: Category-based default (FNV-1a hash for even distribution)
  if (!selectedImage) {
    const defaultMap = useRemoteDefaults ? DEFAULT_IMAGE_MAP_REMOTE : DEFAULT_IMAGE_MAP_LOCAL;
    const options = defaultMap[type] || defaultMap['funeral'];
    selectedImage = options[fnv1aHash(id) % options.length];
  }

  return selectedImage!;
}

// ── Price Display ──
export function formatPriceRange(priceMin: number | string | null | undefined): string {
  if (!priceMin) return '가격 정보 상담';
  const price = Number(priceMin);
  if (price >= 10000) return `${Math.round(price / 10000).toLocaleString()}만원~`;
  if (price > 0) return `${price.toLocaleString()}원~`;
  return '가격 정보 상담';
}
