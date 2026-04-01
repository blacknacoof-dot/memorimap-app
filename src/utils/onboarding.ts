/**
 * 온보딩 상태 관리 유틸리티
 * localStorage 키는 버전화하여 실험안 교체 시 충돌 방지
 */

const WELCOME_KEY = 'memorimap_welcome_seen_v1';

/** 웰컴 시트를 이미 본 사용자인지 확인 */
export function hasSeenWelcome(): boolean {
  if (typeof window === 'undefined') return true; // SSR: 시트 안 보임
  try {
    return localStorage.getItem(WELCOME_KEY) === 'true';
  } catch {
    return true; // localStorage 접근 불가 시 시트 안 보임
  }
}

/** 웰컴 시트를 봤음으로 표시 */
export function markWelcomeSeen(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(WELCOME_KEY, 'true');
  } catch {
    // localStorage 접근 불가 시 무시 (다음 방문에 다시 보일 수 있음)
  }
}

/** 웰컴 시트 노출 상태 초기화 (테스트/디버그용) */
export function clearWelcomeSeen(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(WELCOME_KEY);
  } catch {
    // 무시
  }
}
