# UXUI 개선 작업 계획서

> **작성일**: 2026-03-04
> **기반 문서**: uxuiplan.md (원 보고서) + uxuiplan1.md (7개 에이전트 팩트체크)
> **목적**: 코드 검증된 이슈만 추출 → 출시 컨텍스트 기준 실행 순서 확정

---

## [1] 검증 요약 — 진짜 문제 vs 폐기 항목

### 코드 100% 확인된 실제 문제

| 구분 | 항목 | 심각도 |
|------|------|--------|
| ✅ 접근성 | aria-label 3건/100+파일, role="dialog" 0건, focus trap 0건 | CRITICAL |
| ✅ 터치타겟 | FilterBar 28px, TopBar 32px, SangjoCard 29-32px | HIGH |
| ✅ 에러처리 | .catch(() => []) 자동완성 3곳, 빈 결과 CTA 없음 | MEDIUM |
| ✅ 색상대비 | SideMenu text-gray-300 대비율 2.5:1 (기준 4.5:1 WCAG AA 미달) | MEDIUM |
| ✅ 파일크기 | ReservationModal 605줄, MyPageView 15 useState + 8섹션 | HIGH |
| ✅ z-index | z-[2147483646] 3곳, z-[9999] 8곳, 상수 실적용 0/52 | LOW |
| ✅ 결제에러 | setPaymentError() 인라인 존재 → Toast 미적용 (없는 게 아님) | MEDIUM |

### 폐기된 주장 (원 보고서 오류)

| 원 주장 | 검증 결과 | 조치 |
|---------|---------|------|
| 전환율 2x-3x 향상 | 현실 1.2x-1.7x (분석 도구 0건, 가정 기반) | 폐기 |
| 접근성 "법적 리스크" | 한국 민간앱 권고수준, 법적 의무 아님 | 표현 수정 |
| 결제 에러 메시지 없음 | setPaymentError() 인라인 존재, Toast만 미적용 | 수정됨 |
| 마이페이지 6섹션 | 실제 8섹션 + 15 useState | 수정됨 |
| 슈퍼관리자 11메뉴 | 실제 10메뉴 (운영 8 + 시스템 2) | 수정됨 |
| 1단계 +30-50% 효과 | 현실 +8-25% (업계 평균 반영) | 기대치 하향 |

### 수정된 종합 점수

| 평가 축 | 원 점수 | 수정 점수 | 사유 |
|---------|---------|---------|------|
| 정보 위계 명확성 | 15.0 | **14.5** | MyPageView 8섹션 반영 |
| 가독성 | 15.5 | **14.5** | SideMenu WCAG AA 미달 반영 |
| 인지부하 수준 | 12.9 | **12.0** | 15 useState + 10메뉴 정정 |
| 마이크로카피 설득력 | 13.2 | **14.0** | 결제 에러 존재 사실 반영 |
| 전환 최적화 구조 | 13.4 | **13.5** | 소폭 조정 |
| **총점** | **70.0** | **68.5** | **B등급 유지 (C등급 경계)** |

---

## [2] 실행 Block 계획

### 🔴 Block 0: 출시 완료 (최우선 — 현재 미완)

> **이 단계 완료 전 UX 수정 시작 금지**

| # | 작업 | 방법 |
|---|------|------|
| 0-1 | Edge Function `approve-partner` 재배포 | Supabase Dashboard → Edge Functions |
| 0-2 | 최종 빌드 확인 | `npm run build` 성공 확인 |
| 0-3 | Vercel 배포 | `git push` → Vercel 자동 배포 |
| 0-4 | 모바일 실기기 최소 확인 | 주요 화면 5분 점검 |

---

### 🟠 Block 1: 즉시 수정 (출시 후 D+1~2, 약 1.5시간)

> 코드 검증된 이슈만. 빌드 리스크 최소. 1파일씩 수정 후 빌드 확인.

| # | 파일 | 변경 내용 | 예상 시간 |
|---|------|---------|---------|
| 1-1 | `FilterBar.tsx` | `min-h-[28px]` → `min-h-[44px]` (터치타겟) | 10분 |
| 1-2 | `TopBar.tsx` | 아이콘 버튼 `min-w-[44px] min-h-[44px]` 투명 히트영역 추가 | 20분 |
| 1-3 | `SangjoCompanyCard.tsx` | 좋아요(p-2→p-3), 비교(p-1.5→p-3) 터치타겟 확대 | 10분 |
| 1-4 | `SideMenu.tsx` | 푸터 `text-gray-300` → `text-gray-500` (WCAG AA 4.5:1 충족) | 5분 |
| 1-5 | `FacilityList.tsx` | 빈 결과: 아이콘 + "조건 변경하기" 버튼 추가 | 30분 |
| 1-6 | `ReservationModal.tsx` | `setPaymentError` 인라인 → Toast 전환 + "다시 결제" 버튼 | 20분 |

**검증 방법**: 각 파일 수정 후 `npm run build` → 에러 0건 확인

---

### 🟡 Block 2: 파일 분리 (D+3~5, CLAUDE.md 12조 위반 해소)

> 300줄 초과 = CLAUDE.md 직접 위반. 출시 후 첫 리팩터링 대상.
> **작업 원칙**: 1파일 완성 → 빌드 성공 → 다음 파일 (동시 3개 이상 금지)

#### ReservationModal.tsx (605줄 → 분리)

```
ReservationModal/
  index.tsx           ← 상태 조율 (150줄 이하)
  useReservation.ts   ← 예약 상태 훅 (useState 통합)
  StepDate.tsx        ← Step 0 날짜 선택
  StepTime.tsx        ← Step 1 시간 선택
  StepInfo.tsx        ← Step 2 정보 입력
  StepPayment.tsx     ← Step 3 결제
  StepComplete.tsx    ← Step 4 완료
```

#### MyPageView.tsx (15 useState → 훅 분리)

```
MyPageView/
  index.tsx               ← 레이아웃 (150줄 이하)
  useMyPage.ts            ← 15개 useState 통합 훅
  ProfileSection.tsx      ← 프로필 섹션
  SubscriptionSection.tsx ← 구독 카드
  ReservationTabs.tsx     ← 예약 5탭
  FavoriteTabs.tsx        ← 즐겨찾기 2탭
```

#### 나머지 300줄 초과 파일

| 파일 | 분리 전략 |
|------|---------|
| `FacilitySheet/index.tsx` | 탭별 컴포넌트 (InfoTab, ReviewTab, ReservationTab, AITab) |
| `FacilityAdminDashboard.tsx` | 탭 컴포넌트 (Overview, Reservations, Reviews, Settings) |
| `PartnerDashboard.tsx` | 메뉴별 컴포넌트 (Operations, Revenue, Consultation, Settings) |

---

### 🟢 Block 3: A/B 실험 (D+1주~, 실데이터 수집 후)

> **선행 조건**: GA4 또는 Amplitude 설치 → 최소 2주 데이터 수집 → 실험 시작
> 분석 도구 없이 A/B 진행 = "감으로 개발" 수준

#### GA4 설치 (선행 작업)

```typescript
// 퍼널 이벤트 설계 예시
// - facility_detail_open
// - reservation_start
// - reservation_step_{n}
// - reservation_complete
// - consultation_submit
```

#### 실험 목록

| 실험 | 가설 | 현실적 기대 효과 | 최소 요건 |
|------|------|----------------|---------|
| 예약 5단계 → 3단계 | 날짜+시간 합치기 | +10-20% 완료율 | 2주, 500+ 예약 시작 |
| CTA 카피 변경 | "무료 방문 예약 신청" | +2-8% 클릭률 | 2주, 1,000+ 노출 |
| Progress bar 추가 | 진행도 시각화 | +5-12% 완료율 | 2주, 500+ 예약 시작 |
| 결제 에러 Toast | "다시 결제" 버튼 | +5-10% 재시도율 | 2주, 200+ 결제 시도 |
| 상조 AI 진입점 | Floating → 인라인 배너 | +5-15% 상담 시작률 | 2주, 1,000+ 상조 목록 노출 |

---분석 도구 전혀 없음 확인. 처음부터 설치합니다.

  GA4 설치 계획
                                                                                                                          Phase A: 기반 구축
    lib/analytics.ts     ← 퍼널 이벤트 함수 + gtag 래퍼                                                                     index.html           ← GA4 스크립트 태그 삽입

  Phase B: 이벤트 연결 (4곳)
    FacilitySheet        ← facility_detail_open
    ReservationModal     ← reservation_start / step_n / complete
    ConsultationModal    ← consultation_submit
    AI 채팅              ← ai_chat_open

  ⚠️ 사전 준비: Google Analytics 계정에서 GA4 속성 생성 → 측정 ID (G-XXXXXXXXXX) 발급 필요
  발급 후 .env.local에 VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX 추가

  GA4 Measurement ID 있으신가요? 있으시면 바로 진행하고, 없으시면 ID 없이도 동작하는 방식으로 코드 작성 후 나중에 ID만
────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
● User answered Claude's questions:
  ⎿  · GA4 Measurement ID (G-XXXXXXXXXX) 가 있으신가요? → 없음 — 나중에 입력할게요

### ⚪ Block 4: 접근성 체계 (D+2주~, 구조 개선)

> 한국 민간앱 법적 의무 아님. 출시 안정화 후 진행.

| # | 항목 | 파일 범위 | 작업 내용 |
|---|------|---------|---------|
| 4-1 | role="dialog" 추가 | 17개 Modal/Sheet | 최상위 div에 `role="dialog" aria-modal="true"` |
| 4-2 | focus trap 라이브러리 | 전체 모달 | `npm install react-focus-lock` + 적용 |
| 4-3 | BottomNav ARIA | `BottomNav.tsx` | `role="tablist"`, `role="tab"`, `aria-current` |
| 4-4 | 아이콘 버튼 aria-label | 100+ 컴포넌트 | 아이콘 전용 버튼 전수 `aria-label` 추가 |
| 4-5 | 키보드 내비게이션 | FilterBar, SideMenu | `onKeyDown` 핸들러 (Enter, Space, Escape) |
| 4-6 | z-index 상수 실적용 | 52곳 | `Z_INDEX` 상수 교체, 극단값(2147483646) 제거 |

---

## [3] 마이크로카피 변경 목록 (텍스트만 변경, 빌드 리스크 0)

| # | 파일 | Before | After |
|---|------|--------|-------|
| 1 | `FacilitySheet.tsx` | "방문 예약하기" | "무료 방문 예약 신청" |
| 2 | `FacilitySheet.tsx` | "AI 상담" | "AI에게 먼저 물어보기" |
| 3 | `ReservationModal.tsx` Step 3 | "다음 단계" | "결제 정보 확인하기" |
| 4 | `FacilityList.tsx` | "검색 결과가 없습니다." | "조건에 맞는 시설을 찾지 못했어요. 다른 지역이나 카테고리를 선택해 보세요." |
| 5 | AI 추천 빈 결과 | "추천 가능한 시설이 없습니다." | "현재 조건에 맞는 시설이 부족해요. 조건을 변경하거나, 전문 상담사에게 직접 문의해 보세요." |
| 6 | `SangjoCompanySheet` | "가입/계약 신청" | "맞춤 견적 무료 상담 받기" |
| 7 | 상조 비교 AI 안내 | "버튼을 눌러 원하는 조건을 선택하세요" | "어떤 점이 가장 중요하세요? 눌러서 알려주세요" |
| 8 | 긴급 상담 접수 완료 | "해당 시설 업체 대시보드에 접수 되었습니다" | "접수 완료! 담당자가 확인 후 연락드릴게요." |
| 9 | 로그인 유도 | "로그인이 필요합니다" | "로그인하면 맞춤 추천과 예약 내역을 확인할 수 있어요" |
| 10 | 검색 플레이스홀더 | "검색어를 입력하세요" | "지역명을 입력하세요 (예: 강남, 분당)" |

---

## [4] 실행하지 말아야 할 것 (자원 낭비)

| 항목 | 이유 |
|------|------|
| 분석 도구 없이 A/B 테스트 | 측정 불가 → 주관적 판단과 동일 |
| SUS 설문 / NASA-TLX | 실사용자 없음 → 출시 후 가능 |
| z-index 52곳 전체 교체 | 기능 버그 아님, 즉시 가치 없음 |
| 전환율 2x-3x 목표 설정 | 현실 1.2x-1.7x, 목표 과대 설정 위험 |
| 접근성 즉시 전면 적용 | 1-2주 소요, 출시 전 불가 |
| 퍼널 5→3단계 리디자인 | A/B 없이 적용 시 더 나빠질 수 있음 |

---

## [5] 전환율 현실적 기대치

> **전제**: 앱에 분석 도구 일절 없음. 아래는 업계 벤치마크 기반 가정.

| 시나리오 | 현재 (가정) | Block 1 후 | 전체 완료 후 |
|---------|----------|----------|-----------|
| 낙관적 | 1-3% | +25% → 1.3-3.8% | 1.6-4.9% (1.6x) |
| 보통 | 1-3% | +15% → 1.2-3.5% | 1.4-4.1% (1.4x) |
| 보수적 | 1-3% | +8% → 1.1-3.2% | 1.2-3.5% (1.2x) |

**월 10,000명 방문 시 Block 1만 적용해도 +16~50건 추가 전환 (보수적~낙관적)**

---

## [6] 파일 수정 체크리스트 (Block 1~2 작업 시 매 파일 적용)

```
□ 수정 전 Read 완료
□ 수정 후 300줄 이하
□ import 대상 현재 export 확인
□ getAuthClient 규칙 준수 (anon 직접 import 금지)
□ 빌드 성공 (npm run build)
□ 콘솔 에러 0건
```

---

*문서 작성: 2026-03-04 | 기반: uxuiplan.md + uxuiplan1.md 교차 검증*
*코드 검증: 7개 병렬 에이전트 × 194+ tool calls*

---

## [7] 작업 완료 이력

### ✅ Block 1 — 즉시 수정 (2026-03-04 완료, commit: a9eff44)

| # | 항목 | 결과 |
|---|------|------|
| 1-1 | FilterBar `min-h-[28px]` 터치타겟 | ✅ 완료 |
| 1-2 | TopBar 아이콘 버튼 `min-w/h-[44px]` | ✅ 완료 |
| 1-3 | SangjoCompanyCard 터치타겟 확대 | ✅ 완료 |
| 1-4 | SideMenu `text-gray-300` → `text-gray-500` | ✅ 완료 |
| 1-5 | FacilityList 빈 결과 CTA 추가 | ✅ 완료 |
| 1-6 | ReservationModal 결제 에러 Toast 전환 | ✅ 완료 |

### ✅ Block 2 — 파일 분리 (2026-03-04 완료, commit: bacb3cb)

| 파일 | 분리 결과 |
|------|---------|
| `ReservationModal.tsx` (605줄) | `ReservationModal/` 디렉토리 (7파일) |
| `MyPageView.tsx` (15 useState) | `MyPageView/` 디렉토리 (6파일) |
| `FacilitySheet/index.tsx` | `InfoTab`, `PhotosTab`, `ReviewTab`, `PriceTab` 분리 |
| `FacilityAdminDashboard.tsx` (524줄) | `useFacilityAdmin.ts` 훅 분리 → 248줄 |
| `PartnerDashboard.tsx` (393줄) | `usePartnerDashboard.ts` 훅 분리 → 203줄 |

### ✅ Block 3 — GA4 설치 (2026-03-05 완료, commit: 23bb039)

| 항목 | 결과 |
|------|------|
| `lib/analytics.ts` 생성 | gtag 래퍼 + 5개 퍼널 이벤트 함수 |
| `index.html` dataLayer 초기화 | ✅ 완료 |
| `FacilitySheet` 이벤트 연결 | `facility_detail_open`, `ai_chat_open`, `reservation_start` |
| `ReservationModal` 이벤트 연결 | `reservation_step_n`, `reservation_complete` |

> **GA4 활성화**: `.env.local`에 `VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX` 추가 후 재시작

### 🔄 추가 수정 (2026-03-05)

| 항목 | 내용 | commit |
|------|------|--------|
| FilterBar·TopBar 배포 버전 크기 복원 | `min-h-[28px]`, `p-2.5` 복원, 할인권 닫기 `p-1` 복원 | 5afb342 |
| 상조 시설 DB 정리 | 불국토·전국서비스·용인라이프 등 7건 facilities 삭제 | bf8d492 |
| 임시/백업 파일 삭제 | `lib/queries` 관련 temp/bak 4건 | 0ee98a3 |

### 📋 남은 작업

| Block | 항목 | 상태 |
|-------|------|------|
| Block 3 | consultation_submit 이벤트 연결 (ConsultationModal) | ✅ 완료 (commit: 692ed97) |
| Block 3 | GA4 Measurement ID 발급 및 적용 | ✅ 발급완료 (.env.local 저장) |
| Block 3 | 2주 데이터 수집 후 A/B 실험 목록 실행 | 대기 (수집 시작됨) |
| Block 4 | 접근성 체계 (role="dialog", focus trap 등) | 미착수 |

### 🔴 무결성 검증 발견 이슈 (2026-03-05)

> 상세 내용: `verification_report_20260305.md` 참조

| 우선순위 | 이슈 | 파일 |
|---------|------|------|
| P0 즉시 | `window.location.reload()` 2곳 잔존 | `ErrorBoundary.tsx:115`, `index.tsx:54` |
| P0 즉시 | `useFacilityAdmin` 중복 정의 | `components/dashboard/`, `hooks/` |
| P0 즉시 | `@ts-ignore` 타입 우회 | `lib/queries.ts:1591` |
| P1 이번주 | console.warn/error 프로덕션 잔존 4건 | `FacilityFAQManager`, `PartnerInquiryView`, `MapContainer` |
| P1 이번주 | partnerId ↔ facilityId 네이밍 혼용 | `PartnerDashboard`, `OperationsManagement`, `LiveConsultation` |
| P1 이번주 | ComparisonModal 삭제 confirm 없음 | `ComparisonModal.tsx:46` |
| P2 출시후 | 파일크기 300줄 초과 24개 (lib/queries.ts 2046줄 최우선) | 다수 |
| P2 출시후 | 상조 플랜 가격 하드코딩 | `SubscriptionPlans.tsx:118,133,150` |
