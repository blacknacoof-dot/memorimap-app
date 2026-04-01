/**
 * 디바이스 판별 유틸리티
 */

const MOBILE_BREAKPOINT = 768;

/**
 * 현재 뷰포트가 모바일 크기인지 판별 (Tailwind md 기준 768px)
 * SSR 환경에서는 false 반환 (데스크톱 = 기존 지도 기본)
 */
export function isMobileViewport(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < MOBILE_BREAKPOINT;
}
