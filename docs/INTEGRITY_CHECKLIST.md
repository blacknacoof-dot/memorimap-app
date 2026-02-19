# Memorimap 완전 무결성 검증 체크리스트

> 검증일: 2026-02-19 | 검증 범위: 793개 소스파일 전체 | 10개 섹션 병렬 정밀 감사

---

## 검증 요약

| 등급 | 건수 | 설명 |
|------|------|------|
| **CRITICAL** | 4건 | 즉시 수정 필수 (보안 사고/서비스 장애) |
| **HIGH** | 18건 | 출시 전 반드시 수정 |
| **MEDIUM** | 25건+ | 가능하면 수정 권장 |
| **LOW** | 60건+ | 코드 품질 개선 |

---

## 1. CRITICAL (즉시 수정)

### C-1. API 키 Git 커밋 노출 (보안 사고)
- **파일**: `.env.local.temp` (git에 커밋됨)
- **내용**: Supabase **SERVICE_ROLE_KEY**, Google GenAI, Clerk, Kakao, Naver 키 전부 노출
- **조치**: 모든 키 **즉시 로테이션** 필요. git history에 영구 잔류.
- **방법**: `git filter-branch` 또는 `BFG Repo-Cleaner`로 히스토리 정리

### C-2. VITE_SUPABASE_SERVICE_ROLE_KEY 브라우저 노출
- **파일**: `.env.local` line 7
- **내용**: `VITE_` 접두사로 인해 Vite가 프론트엔드 번들에 포함시킴
- **조치**: `VITE_` 접두사 제거 → `SUPABASE_SERVICE_ROLE_KEY`로 변경
- **위험**: RLS 전체 우회 가능한 master key가 브라우저 DevTools에서 보임

### C-3. React Hooks 규칙 위반 (2곳 - 런타임 크래시)
| 파일 | 라인 | 문제 |
|------|------|------|
| `ChatInterface.tsx` | 71 | 조건부 return 후 hooks 호출 |
| `SangjoConsultationModal.tsx` | 119-149 | 2개의 early return 후 useState/useEffect 호출 |
- **증상**: 컴포넌트 모드 전환 시 React 크래시
- **조치**: hooks를 모든 early return **위로** 이동

### C-4. deploy-bot-data Edge Function 인증 없음
- **파일**: `supabase/functions/deploy-bot-data/index.ts`
- **내용**: CORS `*` + 인증 체크 없음 → 누구나 봇 데이터 수정 가능
- **조치**: JWT 검증 + CORS 제한 추가

---

## 2. HIGH (출시 전 필수 수정)

### H-1. 검색/필터링 완전 고장 (3건)

| # | 파일 | 라인 | 문제 |
|---|------|------|------|
| 1 | `useFacilities.ts` | 104 | `.eq('category', ...)` → DB에 `category` 컬럼 없음. **`.eq('type', ...)`으로 수정** |
| 2 | `MapView.tsx` + `CategoryFilter.tsx` | 59, 9 | CategoryFilter가 한글 라벨(`장례식장`) 전달 → useFacilities는 영문 코드(`funeral_home`) → 비교 항상 false. **지도 카테고리 필터 완전 고장** |
| 3 | `useFacilities.ts` | 331 | `useFacilityStats` `.select('category')` → DB에 없는 컬럼. **`type`으로 수정** |

### H-2. 권한 상승 취약점 (3건)

| # | 파일 | 라인 | 문제 |
|---|------|------|------|
| 1 | `superAdmin.ts` | 69 | `updateUserRole`에 서버 측 권한 검증 없음. RLS 미설정 시 누구나 super_admin 가능 |
| 2 | `ContentRouter.tsx` | 110-123 | `ViewState.ADMIN` 렌더링 시 역할 검증 0건 |
| 3 | `UserManagement.tsx` | 102-116 | 드롭다운으로 아무 사용자를 super_admin으로 변경 가능 |

### H-3. 레거시 테이블 참조 (런타임 에러)

| 파일 | 라인 | 문제 |
|------|------|------|
| `lib/admin.ts` | 24 | `memorial_spaces` 테이블 → 존재하지 않음 |
| `lib/api/facilityAdmin.ts` | 7, 62 | `memorial_spaces` + 레거시 컬럼명 |
| **조치** | | `facilities` 테이블로 변경, 컬럼명 업데이트 |

### H-4. Tailwind content 경로 누락 → 프로덕션 스타일 깨짐
- **파일**: `tailwind.config.js` line 3-8
- **누락**: `./pages/**/*.tsx`, `./src/**/*.tsx`, `./hooks/**/*.tsx`, `./stores/**/*.ts`
- **결과**: ShareJourneyView, ExternalBrowserGuidePage 등의 Tailwind 클래스가 프로덕션에서 제거됨
- **조치**: content 배열에 누락 경로 추가

### H-5. 검색 입력 미살균 (ilike injection)
- `queries.ts` line 1177: `searchKnownFacilities()` 사용자 입력 직접 `.ilike()` 전달
- `admin.ts` line 79: `searchUsers()` `.or()` 필터 문자열에 입력 직접 삽입
- `superAdmin.ts` line 110: `searchFacilities()` 미살균 `.ilike()`

### H-6. Gemini API 키 클라이언트 노출
- **파일**: `SangjoConsultationModal.tsx` line 286
- **내용**: `VITE_GOOGLE_GENAI_API_KEY`가 브라우저 번들에 포함
- **조치**: 백엔드 프록시 구현 또는 서버리스 함수 경유

### H-7. approve-partner JWT 서명 미검증
- **파일**: `supabase/functions/approve-partner/index.ts` line 102-108
- **내용**: JWT를 `atob()`로 디코딩만 하고 서명 검증 안 함
- **조치**: `supabase.auth.getUser(token)` 또는 JWT 라이브러리 사용

### H-8. package.json 네이티브 모듈 오분류
- `canvas`, `pg`, `playwright`, `sharp` → `dependencies`에 있음 (브라우저 불가)
- **조치**: `devDependencies`로 이동 또는 삭제

### H-9. 토스트 중복 렌더링
- **파일**: `App.tsx` line 272-288 + 322-328
- **내용**: absolute + fixed 토스트 2개 동시 표시
- **조치**: 하나 제거

### H-10. FuneralCompanyView 리뷰 userId 마스킹 버그
- **파일**: `FuneralCompanyView.tsx` line 197-198
- **내용**: `userId: 'masked'` → 본인 리뷰 삭제 불가 (`isOwner` 항상 false)
- **조치**: userId 마스킹 제거 또는 별도 isOwner 로직

---

## 3. MEDIUM (수정 권장)

### 검색/시설 관련
| # | 파일 | 문제 |
|---|------|------|
| M-1 | `FacilityList.tsx` line 22-29 | REGION_ALIASES 불완전 (대구, 울산, 세종, 제주 누락) |
| M-2 | `queries.ts` line 149 | `searchFacilitiesV2`에서 `mapCategoryToCode()` 미호출 |
| M-3 | `queries.ts` line 407-409 | `getDistinctRegions` 주소 정규화 3개 도시만 처리 |
| M-4 | `FacilitySheet.tsx` line 227 | 카테고리 배지에 영문 코드 표시 (`funeral_home`) |
| M-5 | `FacilityItem.tsx` line 40 | 동일 영문 코드 표시 문제 |
| M-6 | `FacilitySheet.tsx` line 495 | `type === 'funeral'` → `'funeral_home'` |

### AI/상담 관련
| # | 파일 | 문제 |
|---|------|------|
| M-7 | SafeHighlight (4개 파일) | `new RegExp(highlight)` → ReDoS 위험. `escapeRegExp()` 필요 |
| M-8 | `BrandChatHelpers.tsx` line 674 | onClick + form onSubmit → 이중 제출 버그 |
| M-9 | `PetChatInterface.tsx` line 501 | DOMPurify가 마크다운 테이블 형식 제거 |
| M-10 | `SangjoConsultationModal.tsx` line 501 | 한글 IME `isComposing` 체크 누락 → 조기 전송 |
| M-11 | `PetChatInterface.tsx` line 48-57 | ReservationForm이 fake setTimeout 모의 (DB 저장 안 됨) |
| M-12 | `ScenarioBot.tsx` line 184-272 | `appendMessage` API 호출 4건 try/catch 없음 |

### 보안/인증 관련
| # | 파일 | 문제 |
|---|------|------|
| M-13 | `approve-partner` line 111 | 하드코딩 폴백 이메일 `blacknacoof@gmail.com` |
| M-14 | `auth.tsx` line 29 | Clerk test-mode 키 하드코딩 폴백 |
| M-15 | `useUserRole.ts` line 40-42 | 모든 클라이언트 인가가 `profiles.role` 의존 (RLS 필수 확인) |
| M-16 | Admin 컴포넌트 4개 | 내부 auth guard 없음 (부모 의존) |

### 대시보드/파트너 관련
| # | 파일 | 문제 |
|---|------|------|
| M-17 | `RevenueManagement.tsx` | 정산 탭 전체 하드코딩 목업 데이터 |
| M-18 | `NoticeManagement.tsx` | 검색/필터/수정/삭제 버튼 전부 미구현 (dead button) |
| M-19 | `FacilityDashboard.tsx` | 전체 파일 deprecated dead code |
| M-20 | `src/pages/admin/facility/faq.tsx` | 레거시 FAQ (upsert 로직 고장) |

### UI/모바일 관련
| # | 파일 | 문제 |
|---|------|------|
| M-21 | `FilterBar.tsx` line 41 | `min-h-[32px]` → 44px에서 regression |
| M-22 | `InquiryModal.tsx` line 241 | `py-4.5` 무효한 Tailwind 클래스 |
| M-23 | `NotificationCenter.tsx` | z-[9999] 과도, 삭제 버튼 모바일 미노출, 터치 타겟 다수 미달 |
| M-24 | z-index 충돌 | ConfirmModal(z-50), LegalModal(z-50) < SideMenu(z-60) → 모달 가려짐 |
| M-25 | `zustand.d.ts` | zustand v5와 타입 선언 불일치 |

---

## 4. LOW (코드 품질)

### 4-1. console.error/warn 잔류 (100건+)
| 파일 | 건수 |
|------|------|
| `queries.ts` | 67건 (logger import 있으나 미사용) |
| `sangjoQueries.ts` | 7건 |
| `admin.ts` | 8건 |
| AI/Consultation 컴포넌트 | 20건+ |
| Dashboard 컴포넌트 | 15건+ |

### 4-2. Dead Code (삭제 대상)
| 파일 | 이유 |
|------|------|
| `AppProviders.tsx` | 미사용 (import 없음) |
| `AppRoutes.tsx` | 미사용 (import 없음) |
| `MyPageV2.tsx` | @deprecated, `window.location.reload()` 잔류, 편집 버튼 고장 |
| `EndingNoteCard.tsx` | 미사용 orphan |
| `JourneyTimeline.tsx` | 미사용 orphan |
| `useMyJourney.ts` | MyPageV2만 사용 |
| `generateJourneyInsight.ts` | MyPageV2만 사용 |
| `FacilityDashboard.tsx` | @deprecated |

### 4-3. 미사용 변수/import
| 파일 | 변수 |
|------|------|
| `App.tsx` | `fetchFacilityDetails`, `setSearchQuery`, `setReservations`, `sangjoOrgType` |
| `IntegratedJourneyView.tsx` | `setSupabaseAuth`, `formatDistanceToNow`, `ko` |
| `EndingNoteEditModal.tsx` | `Save`, `Check` |
| `MyPageView.tsx` | `useNavigate` |
| `SangjoConsultationModal.tsx` | `ConsultationTopic`, 20+ lucide 아이콘, `ScenarioBot` |
| `LoginModal.tsx` | `onLogin`, `onAdminLogin` props |
| `SignUpModal.tsx` | `onSignUp` prop |

### 4-4. 터치 타겟 44px 미달 (모달 닫기 버튼 일괄)
거의 모든 모달의 X 닫기 버튼이 44px 미달:
- LoginModal, SignUpModal, EditProfileModal, LegalModal, PhoneNumberModal
- ComparisonModal, SangjoComparisonModal, SangjoContractModal
- NotificationCenter, ReservationModal, FacilityEditModal 등
- **일괄 수정**: `min-w-[44px] min-h-[44px] flex items-center justify-center` 추가

### 4-5. iOS vh 이슈
`vh` 단위 사용 모달들 → `dvh`로 변경 권장:
- NotificationCenter `85vh`, ComparisonModal `85vh`, LegalModal `80vh`
- InquiryModal `90vh`, EndingNoteEditModal `75vh`
- SangjoConsultationModal `80vh`

### 4-6. browser confirm()/prompt() 사용 (모바일 UX)
| 파일 | 용도 |
|------|------|
| `FacilityAdminDashboard.tsx` | 예약 승인/거절 |
| `SuperAdminDashboard.tsx` | 사용자 삭제 |
| `PartnerManagement.tsx` | 상태 변경 |
| `UserManagement.tsx` | 권한 변경 |
| `ReservationManager.tsx` | 거절 사유 입력 |
| `FuneralSearchForm.tsx` 등 | 상담 접수 확인 |

### 4-7. 하드코딩 연도
- `BrandChatInterface.tsx` line 229: `REQ-2025-...`
- `SangjoConsultationModal.tsx` line 323: `AMI-2025-...`
- `LegalModal.tsx` line 113: copyright 2024
- **조치**: `new Date().getFullYear()` 사용

### 4-8. package.json 정리
- `@types/node`, `@types/pg` 등 → `devDependencies`로 이동
- `@google/genai` → 미사용 (코드는 `@google/generative-ai` 사용)
- `@types/date-fns` → date-fns v4 자체 타입 포함, 불필요
- `@types/uuid` → uuid 패키지 미설치, orphan
- `dotenv`, `csv-parse`, `iconv-lite`, `xlsx`, `proj4` → devDependencies

---

## 5. 파일별 상태 요약

### PASS (정상)
- `SmartSearchInput.tsx`, `RecommendList.tsx`, `BookingPreStep.tsx`
- `ChatBot.tsx`, `ChatMessage.tsx`, `petPartnerData.ts`
- `JourneyProgressGraph.tsx`, `ShareJourneyView.tsx`
- `SangjoDashboard.tsx`, `AdminApprovals.tsx`, `AdminSubscriptions.tsx`
- `AdminCommunication.tsx`, `SubscriptionStatus.tsx`
- `FacilityInfoEditor.tsx`, `AIConfiguration.tsx`, `LiveConsultation.tsx`
- `ModalContainer.tsx`, `ConfirmModalWrapper.tsx`
- `supabaseClient.ts` (minor), `postcss.config.js`, `tsconfig.json` (minor)

### FAIL (수정 필요)
- `useFacilities.ts`, `MapView.tsx`, `CategoryFilter.tsx` (검색 고장)
- `ChatInterface.tsx`, `SangjoConsultationModal.tsx` (Hooks 위반)
- `admin.ts`, `facilityAdmin.ts` (레거시 테이블)
- `deploy-bot-data/index.ts` (무인증)
- `tailwind.config.js` (content 경로 누락)
- `.env.local.temp` (키 노출)

---

## 6. 수정 우선순위 액션 플랜

### Phase 1: 긴급 (당일)
1. [ ] 모든 API 키 로테이션 (Supabase, Google, Clerk, Kakao, Naver)
2. [ ] `.env.local` → `VITE_SUPABASE_SERVICE_ROLE_KEY` 접두사 제거
3. [ ] `ChatInterface.tsx`, `SangjoConsultationModal.tsx` Hooks 순서 수정
4. [ ] `deploy-bot-data` Edge Function에 JWT 인증 추가

### Phase 2: 출시 전 (1-2일)
5. [ ] `useFacilities.ts` → `.eq('type', ...)` 수정
6. [ ] `CategoryFilter.tsx` → 영문 코드 사용하도록 변경
7. [ ] `admin.ts`, `facilityAdmin.ts` → `facilities` 테이블로 변경
8. [ ] `tailwind.config.js` content 경로 추가
9. [ ] `ContentRouter.tsx` AdminView 역할 검증 추가
10. [ ] `updateUserRole` 서버 측 권한 검증 (RLS 확인)
11. [ ] `approve-partner` JWT 서명 검증 추가
12. [ ] 토스트 중복 렌더링 수정
13. [ ] 검색 입력 sanitize 3곳

### Phase 3: 품질 개선 (출시 후)
14. [ ] Dead code 8개 파일 삭제
15. [ ] console.error 100건+ → logger 유틸 전환
16. [ ] 모달 닫기 버튼 터치 타겟 일괄 44px
17. [ ] iOS `vh` → `dvh` 전환
18. [ ] browser confirm/prompt → 커스텀 모달
19. [ ] z-index 체계 정리
20. [ ] package.json 의존성 정리
21. [ ] 하드코딩 연도 동적 변경
22. [ ] 미사용 import/변수 정리

---

## 7. 매트릭스 시뮬레이션 결과 (2차 검증)

> 5개 시뮬레이션 병렬 실행: RLS 보안, 데이터 흐름, 인증 체인, 빌드, 라우팅/상태 전이

### 7-1. 빌드 검증 결과
- **`npm run build`**: ✅ 성공 (1분 24초, 2341 모듈)
- **`npx tsc --noEmit`**: ✅ 타입 에러 0건
- **경고**: `supabaseClient.ts`, `queries.ts` 동적+정적 import 혼용 (코드 스플리팅 비효율)
- **번들 사이즈 주의**: `index-D_YJAawg.js` **869KB** (메인 번들 과대)

### 7-2. 인증 체인 시뮬레이션 — 권한 상승 공격 결과

| 공격 시나리오 | 결과 | 차단 지점 |
|--------------|------|----------|
| 일반 사용자 → `#/admin` 해시 변경 | **공격 성공** | 차단 없음 (CRITICAL) |
| 일반 사용자 → `#/super-admin` 해시 변경 | 차단됨 | ContentRouter 역할 검증 |
| 일반 사용자 → 자기 `profiles.role`을 `super_admin`으로 UPDATE | **공격 성공** | RLS가 자기 row 수정 허용 + role 컬럼 제한 없음 (CRITICAL) |
| 위조 JWT로 `approve-partner` Edge Function 호출 | **공격 성공** | JWT 서명 미검증 (CRITICAL) |
| 일반 사용자 → `updateUserRole()` 직접 호출 | **RLS 의존** | RLS 정책 상태에 따라 성공 가능 (HIGH) |

#### 신규 CRITICAL 발견

**C-5. profiles.role 자가 상승 취약점**
- 인증된 사용자가 `supabase.from('profiles').update({ role: 'super_admin' }).eq('clerk_id', 'my-id')` 실행 가능
- RLS 정책 `profiles_modify_own`이 자기 row 수정 허용하지만 **컬럼 수준 제한 없음**
- `getUserRole()`이 `profiles.role`을 최우선 참조 → 즉시 super_admin 획득
- **조치**: DB 트리거로 `role` 컬럼 변경 방지 또는 RLS WITH CHECK에 `role = OLD.role` 추가

**C-6. SANGJO_DASHBOARD 역할 검증 없음**
- `ContentRouter.tsx`에서 SANGJO_DASHBOARD ViewState에 역할 검증 없음
- SideMenu에서만 버튼 숨기지만, `setViewState` 직접 호출로 우회 가능

### 7-3. 데이터 흐름 무결성 — 핵심 결과

| 흐름 | 판정 | 핵심 문제 |
|------|------|----------|
| 시설 검색 | **FAIL** | `useFacilities` `.eq('category')` → DB에 없는 컬럼 |
| 예약 | **FAIL** | ReservationModal에서 DB 저장 안 됨. `user_id: 'temp-user'` 하드코딩 |
| 상담 접수 | CONDITIONAL PASS | `createMemorialConsultation` facility_id 타입 불일치 위험 |
| 상조 계약 | CONDITIONAL PASS | 클라이언트 생성 ID `db-${Date.now()}` → UUID 타입 불일치 가능 |
| 파트너 승인 | CONDITIONAL PASS | inquiryId Number 변환 → UUID PK면 NaN |
| 즐겨찾기 | **FAIL** | **3개 별도 시스템** 병존 (favoriteService, sangjoFavoriteService, useFavorites RPC) → 데이터 불일치 |
| 리뷰 | CONDITIONAL PASS | `author_name` vs `userName` 매핑 갭, 삭제 시 소유자 미검증 |
| 엔딩노트 | CONDITIONAL PASS | upsert에 onConflict 미지정 → 중복 row 가능 |
| FAQ 관리 | **PASS** | insert/update 분리 정상 |
| 마이페이지 | **PASS** | 인증 전달 정상 |

#### 신규 HIGH 발견

**H-11. 예약 데이터 DB 미저장**
- `ReservationModal`에서 생성한 예약 데이터가 Supabase에 **실제로 저장되지 않음**
- `user_id: 'temp-user'` 하드코딩, `onConfirm` 콜백만 호출하고 부모가 DB 저장하는 증거 없음
- **조치**: `createUrgentReservation` RPC 직접 호출 연결

**H-12. 즐겨찾기 3중 시스템**
- `favoriteService` → `favorites` 테이블
- `sangjoFavoriteService` → `sangjo_favorites` 테이블
- `useFavorites` hook → `toggle_favorite` RPC
- 사용자 즐겨찾기가 어디에 저장되느냐에 따라 불일치 발생
- **조치**: 하나의 시스템으로 통합 또는 각각의 용도 명확히 분리

### 7-4. 라우팅/상태 전이 매트릭스 — 핵심 결과

#### ViewState 라우트 보안 매트릭스

| 해시 | ViewState | 인증 | 역할 검증 | 상태 |
|------|-----------|------|----------|------|
| `#/admin` | ADMIN | 없음 | 없음 | **CRITICAL** |
| `#/super-admin` | SUPER_ADMIN | 있음 | 있음 | OK |
| `#/facility-admin` | FACILITY_ADMIN | 있음 | 있음 | OK |
| (SideMenu) | SANGJO_DASHBOARD | 없음 | 없음 | **MEDIUM** |
| `#/funeral-company` | FUNERAL_COMPANIES | 없음 | 불필요 | OK |
| `#/share/:token` | Routes | 없음 | 비밀번호 | OK |

#### z-index 충돌 맵

| 충돌 조합 | z-index | 문제 |
|-----------|---------|------|
| SangjoConsultationModal + AI Chat | 둘 다 z-300 | DOM 순서 의존 |
| OperationsManagement modal + BottomNav | 둘 다 z-200 | 모달이 BottomNav 아래로 |
| NotificationCenter + SubscriptionPlans | 둘 다 z-9999 | 동시 오픈 시 충돌 |
| ComparisonModal(z-60) + SideMenu(z-70) | 60 vs 70 | 모달이 SideMenu 뒤로 |

#### 추가 발견

- **ESC 키 핸들러**: 대부분 모달에 없음 (FacilitySheet 라이트박스, NotificationCenter만 있음)
- **Body scroll lock**: 전체 앱에서 **미구현** → 모달 뒤 배경 스크롤 가능
- **브라우저 뒤로가기**: 5개 해시 라우트만 지원, 나머지 ViewState 전환은 히스토리 미기록
- **Dead routing files**: `AppRoutes.tsx`, `router/AppRouter.tsx` 2개 파일 미사용
- **시설 선택 레이스 컨디션**: 빠른 연속 클릭 시 이전 비동기 결과가 현재 선택 덮어쓰기 (`useFacilityData.ts` line 233-240)

### 7-5. RLS 보안 매트릭스 (인증 체인에서 확인된 사항)

#### 위험 테이블

| 테이블 | 위험 | 상세 |
|--------|------|------|
| `profiles` | **CRITICAL** | 자기 row UPDATE 시 `role` 컬럼 변경 제한 없음 → 자가 권한 상승 |
| `facilities` | OK | `robust_facilities_modify` 정책으로 소유자만 수정 |
| `partner_inquiries` | OK | Edge Function이 service_role로 처리 |
| `super_admins` | OK | INSERT RLS 차단됨 |

---

## 8. 최종 수정 우선순위 (통합)

### Phase 1: 긴급 보안 (당일)
1. [ ] 모든 API 키 로테이션
2. [ ] `VITE_SUPABASE_SERVICE_ROLE_KEY` 접두사 제거
3. [ ] `profiles.role` 컬럼 변경 방지 DB 트리거 추가
4. [ ] `ContentRouter.tsx` ADMIN ViewState 역할 검증 추가
5. [ ] `ChatInterface.tsx`, `SangjoConsultationModal.tsx` Hooks 순서 수정
6. [ ] `deploy-bot-data` Edge Function JWT 인증 추가
7. [ ] `approve-partner` JWT 서명 검증 추가

### Phase 2: 기능 수정 (출시 전)
8. [ ] `useFacilities.ts` `.eq('category')` → `.eq('type')` 수정
9. [ ] `CategoryFilter.tsx` 한글→영문 코드 매핑
10. [ ] `admin.ts`, `facilityAdmin.ts` → `facilities` 테이블로 변경
11. [ ] `tailwind.config.js` content 경로 추가
12. [ ] `ReservationModal` DB 저장 연결
13. [ ] 검색 입력 sanitize 3곳
14. [ ] 토스트 중복 렌더링 수정
15. [ ] `FuneralCompanyView` userId 마스킹 버그 수정
16. [ ] SANGJO_DASHBOARD 역할 검증 추가

### Phase 3: 안정화 (출시 후 1주)
17. [ ] 즐겨찾기 시스템 통합/정리
18. [ ] Dead code 10+ 파일 삭제
19. [ ] console.error 100건+ → logger 전환
20. [ ] 모달 닫기 버튼 터치 타겟 일괄 44px
21. [ ] iOS `vh` → `dvh` 전환
22. [ ] z-index 체계 정리 + body scroll lock 추가
23. [ ] ESC 키 핸들러 모달 일괄 추가
24. [ ] browser confirm/prompt → 커스텀 모달
25. [ ] 번들 사이즈 최적화 (869KB 메인 청크 분할)
26. [ ] package.json 의존성 정리
27. [ ] 하드코딩 연도 동적 변경
28. [ ] 미사용 import/변수 정리
29. [ ] 시설 선택 레이스 컨디션 AbortController 추가

---

*1차: 10개 에이전트 정적 코드 감사 (793파일) | 2차: 5개 매트릭스 시뮬레이션 (빌드/인증/데이터흐름/라우팅/RLS)*
*총 검증 규모: 15개 병렬 에이전트, 전체 코드베이스 정밀 감사 완료*
