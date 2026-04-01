/**
 * Feature Flags — 롤백 토글 (단일 진실)
 *
 * 롤백 시나리오:
 *   1차: mobileWelcomeSheet = false → 시트만 제거, 목록 기본 유지
 *   2차: mobileListDefault = false → 기존 지도 기본 복귀
 *   전체: 둘 다 false → 현재와 100% 동일, 계측만 유지
 */
export const FEATURE_FLAGS = {
  /** Phase 1: 모바일 첫 진입 시 목록 기본 (false면 기존 지도 기본) */
  mobileListDefault: true,

  /** Phase 2: 첫 방문 웰컴 하프시트 */
  mobileWelcomeSheet: true,

  /** 계측 이벤트 수집 (UI 롤백과 독립) */
  analytics: true,
} as const;
