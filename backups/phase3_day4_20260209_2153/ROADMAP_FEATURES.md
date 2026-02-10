# 🚀 추모맵 업그레이드 및 기능 추가 추천 문서

**작성일:** 2026년 2월 7일  
**버전:** 1.0  
**대상:** 추모맵 개발팀 및 기획팀

---

## 📊 현재 상태 분석

| 항목 | 현재 상태 | 권장 수준 | 우선순위 |
|------|-----------|-----------|----------|
| **사용자 기능** | 지도 검색, AI 상담, 찜하기 | ✅ 기본 기능 완성 | 유지 |
| **관리자 기능** | 시설 관리, 승인 시스템 | ⚠️ CRM 기능 부족 | 2순위 |
| **데이터 분석** | 없음 | 🆕 도입 필요 | 3순위 |
| **모바일 최적화** | 기본 | 🆕 PWA 고려 | 3순위 |
| **보안** | 기본 | 🆕 강화 필요 | 1순위 |
| **타입 안정성** | 46개 오류 | 🆕 완전 해결 | 1순위 |

---

## 🎯 기능 로드맵 (4단계)

---

## Phase 1: 긴급 개선 (1-2주)

### 1️⃣ 보안 강화 패키지 🔴

**목표:** 사용자 데이터 보호 및 서비스 안정성 확보

#### 적용 항목
- [ ] **XSS 취약점 패치** (4개 파일)
  - `ChatInterface.tsx`, `FuneralSearchForm.tsx`, `PetChatInterface.tsx`
  - DOMPurify 라이브러리 적용
  - 사용자 입력값 sanitize 처리

- [ ] **API Key 재생성 및 환경 변수 정리**
  - Supabase Service Role Key 재생성
  - Google Gemini API Key 재생성
  - Naver Client Secret 재생성
  - Git 히스토리에서 `.env.local` 완전 삭제 (BFG Repo-Cleaner)

- [ ] **Error Boundary 구현**
  - 전역 오류 처리 컴포넌트
  - 사용자 친화적 오류 페이지
  - 오류 로깅 및 모니터링 연동

**예상 소요시간:** 16-24시간  
**담당:** 백엔드/프론트엔드 개발자

---

### 2️⃣ 타입스크립트 안정화 🔴

**목표:** 46개 컴파일 오류 해결 및 타입 안정성 확보

#### 주요 오류 목록
```
❌ 모듈/임포트 오류: 6개
   - components/index.ts (4개)
   - src/pages/admin/facility/faq.tsx (1개)

❌ 함수 누락 오류: 8개
   - AdminCommunication.tsx (4개)
   - ReviewForm.tsx (2개)

❌ 타입 불일치 오류: 18개
   - App.tsx, AdminView.tsx, hooks/useFacilities.ts 등

❌ Deno/Supabase Functions: 12개
   - supabase/functions/* (TypeScript 환경 설정 문제)
```

#### 해결 방안
1. **누락된 함수 구현** (`lib/queries.ts`)
   - `createNotice()`, `getNotices()`, `getInquiries()`
   - `checkExistingReview()`

2. **타입 정의 강화**
   - `Facility` 인터페이스에 `aiContext` 추가
   - `sangjo` 카테고리 카운트 누락 수정
   - `number | undefined` → `number` 변환 처리

**예상 소요시간:** 8-12시간  
**담당:** 프론트엔드 개발자

---

## Phase 2: 사용자 경험 개선 (3-4주)

### 3️⃣ 스마트 검색 시스템 🟡

**목표:** 사용자 검색 편의성 향상 및 정확도 개선

#### 기능 상세
```typescript
interface SmartSearchFeatures {
  // AI 자연어 검색
  naturalLanguageQuery: boolean;  // "강남역 근처 24시간 장례식장"
  
  // 음성 검색
  voiceSearch: boolean;
  
  // 검색어 자동완성/추천
  autocomplete: {
    recentSearches: string[];     // 최근 검색어
    popularSearches: string[];    // 인기 검색어
    suggestions: string[];        // 자동완성
  };
  
  // 고급 필터
  advancedFilters: {
    priceRange: [number, number];
    religion: string[];
    facilitySize: 'small' | 'medium' | 'large';
    parkingAvailable: boolean;
    24HourOperation: boolean;
  };
}
```

#### UI/UX 개선
- [ ] 검색바 UI 개선 (플레이스홀더, 아이콘)
- [ ] 필터 칩 디자인 개선
- [ ] 검색 결과 정렬 옵션 (정확도/거리/가격/평점)
- [ ] 검색 결과 미리보기 카드

**예상 소요시간:** 24-32시간  
**담당:** 프론트엔드 개발자 1명, UI/UX 디자이너 0.5명

---

### 4️⃣ 시설 비교 기능 강화 🟡

**목표:** 사용자 의사결정 지원 및 시설 간 차별화

#### 기능 상세
```typescript
interface EnhancedComparison {
  // 다중 비교 (3개 이상)
  multiCompare: {
    maxItems: 5;
    facilities: Facility[];
  };
  
  // 상세 비교표
  comparisonTable: {
    basicInfo: ['name', 'address', 'phone', 'category'];
    pricing: ['basicPrice', 'optionalServices', 'avgContractPrice'];
    facilities: ['parking', 'capacity', 'rooms', 'religionSupport'];
    reviews: ['avgRating', 'reviewCount', 'keywordAnalysis'];
  };
  
  // 가격 투명성
  priceTransparency: {
    displayedPrice: number;
    actualContractPrice: number;
    priceDifference: number;
    priceIndex: 'high' | 'medium' | 'low';
  };
  
  // 실시간 예약 가능 여부
  realtimeAvailability: {
    availableDates: Date[];
    consultationAvailable: boolean;
    immediateBooking: boolean;
  };
  
  // 후기 분석
  reviewAnalysis: {
    positiveKeywords: string[];
    negativeKeywords: string[];
    sentiment: 'positive' | 'neutral' | 'negative';
  };
}
```

**예상 소요시간:** 32-40시간  
**담당:** 프론트엔드 개발자 1명, 백엔드 개발자 0.5명

---

### 5️⃣ 개인화 추천 엔진 🟡

**목표:** 사용자 행동 기반 맞춤형 서비스 제공

#### 알고리즘 로직
```typescript
interface PersonalizationEngine {
  // 사용자 프로필 분석
  userProfile: {
    preferredRegions: string[];      // 자주 검색한 지역
    preferredCategories: string[];   // 선호 시설 유형
    budgetRange: [number, number];   // 예산 범위
    religion: string;                // 종교
    urgency: 'high' | 'medium' | 'low';
  };
  
  // 협업 필터링 (유사 사용자 추천)
  collaborativeFiltering: {
    similarUsers: User[];
    recommendedFacilities: Facility[];
  };
  
  // 콘텐츠 기반 필터링
  contentBased: {
    favoriteBased: Facility[];       // 찜한 시설과 유사한 시설
    viewHistoryBased: Facility[];    // 조회 이력 기반
    consultationBased: Facility[];   // 상담 내역 기반
  };
  
  // AI 추천 메시지
  aiRecommendationMessage: string;  // "자연친화적인 수목장을 선호하시네요"
}
```

#### 구현 위치
- 메인 페이지: "맞춤 추천" 섹션
- 검색 결과: "이런 시설은 어떠세요?"
- 마이페이지: "AI 인사이트" 카드 (이미 계획됨)

**예상 소요시간:** 40-48시간  
**담당:** 백엔드 개발자 1명, 데이터 분석가 0.5명

---

## Phase 3: 비즈니스 기능 (4-6주)

### 6️⃣ 실시간 대시보드 (상조/업주용) 🔴

**목표:** 파트너사를 위한 CRM 및 분석 도구 제공

#### 계획된 기능 (sangjo_chat_buttons.plan.md 기반)

##### A. 채팅 이벤트 스트림
```sql
-- chat_events 테이블
CREATE TABLE chat_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  session_id text,
  partner_id text NOT NULL,
  event_type text NOT NULL, -- 'VIEW_PRODUCT', 'EMERGENCY_REQUEST', etc.
  payload jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);
```

**트래킹 항목:**
- 상품 안내 클릭
- 긴급 접수 클릭
- 장례 절차 조회
- 상담 예약 클릭
- 상품 상세 클릭

##### B. 긴급 요청 알림판
```sql
-- emergency_requests 테이블
CREATE TABLE emergency_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id text NOT NULL,
  customer_name text,
  customer_phone text,
  location text,
  status text DEFAULT 'NEW', -- 'NEW', 'CHECKING', 'DISPATCHED', 'COMPLETED'
  created_at timestamptz DEFAULT now()
);
```

**알림 기능:**
- 실시간 푸시 알림
- SMS 알림
- 대시보드 배너
- 소리 알림

##### C. 상품 분석
```sql
-- product_click_logs 테이블
CREATE TABLE product_click_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id text NOT NULL,
  product_id text NOT NULL,
  product_name text,
  user_id uuid,
  clicked_at timestamptz DEFAULT now()
);
```

**분석 리포트:**
- 인기 상품 순위
- 클릭률 (CTR)
- 전환율 (클릭 → 상담)
- 시간대별 활동

##### D. 상담 CRM
```typescript
interface ConsultationCRM {
  // 상담 대시보드
  liveConsultations: Consultation[];      // 실시간 상담 중
  pendingConsultations: Consultation[];   // 대기 중
  completedConsultations: Consultation[]; // 완료
  
  // 고객 정보
  customerProfile: {
    name: string;
    phone: string;
    inquiryHistory: Inquiry[];
    preferredContactTime: string;
  };
  
  // 상담 품질
  quality: {
    avgResponseTime: number;    // 평균 응답 시간
    satisfaction: number;       // 만족도
    conversionRate: number;     // 전환율
  };
}
```

**예상 소요시간:** 48-64시간  
**담당:** 풀스택 개발자 1명, 프론트엔드 개발자 1명

---

### 7️⃣ CRM 고객 관리 시스템 🟡

**목표:** 파트너사의 고객 관리 효율화

#### 기능 목록
```typescript
interface CRMSystem {
  // 고객 데이터베이스
  customers: {
    id: string;
    name: string;
    phone: string;
    email: string;
    tags: string[];              // 'VIP', '긴급', '재방문' 등
    memo: string;
    createdAt: Date;
  }[];
  
  // 상담 이력 타임라인
  timeline: {
    date: Date;
    type: 'call' | 'chat' | 'visit' | 'email';
    content: string;
    staff: string;
  }[];
  
  // 예약/견적 관리
  reservations: {
    id: string;
    customerId: string;
    date: Date;
    type: 'consultation' | 'visit' | 'contract';
    status: 'pending' | 'confirmed' | 'cancelled';
    notes: string;
  }[];
  
  // 문자/이메일 발송
  messaging: {
    templates: MessageTemplate[];
    scheduledMessages: ScheduledMessage[];
    sendHistory: SendLog[];
  };
  
  // 고객 세그먼트
  segments: {
    newCustomers: Customer[];
    returningCustomers: Customer[];
    vipCustomers: Customer[];
    churnRisk: Customer[];
  };
}
```

**예상 소요시간:** 40-56시간  
**담당:** 풀스택 개발자 1명

---

### 8️⃣ 데이터 분석 플랫폼 🟢

**목표:** 운영 인사이트 도출 및 데이터 기반 의사결정 지원

#### 관리자용 리포트
```typescript
interface AnalyticsDashboard {
  // 지역별 인기 시설
  regionRanking: {
    region: string;
    facilityCount: number;
    avgViews: number;
    avgBookmarks: number;
  }[];
  
  // 카테고리별 트렌드
  categoryTrends: {
    category: string;
    searchVolume: number[];      // 시간별 검색량
    conversionRate: number;
  }[];
  
  // 사용자 행동 히트맵
  behaviorHeatmap: {
    page: string;
    clicks: number;
    timeSpent: number;
    dropOff: number;
  }[];
  
  // 전환율 분석 (Funnel)
  conversionFunnel: {
    stage: string;
    users: number;
    conversionRate: number;
  }[];
  // 조회 → 찜 → 상담 → 계약
  
  // AI 상담 품질
  aiQuality: {
    totalConversations: number;
    avgDuration: number;
    handoverRate: number;        // 상담원 연결율
    satisfaction: number;
    topQuestions: string[];
  };
}
```

#### 구현 도구
- **Chart.js** 또는 **Recharts** (시각화)
- **Supabase Analytics** (기본 제공)
- **Google Data Studio** (고급 리포트)

**예상 소요시간:** 32-40시간  
**담당:** 프론트엔드 개발자 1명, 데이터 분석가 0.5명

---

## Phase 4: 고급 기능 (2-3개월)

### 9️⃣ 온라인 견적/예약 시스템 🔴

**목표:** 사용자 편의성 향상 및 수익화

#### 기능 상세
```typescript
interface BookingSystem {
  // 실시간 견적 계산기
  quoteCalculator: {
    baseServices: Service[];
    optionalServices: Service[];
    totalPrice: number;
    estimatedBreakdown: PriceBreakdown;
  };
  
  // 간편 예약
  booking: {
    facilityId: string;
    date: Date;
    timeSlot: string;
    serviceType: string;
    customerInfo: CustomerInfo;
    specialRequests: string;
  };
  
  // 결제 연동
  payment: {
    methods: ['bank_transfer', 'card', 'kakao_pay', 'naver_pay'];
    deposit: number;              // 예약금
    fullPayment: boolean;         // 전액 결제 옵션
    refundPolicy: RefundPolicy;
  };
  
  // 캘린더 연동
  calendar: {
    googleCalendar: boolean;
    appleCalendar: boolean;
    icsExport: boolean;
  };
  
  // 알림
  notifications: {
    bookingConfirm: boolean;
    reminder24h: boolean;
    reminder1h: boolean;
    changes: boolean;
  };
}
```

**결제 게이트웨이:**
- **PortOne (아임포트)** - 이미 연동됨
- **Toss Payments**
- **Kakao Pay**
- **Naver Pay**

**예상 소요시간:** 64-80시간  
**담당:** 풀스택 개발자 2명

---

### 🔟 콘텐츠 플랫폼 🟢

**목표:** 사용자 교육 및 브랜드 신뢰도 향상

#### 콘텐츠 카테고리
```typescript
interface ContentPlatform {
  // 장례 절차 가이드
  funeralGuides: {
    step: number;
    title: string;
    description: string;
    checklist: string[];
    estimatedTime: string;
    estimatedCost: number;
  }[];
  
  // 법률/행정 정보
  legalInfo: {
    inheritance: Article[];
    insurance: Article[];
    tax: Article[];
    documents: DocumentGuide[];
  };
  
  // 추모 공간 스토리텔링
  memorialStories: {
    facility: Facility;
    story: string;
    images: string[];
    video?: string;
  }[];
  
  // 사용자 후기
  videoReviews: {
    user: User;
    facility: Facility;
    videoUrl: string;
    rating: number;
    tags: string[];
  }[];
  
  // 업체 인터뷰
  partnerStories: {
    partner: Partner;
    interview: QA[];
    behindStory: string;
    photos: string[];
  }[];
}
```

**예상 소요시간:** 40-48시간 (기능 개발) + 콘텐츠 제작 기간  
**담당:** 프론트엔드 개발자 1명, 콘텐츠 팀

---

### 1️⃣1️⃣ 커뮤니티 기능 🟢

**목표:** 사용자 간 정보 공유 및 지지 네트워크 형성

#### 기능 목록
```typescript
interface CommunityPlatform {
  // 익명 상담 게시판
  anonymousBoard: {
    categories: ['general', 'legal', 'emotional', 'reviews'];
    posts: Post[];
    comments: Comment[];
    likes: number;
  };
  
  // 전문가 Q&A
  expertQA: {
    experts: Expert[];           // 법무사, 장례지도사, 상담사
    questions: Question[];
    answers: Answer[];
  };
  
  // 동호회/모임
  supportGroups: {
    name: string;
    description: string;
    members: User[];
    meetings: Meeting[];
    isOnline: boolean;
  }[];
  
  // 경험 공유
  experienceSharing: {
    author: User;
    story: string;
    lessons: string[];
    support: number;             // 응원 수
  }[];
}
```

**커뮤니티 가이드라인:**
- 익명성 보장
- 전문가 인증 시스템
- 부적절한 콘텐츠 필터링
- 상호 존중 문화 유지

**예상 소요시간:** 48-56시간  
**담당:** 풀스택 개발자 1명, 커뮤니티 매니저

---

### 1️⃣2️⃣ 기술 고도화 🟢

**목표:** 최신 기술 적용 및 서비스 경쟁력 강화

#### A. PWA (Progressive Web App)
```typescript
// 기능
- 오프라인 모드 (Service Worker)
- 홈 화면 추가
- 푸시 알림
- 백그라운드 동기화
- 빠른 로딩 (Cache API)
```

**적용 범위:**
- 지도 캐싱
- 최근 검색어 저장
- 찜 목록 오프라인 조회
- AI 상담 기록 로컬 저장

#### B. 실시간 위치 기반 추천
```typescript
// Geofencing
- 현재 위치 기반 주변 시설 추천
- 특정 지역 진입 시 알림
- 위치 기반 필터 자동 적용
```

#### C. AI 챗봇 고도화
```typescript
// GPT-4 연동 검토
- 더 자연스러운 대화
- 감정 인지 및 공감
- 다국어 지원
- 음성 대화 (Web Speech API)
```

#### D. AR/VR 시설 투어 (장기)
```typescript
// 가상 투어
- 360도 파노라마 뷰
- VR 헤드셋 지원
- 실시간 가이드
```

**예상 소요시간:**  
- PWA: 24-32시간  
- 위치 기반: 16-24시간  
- AI 고도화: 40-48시간  
- AR/VR: 80-120시간 (별도 프로젝트)

---

## 🔧 기술 인프라 개선

### 🆕 React Query 도입

**목적:** 서버 상태 관리 및 캐싱 최적화

```typescript
// 현재 방식 (개선 필요)
const [facilities, setFacilities] = useState([]);
useEffect(() => {
  fetchFacilities().then(setFacilities);
}, []);

// React Query 방식 (권장)
const { data: facilities, isLoading, error } = useQuery({
  queryKey: ['facilities', filters],
  queryFn: fetchFacilities,
  staleTime: 5 * 60 * 1000,     // 5분
  cacheTime: 30 * 60 * 1000,    // 30분
  retry: 3,
  refetchOnWindowFocus: false,
});
```

**장점:**
- 자동 캐싱 및 재검증
- 로딩/에러 상태 관리
- 낙관적 업데이트
- 병렬 요청 처리

**적용 우선순위:**
1. `useFacilities` → `useQuery`
2. `useUser` → `useQuery`
3. `useFavorites` → `useQuery`

---

### 🆕 모니터링 시스템

#### A. Sentry 연동 (오류 추적)
```typescript
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: 'YOUR_SENTRY_DSN',
  integrations: [new Sentry.BrowserTracing()],
  tracesSampleRate: 1.0,
});
```

**모니터링 항목:**
- 런타임 오류
- 성능 병목
- 사용자 세션
- API 호출 실패

#### B. Google Analytics 4 (행동 분석)
```typescript
// 추적 이벤트
gtag('event', 'search', {
  search_term: '장례식장',
  location: '강남',
});

gtag('event', 'bookmark', {
  facility_id: '123',
  facility_name: 'OO장례식장',
});
```

#### C. Hotjar (히트맵)
- 사용자 클릭 패턴
- 스크롤 깊이
- 세션 녹화 (선택적)

#### D. Supabase 로그 분석
```sql
-- 사용자 행동 로그
CREATE TABLE user_activity_logs (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  action text,                  -- 'search', 'bookmark', 'consult'
  metadata jsonb,
  created_at timestamptz
);
```

---

### 🆕 CI/CD 파이프라인

#### GitHub Actions 워크플로우
```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test
      - name: Run security scan
        run: npm audit
      - name: Run Lighthouse CI
        run: lhci autorun

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        run: vercel --prod
```

**자동화 항목:**
- [ ] 단위 테스트 (Jest)
- [ ] E2E 테스트 (Cypress)
- [ ] 보안 스캔 (CodeQL, npm audit)
- [ ] 성능 예산 체크 (Lighthouse CI)
- [ ] 타입 체크 (TypeScript)
- [ ] 린트 체크 (ESLint)

---

## 💡 차별화 기능 제안

### 🌟 "추모맵 플래너"

**컨셉:** 종합 장례 계획 도구

```typescript
interface MemorialPlanner {
  // 단계별 체크리스트
  checklist: {
    immediate: string[];         // 즉시 해야 할 일
    within24h: string[];         // 24시간 내
    withinWeek: string[];        // 일주일 내
    longTerm: string[];          // 장기적
  };
  
  // 예산 계획기
  budget: {
    total: number;
    categories: {
      funeral: number;
      burial: number;
      legal: number;
      etc: number;
    };
    savings: number;             // 절약 가능 금액
  };
  
  // 서류 안내
  documents: {
    required: Document[];
    optional: Document[];
    completed: string[];
  };
  
  // 일정 관리
  schedule: {
    dDay: number;
    milestones: Milestone[];
    reminders: Reminder[];
  };
  
  // 가족 공유
  familyCollaboration: {
    members: FamilyMember[];
    tasks: Task[];
    notes: SharedNote[];
  };
}
```

**USP (Unique Selling Point):**
- 체계적인 장례 준비 지원
- 가족 간 협업 기능
- AI 기한 알림
- 비용 절약 팁 제공

---

### 🌟 "AI 장례 컨시어지"

**컨셉:** 24/7 프리미엄 상담 서비스

```typescript
interface AIConcierge {
  // 고도화된 대화
  conversation: {
    naturalLanguage: boolean;
    emotionalSupport: boolean;
    multilingual: boolean;
    voiceEnabled: boolean;
  };
  
  // 맞춤형 서비스
  personalization: {
    facilityMatching: number;      // 매칭 정확도
    priceNegotiation: boolean;     // 가격 협상 지원
    scheduling: boolean;           // 일정 조율
    documentAssistance: boolean;   // 서류 대행
  };
  
  // 사후 관리
  aftercare: {
    memorialServices: string[];    // 추모 서비스
    griefCounseling: boolean;      // 상담 연결
    legalSupport: boolean;         // 법률 지원
    administrativeHelp: boolean;   // 행정 지원
  };
}
```

**USP:**
- 감정 지지 및 공감
- 전문가 연결
- 원스톱 서비스
- 지속적인 사후 관리

---

### 🌟 "투명한 리뷰 시스템"

**컨셉:** 신뢰할 수 있는 후기 플랫폼

```typescript
interface TransparentReview {
  // 검증 시스템
  verification: {
    bookingConfirmed: boolean;     // 예약 확인
    visitVerified: boolean;        // 방문 인증
    receiptUploaded: boolean;      // 영수증 첨부
    identityVerified: boolean;     // 신원 확인
  };
  
  // 상세 평가
  rating: {
    overall: number;
    cleanliness: number;
    staffKindness: number;
    priceTransparency: number;
    facilityQuality: number;
    location: number;
  };
  
  // 미디어
  media: {
    photos: string[];
    videos: string[];
    virtualTour?: string;
  };
  
  // 업체 답변
  response: {
    content: string;
    respondedAt: Date;
    isHelpful: boolean;
  };
  
  // 분쟁 조정
  dispute: {
    status: 'none' | 'pending' | 'resolved';
    moderatorNote?: string;
  };
}
```

**USP:**
- 검증된 실제 이용자
- 상세 평가 지표
- 공정한 분쟁 조정
- 업체와의 소통 창구

---

## 📈 우선순위 매트릭스

| 기능 | 사용자 가치 | 구현 난이도 | 비즈니스 가치 | 우선순위 | 예상 시간 |
|------|-------------|-------------|---------------|----------|-----------|
| **보안 강화** | 🔴 높음 | 🟢 쉬움 | 🔴 높음 | **1순위** | 16-24h |
| **타입 안정화** | 🟡 중간 | 🟢 쉬움 | 🔴 높음 | **1순위** | 8-12h |
| **실시간 대시보드** | 🟡 중간 | 🟡 보통 | 🔴 높음 | **2순위** | 48-64h |
| **스마트 검색** | 🔴 높음 | 🟡 보통 | 🟡 중간 | **2순위** | 24-32h |
| **온라인 예약** | 🔴 높음 | 🔴 어려움 | 🔴 높음 | **3순위** | 64-80h |
| **CRM 시스템** | 🟡 중간 | 🔴 어려움 | 🔴 높음 | **3순위** | 40-56h |
| **개인화 추천** | 🔴 높음 | 🔴 어려움 | 🟡 중간 | **3순위** | 40-48h |
| **시설 비교** | 🟡 중간 | 🟡 보통 | 🟡 중간 | **3순위** | 32-40h |
| **추모맵 플래너** | 🔴 높음 | 🟡 보통 | 🟢 낮음 | **4순위** | 40-48h |
| **커뮤니티** | 🟢 낮음 | 🟡 보통 | 🟢 낮음 | **4순위** | 48-56h |
| **PWA** | 🟡 중간 | 🟡 보통 | 🟡 중간 | **4순위** | 24-32h |
| **AI 컨시어지** | 🔴 높음 | 🔴 어려움 | 🟡 중간 | **5순위** | 80-120h |

---

## 🗓️ 권장 실행 타임라인

### **즉시 시작 (Week 1-2)**
```
□ 보안 패치 (XSS, API Key)
□ 타입스크립트 오류 수정
□ MVP 마무리 (MyPage V2, Sangjo Dashboard)
```

### **단기 (Month 1)**
```
□ 실시간 대시보드 개발
□ 스마트 검색 구현
□ 모니터링 시스템 연동 (Sentry, GA4)
□ React Query 도입 시작
```

### **중기 (Month 2-3)**
```
□ 온라인 예약/결제 시스템
□ CRM 고객 관리
□ 개인화 추천 엔진
□ CI/CD 파이프라인 구축
```

### **장기 (Month 4-6)**
```
□ 추모맵 플래너
□ 커뮤니티 플랫폼
□ PWA 구현
□ AI 컨시어지 고도화
```

---

## 💰 예상 비용 (개발자 기준)

### **인력 비용 (월간)**
| 역할 | 인원 | 단가 | 월 비용 |
|------|------|------|---------|
| 풀스택 개발자 | 2명 | 500만원 | 1,000만원 |
| 프론트엔드 개발자 | 1명 | 400만원 | 400만원 |
| UI/UX 디자이너 | 0.5명 | 350만원 | 175만원 |
| 데이터 분석가 | 0.5명 | 450만원 | 225만원 |
| **합계** | **4명** | - | **1,800만원/월** |

### **총 프로젝트 비용 (3개월 기준)**
- **인력 비용:** 5,400만원
- **인프라 비용:** 100만원/월 × 3 = 300만원
- **외부 서비스:** 200만원
- **총계:** 약 **6,000만원**

### **필요 인프라**
```
- Supabase (Pro Plan): $25/월
- Vercel (Pro Plan): $20/월
- Sentry: $26/월
- Google Cloud (Maps API): $100-200/월
- OpenAI API (GPT-4): $100-500/월
- 합계: 월 $300-800 (약 40-110만원)
```

---

## ✅ 체크리스트

### **Pre-Launch (출시 전)**
- [ ] 보안 감사 완료
- [ ] 성능 테스트 (Lighthouse 90점+)
- [ ] 모바일 반응형 테스트
- [ ] 오류 모니터링 설정
- [ ] 백업 시스템 구축
- [ ] 문서화 완료

### **Post-Launch (출시 후)**
- [ ] 사용자 피드백 수집
- [ ] 버그 트래킹
- [ ] 성능 모니터링
- [ ] 정기적인 보안 업데이트
- [ ] 기능 개선 로드맵 수립

---

## 📞 문의 및 지원

**기술 문의:** 개발팀 리드  
**기획 문의:** 프로덕트 매니저  
**긴급 이슈:** 24/7 모니터링 시스템

---

**문서 버전:** 1.0  
**마지막 업데이트:** 2026년 2월 7일  
**다음 검토일:** 2026년 3월 7일

---

*이 문서는 추모맵 서비스의 지속적인 개선과 발전을 위한 기술 로드맵입니다.*
