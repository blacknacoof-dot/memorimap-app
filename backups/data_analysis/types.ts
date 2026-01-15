
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 실제 데이터 기반 타입 정의
// 생성일: 2026-01-15T01:27:41.070Z
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// [1] Facility 타입 (DB ENUM과 일치)
export type FacilityType = 
  | 'charnel_house'
  | 'funeral'
  | 'natural_burial'
  | 'charnel'
  | 'pet_funeral'
  | 'funeral_hall'
  | 'etc'
  | 'park_cemetery'
  | 'sea'
  | 'pet';

// [2] 카테고리 한글 라벨
export const CATEGORY_LABELS: Record<FacilityType, string> = {
  'charnel_house': 'charnel_house',
  'funeral': 'funeral',
  'natural_burial': 'natural_burial',
  'charnel': 'charnel',
  'pet_funeral': 'pet_funeral',
  'funeral_hall': 'funeral_hall',
  'etc': 'etc',
  'park_cemetery': 'park_cemetery',
  'sea': 'sea',
  'pet': 'pet'
};

// [3] 역방향 매핑 (한글 → 영문)
export const CATEGORY_VALUES: Record<string, FacilityType> = {
  'charnel_house': 'charnel_house',
  'funeral': 'funeral',
  'natural_burial': 'natural_burial',
  'charnel': 'charnel',
  'pet_funeral': 'pet_funeral',
  'funeral_hall': 'funeral_hall',
  'etc': 'etc',
  'park_cemetery': 'park_cemetery',
  'sea': 'sea',
  'pet': 'pet'
};

// [4] 헬퍼 함수
export function getCategoryLabel(category: FacilityType): string {
  return CATEGORY_LABELS[category] || category;
}

export function getCategoryValue(label: string): FacilityType {
  return CATEGORY_VALUES[label] || 'charnel_house';
}

// [5] Facility 인터페이스 (업데이트)
export interface Facility {
  id: string;
  name: string;
  category: FacilityType; // ← 수정됨!
  address: string;
  description?: string;
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };
  images?: string[];
  priceRange?: string;
  rating?: number;
  reviewCount?: number;
  features?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

// [6] 통계 정보 (참고용)
/*
실제 데이터 분포:
  charnel_house: 454개
  funeral: 990개
  natural_burial: 41개
  charnel: 583개
  pet_funeral: 24개
  funeral_hall: 8개
  etc: 1개
  park_cemetery: 2개
  sea: 4개
  pet: 44개

총 시설 수: 2151
*/
