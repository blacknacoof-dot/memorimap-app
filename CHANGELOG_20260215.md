# 작업 일지 2026-02-15

## 완료된 작업 (Task #2 ~ #8)

---

### Task #2: 상조 관리자 대시보드 예약/상담 표시
**파일**: `components/Partner/PartnerDashboard.tsx`

- 상담(consultations) 탭 추가 → ConsultationList 컴포넌트 연동
- 예약(reservations) 탭 추가 → 인라인 예약 카드 + 승인/거절 버튼
- facility_id 조회 로직: partners → sangjo_hq_admins fallback
- Supabase Realtime 구독 (상담/예약 실시간 업데이트)
- 기본 탭 `chat` → `consultations`로 변경

---

### Task #3: 상조 대시보드 구독/매출
**파일**: `components/Partner/PartnerDashboard.tsx`

- 구독/매출 탭 추가 (Wallet 아이콘)
- KPI 카드: 현재 플랜, 상담 수, 예약 수
- 월별 매출 추이 차트 (최근 6개월)
- 결제 내역 테이블
- 데이터: getFacilitySubscription + subscription_payments 쿼리

---

### Task #4: 슈퍼관리자 파트너 승인 E2E
**파일**: `components/SuperAdmin/SuperAdminDashboard.tsx`, `lib/sangjoQueries.ts`
**SQL**: `supabase/migrations/20260215_fix_approve_partner_e2e.sql`

- PartnerAdmissions 컴포넌트를 admissions 탭에 연결 (기존에 미사용)
- approve_partner_transaction RPC 수정:
  - partners 테이블 INSERT 추가 (PartnerDashboard에서 사용)
  - sangjo_dashboard_users INSERT 추가 (getSangjoUser에서 사용)
- getSangjoUser fallback: sangjo_dashboard_users → sangjo_hq_admins
- PartnerDashboard에 파트너명 조회 fallback 추가

---

### Task #5: 슈퍼관리자 대시보드 전체
**파일**: `components/SuperAdmin/SuperAdminDashboard.tsx`, `components/ContentRouter.tsx`

- 구독 현황(subs) 탭 → 사이드 메뉴에 추가 (기존에 접근 불가)
- ContentRouter 이중 헤더 제거 (wrapper 헤더 삭제)
- "나가기" 버튼 onClick 연결 (onBack prop)
- SubscriptionStatus 데드코드 확인 (미사용)

---

### Task #6: 요금제 체계 검증
**파일**: `types/db.ts`, `types/index.ts`, `components/admin/AdminSubscriptions.tsx`, `components/SubscriptionPlans.tsx`, `lib/queries.ts`

- 타입 수정:
  - SubscriptionPlan: `starter|pro|enterprise` → `free|basic|premium|enterprise`
  - Subscription.plan_name: `Free` 추가
  - Partner.subscription_plan: `pro` → `premium`, `free` 추가
- AdminSubscriptions 매출 계산: 하드코딩 99,000 → 실제 price 합산
- AdminSubscriptions 상태 표시: 전부 "Active" → 실제 status 반영
- SubscriptionPlans 결제 후 DB 반영: `updateFacilitySubscription()` 호출 추가
- getAllSubscriptions 반환에 status 필드 추가

---

### Task #7: 일반 사용자 E2E
**파일**: `components/Consultation/ConsultationView.tsx`, `services/favoriteService.ts`, `components/EndingNoteCard.tsx`

- **[Critical]** createConsultation 파라미터 순서 수정:
  - Before: user.id→facilityId, facility.id→userId, topic→userName, facility.name→userPhone
  - After: facility.id→facilityId, user.id→userId, user.fullName→userName, user.phone→userPhone
- favoriteService: 미인증 supabase → Clerk JWT 기반 인증 클라이언트로 교체 (401 해결)
- EndingNoteCard: `supabase.auth.getUser()` → Clerk `useUser()` + 인증 클라이언트로 교체

---

### Task #8: 모바일 UI 점검
**파일**: `components/ModalContainer.tsx`, `components/BottomNav.tsx`, `components/FilterBar.tsx`, `components/FacilitySheet.tsx`, `components/SideMenu.tsx`, `index.css`

- SuspenseSpinner z-index: `z-50` → `z-[999]`
- BottomNav/FacilitySheet footer: `pb-safe` CSS 클래스 적용 (iOS safe area)
- FilterBar 버튼: `px-3 py-1.5 text-[11px]` → `px-4 py-2 text-xs min-h-[36px]`
- SideMenu 버튼 4개: `text-xs px-3 py-1.5` → `text-sm px-4 py-2`
- index.css: `.pb-safe` 유틸리티 클래스 추가

---

### 추가: QA 검증 준비
**파일**: `components/SideMenu.tsx`

- super_admin 역할에 시설 관리자/상조 대시보드 버튼 표시 추가
- SQL 한 방 세팅 스크립트 생성 (`20260215_qa_super_test_account.sql`)
- QA 검증 시나리오 문서 생성 (`QA_VERIFICATION_PLAN.md`, 55개 시나리오)

---

## 적용 필요한 DB 마이그레이션

| 파일 | 용도 | 상태 |
|------|------|------|
| `20260215_fix_approve_partner_e2e.sql` | 파트너 승인 RPC 수정 | Supabase SQL Editor에서 실행 필요 |
| `20260215_qa_super_test_account.sql` | QA 테스트 계정 세팅 | 테스트 시 실행 |

## 빌드 상태
- `npx tsc --noEmit` : 에러 없음
- `npm run build` : 성공 (16.97s)

---

## 남은 작업

| # | 내용 | 상태 |
|---|------|------|
| 1 | 상조 AI 상담 → 예약 E2E 테스트 | 코드 완료, 사용자 테스트 대기 |
| 9 | 빌드+배포 최종 | 빌드 성공, 배포 대기 |
| 10 | 시설별 대시보드 (장례/동물/추모/수목/공원) | pending |
| 11 | 마이페이지 검증 | pending |
