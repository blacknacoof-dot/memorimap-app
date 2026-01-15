
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 카테고리 변환 유틸리티
// 생성일: 2026-01-15T01:27:41.075Z
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { FacilityType, CATEGORY_LABELS, CATEGORY_VALUES } from './types';

/**
 * DB 카테고리 값을 한글 라벨로 변환
 */
export function getCategoryLabel(category: FacilityType): string {
  return CATEGORY_LABELS[category] || category;
}

/**
 * 한글 라벨을 DB 카테고리 값으로 변환
 */
export function getCategoryValue(label: string): FacilityType {
  return CATEGORY_VALUES[label] || 'charnel_house';
}

/**
 * 모든 카테고리 목록 (한글)
 */
export function getAllCategoryLabels(): string[] {
  return Object.values(CATEGORY_LABELS);
}

/**
 * 모든 카테고리 값 (영문)
 */
export function getAllCategoryValues(): FacilityType[] {
  return Object.keys(CATEGORY_LABELS) as FacilityType[];
}

/**
 * 카테고리 선택 옵션 생성
 */
export function getCategoryOptions() {
  return getAllCategoryValues().map(value => ({
    value,
    label: getCategoryLabel(value)
  }));
}

/**
 * 레거시 데이터 변환 (마이그레이션용)
 */
export function migrateLegacyCategory(oldCategory: string): FacilityType {
  // 기존 한글 카테고리를 새 영문 값으로 변환
  return getCategoryValue(oldCategory);
}
