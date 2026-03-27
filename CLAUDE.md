# Memorimap 프로젝트

## 🔴 작업 원칙 (모든 작업에 자동 적용)

### 기본 태도
- 성급히 결론부터 내리지 않는다. 더 나은 구조와 방법을 먼저 고민
- 불명확하면 질문한다. 추측하지 않는다

### 계획 우선 원칙
- 즉시 실행하지 말고 먼저 계획을 작성 (목표 → 현재 상태 → 단계별 전략 → 리스크 → 검증 방법)
- 사용자 "승인" 전까지 실행하지 않는다

### 다중 역할 사고 모드
- 1차: 기획자 → 구조 설계
- 2차: 비판자 → 허점, 빠진 부분, 논리 오류 지적
- 3차: 실행자 → 최적 방식으로 수행
- 4차: 감사자 → 결과 검증 및 개선

### 자체 검증 의무
- 작업 완료 후 반드시: 요구사항 충족 → 누락 점검 → 논리 오류 점검 → 대안 제시 → 최종본 제출
- **검증 없는 완료는 금지**

### 품질 우선 원칙
- 속도보다 정확성 우선. 한 번에 제대로 완성
- 대충 추정하지 않는다

### 재발 방지 원칙
- 실수 발생 시 "재발 방지 규칙" 생성, 동일 오류 반복 금지
- 반복 패턴은 개선 대상으로 간주

### 복잡 작업 분업
- 하위 작업으로 분해 → 병렬 처리 가능 여부 판단 → 단계별 책임 구분

### 구조화 원칙
- 항상 단계별로 정리한다
- 긴 글은 섹션으로 분리한다
- 표/목록을 적극 활용한다
- 가독성을 최우선한다

### 컨텍스트 유지
- 작업 흐름을 요약 정리, 다음 단계 제안 포함
- 장기 작업일 경우 요약본 생성 제안

### 표준보고 모드
사용자가 "표준보고"라고 하면 아래 출력 구조로 작업한다:
1. 📌 계획
2. 🔍 비판 검토
3. ⚙ 실행
4. ✅ 자체 검증
5. 🚀 개선 및 최종본

## 🔴 코드 작성 원칙 (전역 규칙)
- **코드 생략 절대 금지**: `...`, `// rest of code`, `// 이전과 동일` 등 placeholder 사용 금지
- 모든 코드 수정 시 완전하고 동작하는 구현을 작성할 것 (Do not truncate any code)

## 🔴 보안 절대 규칙 (최우선 — 모든 작업에 항상 적용)
- **git commit/push 전 반드시 확인**: `.env`, `.env.local`, `.env.*.temp`, API 키가 포함된 파일이 스테이징되지 않았는지 확인
- **`git add .` 또는 `git add -A` 절대 금지**: 반드시 파일명을 지정하여 `git add <파일명>`으로 추가
- **커밋 전 `git diff --cached` 필수 실행**: 스테이징된 내용에 API 키, 시크릿, 토큰, 비밀번호가 포함되지 않았는지 확인
- **절대 커밋하면 안 되는 파일/패턴**:
  - `.env`, `.env.local`, `.env.*.temp`, `.env.local.temp`
  - `*.csv` (데이터 파일)
  - `debug_*.json` (디버그 파일)
  - 루트의 `*.sql` (마이그레이션은 `supabase/migrations/` 안에서만)
  - API 키, JWT 토큰, 시크릿이 하드코딩된 모든 파일
- **VITE_ 접두사 주의**: `VITE_`가 붙은 환경변수는 브라우저 번들에 포함됨. SERVICE_ROLE_KEY, SECRET 등에는 절대 `VITE_` 접두사 사용 금지
- **코드에 키 하드코딩 금지**: fallback으로라도 실제 키값을 소스코드에 넣지 않음. 없으면 에러로 처리
- **새 파일 생성 시**: `.gitignore`에 이미 등록되어 있는지 확인. 민감 데이터 포함 파일은 생성 즉시 `.gitignore`에 추가

## 토큰 절약 필수 규칙 (항상 적용)
- 코드 탐색 최소화: 이미 아는 파일은 다시 읽지 않기
- 응답은 짧고 핵심만. 불필요한 설명/반복 금지
- 여러 작업이라도 한 번에 병렬 처리 (독립적인 수정은 동시에)
- 파일 전체 읽기 대신 필요한 부분만 offset/limit으로 읽기
- 중간 확인 질문 최소화. 명확하면 바로 실행

## 인증 (Supabase Auth)
- Clerk 제거 완료 → Supabase Auth 사용
- `clerk_user_id()` SQL 함수는 내부만 `auth.uid()::text`로 변경 (RLS 정책 호환)
- `lib/auth.tsx`: AuthProvider + useUser/useClerk/useSession/useAuth 래핑 훅
- `lib/supabaseClient.ts`: 단일 클라이언트, `createAuthenticatedClient`는 `supabase` 반환 (하위호환)
- `hooks/useProfileSync.ts`: 로그인 시 profiles upsert
- `profiles.clerk_id`에 `auth.uid()::text` (UUID를 TEXT로) 저장

## 완료
- [x] Clerk → Supabase Auth 전환 (빌드 성공)
- [x] 슈퍼관리자 이메일 하드코딩 보안 수정
- [x] MyPage V1/V2 중복 통합
- [x] FacilityAdmin 레거시/신규 중복 정리
- [x] 엔딩노트 편집 버튼 연결
- [x] window.location.reload() 제거
- [x] 매출분석/구독관리 실데이터 연결
- [x] 빌드 성공 (P0)
- [x] 알림 개선 (P1)
- [x] 상조 서비스 분류/이미지/가격 (P2)
- [x] 성능 최적화 (P3)
- [x] DB 마이그레이션 `20260216_launch_readiness.sql` 작성/실행
- [x] is_super_admin 오버로드, partners.id DEFAULT, approve_partner_transaction 타입 수정
- [x] 상조 타입 매핑 수정 (`'상조'→'sangjo'` TYPE_MAP 추가)
- [x] PetChat DOMPurify JSX 텍스트 버그 제거
- [x] 예약 스텝 3→4 전환 오류 수정 (defaultValues 추가)
- [x] 이미지 업로드 교체 버튼 추가 (메인+갤러리)
- [x] FAQ 저장→목록 미반영 수정 (upsert→insert/update 분리)
- [x] 파트너 승인 흐름 코드 수정 (PartnerAdmissions, superAdmin API, sangjoQueries)
- [x] E2E 테스트 시나리오 문서 작성 (`docs/E2E_TEST_SCENARIOS.md`)
- [x] 검증 SQL 작성 (`scripts/verify_launch_readiness.sql`)
- [x] getAuthClient 통일 (26+파일 → `lib/supabaseClient.ts` 중앙 유틸)
- [x] SuperAdminDashboard 컴포넌트 분리 (300줄 원칙 적용)
- [x] 데이터 분류 정리 마이그레이션 (`20260224_data_classification_cleanup.sql`)
- [x] 이미지 없는 시설 38건 + 상조 10건 기본 이미지 배정 (`scripts/fill_missing_images.cjs`)
- [x] 요금제 Feature Gating 구현 (RPC 4개 + 훅 3개 + UpgradePrompt + 7파일 통합)
- [x] 코드베이스 무결성 검증 (P0/P1 이슈 10건 수정, 커밋 70ebbd5, 904ef67, cd133f4)
- [x] console.warn/error 프로덕션 잔존 전수 제거 (4+2=6건)
- [x] ComparisonModal 비교 제거 confirm 추가
- [x] OperationsManagement/LiveConsultation partnerId 네이밍 통일

## DB 검증 결과 (2026-02-24 최신)
- facilities: 2,139건 (funeral_home:1042, cemetery:585, columbarium:320, natural_burial:118, pet_funeral:69, sea_burial:5)
- funeral_companies: 50건
- 이미지 없음: 0건 (시설+상조 모두 배정 완료)
- 분류 오류: 0건, 중복: 0건, 비표준 type: 0건
- RPC 함수 정상: search_facilities(4), search_facilities_by_text(2,3), search_facilities_in_view(4), search_facilities_v2(5)

## 남은 작업

### P0: 검색 로직 버그 수정 (완료 ✓)
- [x] `strictFilter`에서 `i.category` → `i.type || i.category` 수정 + REGION_ALIASES 추가
- [x] 주소 정규화: "서울"↔"서울특별시", "경기"↔"경기도" 매핑 (queries.ts, FacilityList.tsx)
- [x] `FacilityList.tsx` 클라이언트 필터링 → 시/도 단위 우선매칭 + alias 매칭
- [x] 프로덕션 콘솔 로그 제거 (supabaseClient.ts, queries.ts)

### P1: 모바일 전용 최적화 (완료 ✓, 빌드 검증 통과)
**원칙**: 노트북/데스크톱 화면은 그대로 유지. 모바일에서만 UI 수정.

#### 모바일 상단 레이아웃 개편 (완료)
- [x] 모바일 헤더 간소화: 아이콘 축소(18px), 패딩 축소, 검색창 높이 조정 (`TopBar.tsx`)
- [x] 목록 우측 상단 지도 버튼 모바일 숨김 (`hidden md:flex`)
- [x] 프로모션 배너 모바일 컴팩트화 (텍스트/패딩 축소)
- [x] 검색창 여백 개선 (`TopBar.tsx` top-16/md:top-20, `FilterBar.tsx` mb-3/md:mb-2)

#### 모바일 UI 버그 수정 (완료)
- [x] 모달 스택 z-index 통일 (`SideMenu` z-[60]/z-[70])
- [x] 엔딩노트 모달 높이 확대 (`max-h-[75vh] md:max-h-[60vh]`)
- [x] 엔딩노트 공유 화면 하단 잘림 (`IntegratedJourneyView` pb-20/md:pb-8)
- [x] 상담신청 모달 X 버튼 터치타겟 확대 (min-w/h-[44px], shrink-0)
- [x] 상조 서비스 "서비스구성" 텍스트 깨짐 (break-words, min-w-0, break-keep)
- [x] 상조 서비스 탭 텍스트 크기 조정 (text-xs/md:text-sm, truncate)
- [x] 터치 타겟 44px 확보 (`FilterBar.tsx` min-h-[44px]/md:min-h-[36px])

#### iOS 100vh 대응 (완료)
- [x] FacilitySheet: h-[80vh]/md:h-[85vh]
- [x] FuneralCompanySheet: h-[75vh]/md:h-[80vh]
- [x] SangjoConsultationModal: h-[80vh]

#### 미완료 (수동 확인 필요)
- [x] AI 채팅 하단 입력창 조건부 숨김 (isFormActive로 정상 동작 확인)
- [x] 추모시설 AI 상담 "접수 중 오류" — auth client 수정 완료
- [ ] iOS Safe Area `env(safe-area-inset-bottom)` 적용 (실기기 테스트 후 판단)
- [ ] Vercel 이전 빌드 캐시 확인 (배포 후 확인)

### 출시 전 E2E 검증 (수동 테스트)
- [ ] 슈퍼관리자 파트너 승인 E2E (코드 완료, 실 테스트 필요)
- [x] 상조 관리자 대시보드 예약/상담 — 코드 검증 + anon→auth client 수정 완료
- [x] 상조 대시보드 구독/매출 — getFacilitySubscription auth client 수정 완료
- [x] 요금제 체계 검증 — SubscriptionPlans auth client 수정 완료
- [ ] 모바일 UI 점검 (실기기 확인 필요)
- [x] 시설별 대시보드 — FacilityAdminDashboard auth client 수정 완료
- [x] 마이페이지 검증 — MyPageView 코드 정상 확인
- [x] 리뷰/상담 함수 anon→auth client 수정 (queries.ts 8함수, 4컴포넌트)
- [x] 프로덕션 console.log 제거 (useFacilityData, useFavorites, useFacilityChat)
- [ ] Edge Function `approve-partner` 재배포 (Supabase Dashboard)
- [ ] 최종 빌드 + 배포

## 🔴 저장소 운영 표준 (2026-03-25 확정)
- 워크플로우 표준 문서: `docs/01-plan/repository_workflow_unification.plan.md`
- 브랜치: `dev`(개발), `main`(배포) 2개만 사용. `claude/*`, `gpt/*` 금지
- 워크트리: 메인 워크스페이스만 사용. 생성 시 반드시 제거 후 `git worktree prune`
- 문서: `docs/01-plan/`, `02-design/`, `03-analysis/`, `04-report/`에만 저장. 루트 임시 파일 금지
- 배포: dirty workspace에서 배포 금지. `main`이 의도한 커밋인지 확인 후 배포
- 멀티 에이전트: Claude/GPT 모두 동일 규칙. 핸드오프는 `dev` 브랜치 또는 커밋 SHA로

<project_rules>
당신은 Memorimap(추모맵) 프로젝트 전담 AI입니다.
아래 규칙은 모든 대화, 모든 코드 작성, 모든 수정에 예외 없이 적용됩니다.

## 1. Supabase 클라이언트
- anon client(supabase): 공개 시설 목록, 공개 공지 읽기만 허용
- auth client(createAuthenticatedClient): 모든 쓰기, 관리자/개인 데이터 읽기 필수
- token 없으면 조용한 실패 금지 → 명시적 에러 또는 early return
- fallback 패턴 금지: `token ? authClient : supabase` / `client || supabase` 형태 절대 사용 안 함

## 2. API 함수 설계
- 모든 API 함수는 `client: SupabaseClient`를 외부에서 주입받는다
- 함수 내부에서 supabase anon 직접 import 금지
- token 없으면 throw Error, return null 금지

## 3. DB 변경
- 모든 스키마 변경은 supabase/migrations/YYYYMMDDHHMMSS_설명.sql 경유
- 루트 .sql 직접 실행 금지
- 같은 날짜에 같은 함수/테이블 재정의 금지
- Dashboard SQL Editor 직접 실행 후 migrations 미반영 금지

## 4. TypeScript
- any 타입 사용 금지
- DB 타입은 types/db.ts 기준, 컴포넌트 내부 재정의 금지
- DB 컬럼 변경 시 types/db.ts 먼저 수정

## 5. Edge Function
- 모든 함수 시작부에 Bearer 토큰 검증 필수
- 소유권 검증은 클라이언트 파라미터 신뢰 금지 → DB에서 직접 확인
- 프로덕션 CORS에 localhost 포함 금지

## 6. RLS
- 모든 테이블 RLS 활성화 필수
- auth.uid() 사용 금지 → public.clerk_user_id() 사용
- is_super_admin()은 profiles.role 기준 단일화
- 민감 테이블 SELECT를 authenticated 전체 개방 금지

## 7. 컴포넌트
- 삭제/취소/승인/거절/강제해지: confirm dialog 필수
- 제출 버튼: isSubmitting 상태로 중복 클릭 방지 필수
- 에러 메시지: 사용자 언어로 표시, 기술적 메시지는 console.error만
- useEffect에서 subscription/timer/eventListener: cleanup 필수

## 8. 하드코딩 금지
- 수수료율, 설정값: system_settings 테이블에서 로드
- ID, 이메일, URL: 환경변수 또는 DB 사용
- 특정 이메일 하드코딩(예: blacknacoof@gmail.com) 절대 금지

## 9. URL 보안
- 외부 URL 사용 전 https:// 또는 http:// 프로토콜 검증 필수
- 사용자 입력을 .or() 필터에 직접 삽입 금지 → sanitize 후 사용

## 10. 작업 순서
새 기능: types/db.ts → migrations → RLS → lib/api → hooks → 컴포넌트
버그 수정: CRITICAL → HIGH → MEDIUM → LOW 순서
보안 이슈와 기능 버그는 분리해서 작업

## 코드 작성 규칙
- 코드는 항상 완전하게 작성 (truncate, 생략, placeholder 금지)
- "// 나머지 코드 동일" 형태 금지
- 수정 시 파일 전체 코드 제시

## 11. 인증 클라이언트 통일 원칙 (구현 완료)

`lib/supabaseClient.ts`의 `getAuthClient(session, options?)` 하나만 사용:
- `getAuthClient(session, { strict: true })` — 인증 필수 (관리자, 쓰기 작업)
- `getAuthClient(session)` — 인증 선택 (공개 읽기 fallback)
- 각 파일에서 로컬 getAuthClient 정의 금지
- `createAuthenticatedClient` 직접 호출 금지 (하위호환용으로만 존재)

## 12. 파일 크기 원칙

- 단일 파일 300줄 초과 금지
- 인라인 컴포넌트 3개 초과 금지 → 별도 파일로 분리
- 하나의 컴포넌트가 useState 5개 초과 시 훅으로 분리

## 13. 테스트 원칙

새 기능 추가 시 반드시 함께 작성:
- 인증 관련 함수: getAuthClient 성공/실패 케이스
- API 함수: 정상 응답 + 에러 응답
- 비가역 액션(삭제/승인): confirm 동작 확인

테스트 없는 PR은 CRITICAL/HIGH 이슈와 동일하게 처리.
```
작업 완료 후 CLAUDE.md 규칙 기준으로 재검증하고
이슈 있으면 바로 수정 후 커밋까지 완료할 것.
CLAUDE.md 규칙 준수하여 구현.
순서: types/db.ts → migrations → RLS → lib/api → hooks → 컴포넌트
완료 후 재검증 + 커밋.
</project_rules>

## AI Worktree Commit Rule
- GPT/Claude가 작업한 기능 파일만 선택적으로 커밋한다.
- `.next/`, `next-env.d.ts`, `.tsbuildinfo`, `supabase/.temp/*`, 로컬 설정 파일은 커밋하지 않는다.
- 커밋 전 `git diff --cached`로 staged 내용만 다시 검토한다.

## Subscription Cancellation Validation Note
- 개인/시설 무료 전환 버튼은 현재 즉시 FREE 전환이 아니라 해지 예약(`cancelling`) 동작이어야 한다.
- 개인 해지 예약 성공 기준:
  - `plan_id`/`plan_name` 유지
  - `status = cancelling`
  - `auto_renew = false`
  - `expires_at` 유지
- 시설 해지 예약 성공 기준:
  - 기존 유료 `plan_id` 유지
  - `status = cancelling`
  - `auto_renew = false`
  - `next_billing_date` 유지
- 만료 후 전환 검증은 `select public.process_expired_subscriptions();` 로 수동 확인 가능하다.

## Release QA Priority
- P0
  - `verify-payment` Edge Function must be redeployed before release.
  - Vercel production deploy must be followed by immediate smoke test on live URL.
  - Smoke scope: personal subscription, facility/sangjo subscription state display, latest `verify-payment` path.
- P1
  - Super admin partner approval E2E
  - Mobile UI check on real device
- P2
  - DB spot checks: `admin_memo`, `system_settings` RLS, `sangjo_contracts` RLS

## Release QA Scope
- General user
  - signup/login
  - funeral home / memorial facility / sangjo search and detail
  - 마음이 상담 entry
  - facility AI consultation
  - sangjo AI comparison / consultation
  - favorites add/remove
  - reservation / consultation submission
  - personal subscription payment and cancellation reservation
- Facility partner
  - partner application
  - approval before/after permission difference
  - dashboard entry
  - subscription payment / cancellation reservation
  - reservation and consultation intake
- Sangjo partner
  - partner application
  - dashboard entry after approval
  - subscription payment / cancellation reservation
  - sangjo AI comparison linkage
- Super admin
  - partner approval / rejection
  - post-approval permission reflection
  - no runtime errors on admin views
