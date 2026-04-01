/**
 * GA4 Analytics — 퍼널 이벤트 트래킹
 * VITE_GA4_MEASUREMENT_ID 없으면 조용히 비활성화
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

const GA_ID = import.meta.env.VITE_GA4_MEASUREMENT_ID as string | undefined;

// GA4 스크립트 동적 로드 (ID 있을 때만)
if (GA_ID && GA_ID.startsWith('G-') && typeof document !== 'undefined') {
  window.gtag?.('js', new Date());
  window.gtag?.('config', GA_ID, { send_page_view: false });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);
}

function ga(event: string, params?: Record<string, unknown>) {
  if (!GA_ID || typeof window.gtag !== 'function') return;
  window.gtag('event', event, params);
}

export const analytics = {
  /** 시설 상세 시트 열림 */
  facilityDetailOpen(facilityId: string, facilityName: string, facilityType: string) {
    ga('facility_detail_open', {
      facility_id: facilityId,
      facility_name: facilityName,
      facility_type: facilityType,
    });
  },

  /** 예약 모달 열림 (방문 예약 버튼 클릭) */
  reservationStart(facilityId: string, facilityName: string) {
    ga('reservation_start', {
      facility_id: facilityId,
      facility_name: facilityName,
    });
  },

  /** 예약 단계 이동 */
  reservationStep(step: number, facilityId: string) {
    ga('reservation_step', {
      step_number: step,
      facility_id: facilityId,
    });
  },

  /** 예약 최종 완료 */
  reservationComplete(facilityId: string, facilityName: string, amount: number) {
    ga('reservation_complete', {
      facility_id: facilityId,
      facility_name: facilityName,
      value: amount,
      currency: 'KRW',
    });
  },

  /** 상담 신청 제출 */
  consultationSubmit(facilityId: string, category: string) {
    ga('consultation_submit', {
      facility_id: facilityId,
      category,
    });
  },

  /** AI 채팅 열림 */
  aiChatOpen(facilityId: string, facilityName: string) {
    ga('ai_chat_open', {
      facility_id: facilityId,
      facility_name: facilityName,
    });
  },

  /** 페이지뷰 (SPA 라우트 변경 시) */
  pageView(path: string) {
    if (!GA_ID || typeof window.gtag !== 'function') return;
    window.gtag('event', 'page_view', { page_path: path });
  },

  // ── Phase 0: 온보딩 계측 이벤트 ──

  /** 화면 진입 */
  screenView(screen: string, device: 'mobile' | 'desktop', isFirstVisit: boolean) {
    ga('screen_view', { screen, device, is_first_visit: isFirstVisit });
  },

  /** 첫 유의미 행동 (카드 클릭 / 탭 전환 / CTA 클릭 / 검색) */
  firstInteraction(type: 'card' | 'tab' | 'cta' | 'search') {
    ga('first_interaction', { interaction_type: type });
  },

  /** 하단 탭 전환 */
  tabSwitch(from: string, to: string) {
    ga('tab_switch', { from_tab: from, to_tab: to });
  },

  /** CTA 클릭 */
  ctaClick(ctaName: string, source: string) {
    ga('cta_click', { cta_name: ctaName, source });
  },

  /** 이탈 (10초 + 상호작용 없음) */
  bounce(screen: string, device: 'mobile' | 'desktop') {
    ga('bounce', { screen, device });
  },
};
