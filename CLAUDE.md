# Memorimap 프로젝트

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

## DB 검증 결과 (2026-02-17)
- facilities 테이블: `category` 컬럼 없음, `type` 컬럼 사용
- 광주광역시 44건 (funeral_home:21, columbarium:8, cemetery:7, natural_burial:4, pet_funeral:4)
- 경기도 광주시 22건, 축약형 "광주 북구" 2건
- 주소 형식 혼재: "서울"/"서울특별시", "경기"/"경기도"
- **검색 버그 근본원인**: `strictFilter`에서 `i.category` 참조 → DB에 없는 필드 → 전부 탈락
- RPC 함수 정상: search_facilities(4), search_facilities_by_text(2,3), search_facilities_in_view(4), search_facilities_v2(5)
- 콘솔 디버그 로그 잔류 (프로덕션 제거 필요)

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
- [ ] AI 채팅 하단 입력창 조건부 숨김 (현재 isFormActive로 이미 조건부 숨김 동작)
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
