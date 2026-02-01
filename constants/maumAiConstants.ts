export const FUNERAL_URGENCY_OPTIONS = [
    { id: 'deceased', label: '⚫ 임종(운명)하셨습니다', sub: '장례 접수 진행' },
    { id: 'imminent', label: '🔵 임종이 임박하여 미리 상담', sub: '사전 상담 및 예약 준비' },
    { id: 'inquiry', label: '⚪ 시설 이용 안내 및 단순 문의', sub: '시설 정보 확인' }
];

export const FUNERAL_SCALE_OPTIONS = [
    { id: 'small', label: '약 50명 미만', sub: '가족장, 30~40평형' },
    { id: 'medium', label: '약 100~200명', sub: '일반적인 규모, 50~60평형' },
    { id: 'large', label: '300명 이상', sub: '대규모, 80평형 이상' }
];

export const FUNERAL_RELIGION_OPTIONS = [
    { id: 'buddhist', label: '☸️ 불교', sub: '전통식, 분향' },
    { id: 'christian', label: '✝️ 기독교', sub: '예배 중심, 헌화' },
    { id: 'catholic', label: '⛪ 천주교', sub: '연도회, 미사' },
    { id: 'none', label: '🕊️ 무교/기타', sub: '일반 장례' }
];

export const FUNERAL_SCHEDULE_OPTIONS = [
    { id: '3day', label: '3일장 (일반적)', sub: '오늘 입실 → 내일 입관 → 모레 발인' },
    { id: '2day', label: '2일장 (간소화)', sub: '오늘 입실 → 내일 입관 후 바로 발인' },
    { id: 'other', label: '기타 (상담 필요)', sub: '상담원과 일정 협의' }
];

export const FUNERAL_SERVICE_OPTIONS = ['🅿️ 주자창 완비', '🛁 샤워실 구비', '🥣 식사 제공', '🦼 장례용품 제공', '🚑 운구차 지원'];


// Memorial (Charnel House/Burial) Options
export const MEMORIAL_TIMING_OPTIONS = [
    { id: 'immediate', label: '🚨 지금 안치해야 해요 (긴급)', sub: '화장 후 바로 안치 필요' },
    { id: 'prepare', label: '📅 미리 알아보고 있어요', sub: '사전 답사 및 가격 비교' }
];

export const MEMORIAL_RELIGION_OPTIONS = [
    { id: 'none', label: '무교/일반', icon: '🏛️' },
    { id: 'christian', label: '기독교 전용', icon: '✝️' },
    { id: 'catholic', label: '천주교 전용', icon: '⛪' },
    { id: 'buddhist', label: '불교 전용', icon: '☸️' }
];

export const MEMORIAL_BUDGET_OPTIONS = [
    { id: 'low', label: '실속형 (500만 원 미만)', sub: '합리적인 가격의 안식처' },
    { id: 'medium', label: '표준형 (500~1,000만 원)', sub: '가장 많이 찾는 가격대' },
    { id: 'high', label: '고급형 (1,000만 원 이상)', sub: '품격 있는 프리미엄 시설' }
];

export const MEMORIAL_SERVICE_OPTIONS = ['🚗 주차 편리', '🚌 셔틀버스', '☕ 카페/편의시설', '🕰️ 365일 개방', '🏞️ 자연 경관'];
