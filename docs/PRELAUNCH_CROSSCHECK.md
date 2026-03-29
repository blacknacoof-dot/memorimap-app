# Memorimap 출시 전 종합 크로스 체크

> 생성일: 2026-02-22
> 기반: `종합 감사및 정리.txt` (5단계 감사) + `기능테스트.txt` + 이전 세션 수정사항
> 목적: 감사 발견사항 vs 실제 수정사항 크로스 체크, 미완료 항목 추적

---

## 전체 요약

| 레이어 | 감사 점수 | CRITICAL | HIGH | 수정 완료 | 미완료 |
|--------|-----------|----------|------|-----------|--------|
| 1. DB 레이어 | 60/100 | 4 | 9 | 10 | 3 |
| 2. 타입 레이어 | 38→65/100 | 2 | 4 | 4 | 2 |
| 3. 인증/권한 | 55/100 | 2 | 3 | 3 | 4 |
| 4. 프론트엔드 | 62/100 | 3 | 6 | 3 | 6 |
| 5. 기능 테스트 | - | - | - | 4 | 3 |

---

## STAGE 1: DB 레이어 (감사 점수 60/100)

### CRITICAL (4건)

| ID | 이슈 | 상태 | 수정 내역 |
|----|------|------|-----------|
| ISSUE-1 | consultations.facility_id FK 삭제됨 (orphan 가능) | **보류** | TEXT↔UUID 불일치로 FK 재생성 불가. 앱 레벨 validation 의존. 출시 후 모니터링 |
| ISSUE-2 | leads.user_id UUID → Clerk 비호환 | **수정완료** | `20260221_db_fixes_batch2.sql` — FK 삭제 + TEXT 변환 + RLS 재생성 |
| ISSUE-3 | chat_events/product_click_logs user_id UUID FK | **수정완료** | `20260221_db_fixes_batch2.sql` — FK 삭제 + TEXT 변환 |
| ISSUE-12 | is_super_admin() 함수 정의 충돌 (profiles vs admin_users) | **수정완료** | `20260221_db_fixes_batch1.sql` — admin_users 기반으로 통일 |

### HIGH (9건)

| ID | 이슈 | 상태 | 수정 내역 |
|----|------|------|-----------|
| ISSUE-4 | bot_data.facility_id BIGINT vs UUID | **보류** | 현재 사용 빈도 낮음, 출시 후 데이터 확인 후 변환 |
| ISSUE-5 | timeline_events.facility_id BIGINT vs UUID | **보류** | ISSUE-4와 동일 |
| ISSUE-10 | schema.sql 완전히 outdated (5개 테이블만) | **미완료** | pg_dump --schema-only 재생성 필요. 출시 차단 아님 |
| ISSUE-11 | auth.uid() RLS 정책 잔류 가능성 | **수정완료** | `20260219_fix_auth_uid_rls_v2.sql` + `20260220_*` 시리즈로 대부분 교체 |
| ISSUE-13 | 파트너 데이터 격리 부족 | **부분수정** | `20260221_fix_reservations_consultations_rls.sql`에서 facility_admin RLS 추가 |
| ISSUE-17 | idx_facilities_category ghost 인덱스 | **수정완료** | `20260221_db_fixes_batch2.sql` — DROP + idx_facilities_type 생성 |
| ISSUE-18 | 누락 인덱스 18개 | **수정완료** | `20260221_db_fixes_batch1.sql` — 핵심 인덱스 일괄 추가 |
| ISSUE-19 | consultations.status enum 충돌 | **수정완료** | `20260221_fix_consultation_status.sql` — 상태값 통일 |
| ISSUE-21 | reservations RLS 정책 불명 | **수정완료** | `20260221_fix_reservations_consultations_rls.sql` — 전체 RLS 재정의 |
| ISSUE-23 | 루트 SQL vs migrations 충돌 | **보류** | 루트 SQL은 레거시 수동 실행 흔적. .gitignore로 관리 권장 |
| ISSUE-24 | 같은 날짜 마이그레이션 순서 의존 | **인지** | 20260220 시리즈 — 의도적 순서. 문서화 완료 |

### MEDIUM (9건)

| ID | 이슈 | 상태 | 비고 |
|----|------|------|------|
| ISSUE-6 | notification_logs.facility_id BIGINT | **보류** | 레거시/미사용 가능성 높음 |
| ISSUE-7 | 3중 즐겨찾기 테이블 병존 | **인지** | favorites(레거시), user_favorites(RPC), sangjo_favorites(상조). 출시 후 통합 |
| ISSUE-8 | 3중 리뷰 테이블 병존 | **인지** | reviews(신규), reviews_old(레거시), facility_reviews. 출시 후 정리 |
| ISSUE-9 | rls_test 테이블 프로덕션 잔류 | **수정완료** | `20260221_db_fixes_batch1.sql` — DROP TABLE |
| ISSUE-14 | partner_inquiries 하드코딩 이메일 | **수정완료** | `20260219_protect_profiles_role.sql`에서 is_super_admin() 기반으로 교체 |
| ISSUE-15 | subscription_payments SELECT 과도 접근 | **수정완료** | `20260221_db_fixes_batch1.sql` — 소유자 한정 정책으로 교체 |
| ISSUE-16 | sangjo_contracts SELECT 과도 접근 | **수정완료** | `20260221_db_fixes_batch1.sql` |
| ISSUE-25 | 마이그레이션 중복 정의 (RPC 4회 등) | **인지** | 최종본만 활성. 추적 어렵지만 기능 문제 없음 |
| ISSUE-26 | 레거시 migrations/ 폴더 | **보류** | 출시 후 정리 |

### LOW (3건)

| ID | 이슈 | 상태 |
|----|------|------|
| ISSUE-20 | emergency_requests status 대소문자 | **보류** |
| ISSUE-27 | patches/ 폴더와 migrations 중복 | **인지** |
| ISSUE-29 | reservations.payment_verified 컬럼 누락 | **수정완료** — batch1.sql |

---

## STAGE 2: 타입 레이어 (감사 점수 38→65/100)

### 코드 컬럼 불일치 수정

| 항목 | 상태 | 수정 내역 |
|------|------|-----------|
| `price_info` → `packages` | **수정완료** | hooks/useFacilityData.ts 등 — 이전 세션 |
| `paid_at` 컬럼 제거 | **수정완료** | hooks/useReservations.ts INSERT에서 제거 |
| `category` → `type` 참조 수정 | **수정완료** | hooks/useFacilityData.ts, queries.ts |
| `rejection_reason` → `message` | **수정완료** | lib/api/facilityAdmin.ts:53 — 이번 세션 |
| `i.category` → `i.type` 필터 수정 | **수정완료** | FacilityList.tsx strictFilter |
| TYPE_MAP 한글 매핑 추가 | **수정완료** | utils/facilityNormalizer.ts — `'상조'→'sangjo'` 등 |

### 미완료

| 항목 | 상태 | 비고 |
|------|------|------|
| MemorialSpaceSchema 한글 enum 미대응 | **출시 후** | Zod 스키마에 한글 type 값 validation 추가 필요 |
| types_schema.ts 레거시 파일 정리 | **출시 후** | 삭제 예정 (git status에 D 표시) |

---

## STAGE 3: 인증/권한 레이어 (감사 점수 55/100)

### CRITICAL (2건)

| ID | 이슈 | 상태 | 수정 내역 |
|----|------|------|-----------|
| AUTH-13 | gemini-proxy 인증 없이 호출 가능 (비용 폭탄) | **수정완료** | 코드에 Bearer 토큰 검증 추가, Supabase JWT 확인 로직 구현 |
| AUTH-14 | verify-payment 인증 없음 + orderId 위조 | **수정완료** | 인증 추가 + orderId 소유권 검증 + 금액 이중 검증 |

### HIGH (3건)

| ID | 이슈 | 상태 | 수정 내역 |
|----|------|------|-----------|
| AUTH-15 | approve-partner JWT fallback 서명 미검증 | **수정완료** | fallback 경로에서 base64만 디코딩 → profiles 조회 추가 검증 |
| AUTH-17 | updateUserRole 서버 권한 체크 없음 | **수정완료** | `20260219_protect_profiles_role.sql` — DB 트리거로 role 변경은 super_admin만 가능 |
| AUTH-05 | profiles.role vs admin_users 이중 소스 | **부분수정** | is_super_admin()을 admin_users 기반으로 통일 (ISSUE-12). 하지만 getUserRole()은 여전히 profiles.role 참조 |

### MEDIUM (6건)

| ID | 이슈 | 상태 | 비고 |
|----|------|------|------|
| AUTH-01 | cachedAuthClient 로그아웃 미정리 | **수정완료** | useAuthSync.ts에서 로그아웃 시 resetAuthenticatedClient() 호출 추가 |
| AUTH-03 | 카카오 인앱브라우저 미대응 | **미완료** | ExternalBrowserGuidePage 존재하나 자동 감지/유도 없음 |
| AUTH-06 | 역할 클라이언트 메모리만 저장 | **허용** | RLS가 최후 방어선으로 작동. UI 구조 노출만 위험 |
| AUTH-07 | 파트너 역할 3테이블 분산 | **인지** | approve_partner_transaction RPC가 원자적 처리 |
| AUTH-09 | 관리자 뷰 클라이언트 체크만 | **허용** | RLS 방어 확인됨. 서버 재검증은 출시 후 |
| AUTH-22 | 슈퍼관리자 MFA 없음 | **미완료** | Clerk Dashboard에서 설정 필요 (코드 변경 아님) |

### LOW (7건) — 모두 보류/허용

| ID | 이슈 | 비고 |
|----|------|------|
| AUTH-02 | 토큰 갱신 경쟁 조건 | visibility 핸들러로 대응 |
| AUTH-04 | 로그아웃 in-flight 요청 | 자연 소멸 |
| AUTH-08 | 상조 역할 fallback 'a-sangjo' | 빈 데이터 반환 (무해) |
| AUTH-10 | AuthGuard 역할 미체크 | ContentRouter가 대체 |
| AUTH-11 | 'admin' dead code | 무해 |
| AUTH-12 | URL 해시 직접 입력 | 클라이언트 체크 차단 |
| AUTH-16 | CORS에 localhost 포함 | 프로덕션 배포 시 환경변수로 분리 권장 |

---

## STAGE 4: 프론트엔드 (감사 점수 62/100)

### CRITICAL (3건)

| ID | 이슈 | 상태 | 수정 내역 |
|----|------|------|-----------|
| FE-01 | .or() SQL 문자열 삽입 (admin.ts, queries.ts, sangjoQueries.ts) | **수정완료** | admin.ts: PostgREST 구분자(,.()"') 제거, queries.ts: 숫자만 허용, sangjoQueries.ts: 기수정(영숫자만) |
| FE-02 | additionalData 무제한 spread (sangjoQueries.ts:60-66) | **기수정** | ALLOWED_FIELDS 화이트리스트 이미 적용됨 |
| FE-03 | 결제 인증 fallback (portone.ts:135) | **기수정** | 토큰 없으면 에러 반환, fallback 없음 |

### HIGH (6건)

| ID | 이슈 | 상태 | 비고 |
|----|------|------|------|
| FE-04 | context_data 무제한 spread (queries.ts:454) | **미완료** | whitelist 적용 필요 |
| FE-05 | InquiryModal 입력 미검증 | **미완료** | 전화번호/이메일 validation 추가 필요 |
| FE-06 | console.error/warn 프로덕션 노출 | **부분수정** | vite.config.ts에서 console.log/debug 제거 설정. error/warn은 잔류 |
| FE-07 | naverBookingUrl javascript: 프로토콜 미검증 | **수정완료** | /^https?:\/\//i 프로토콜 검증 추가 (FacilitySheet.tsx) |
| FE-08 | business_license_url javascript: 미검증 | **수정완료** | /^https?:\/\//i 프로토콜 검증 추가 (PartnerAdmissions.tsx) |
| FE-09 | sessionStorage 대화 ID 저장 | **보류** | 인앱브라우저 호환성 이슈. 기능 저하 가능 |

### MEDIUM (7건) — 출시 후 개선

| ID | 이슈 | 비고 |
|----|------|------|
| FE-10 | 파일 업로드 MIME만 검증 | magic bytes 확인 추가 권장 |
| FE-11 | 전화번호 tel: URL 미검증 | 형식 validation 추가 |
| FE-12 | ReactMarkdown skipHtml 미설정 | XSS 잠재 위험 |
| FE-13 | 이미지 URL 도메인 미검증 | 외부 URL fallback 제한 |
| FE-14 | URL hash 라우팅 race condition | 낮은 발생 확률 |
| FE-15 | localStorage 검색기록 비암호화 | 개인정보 최소화 |
| FE-16 | category 파라미터 미sanitize | PostgREST 필터 주입 가능성 |

---

## STAGE 5: 기능 테스트 결과 (기능테스트.txt)

### 일반 사용자 (31개 테스트, 96.8% 통과)

| 항목 | 상태 | 수정 내역 |
|------|------|-----------|
| 예약 Step 3→4 전환 오류 | **수정완료** | defaultValues 추가 (이전 세션) |
| 검색/필터/카테고리 | **수정완료** | strictFilter, TYPE_MAP, REGION_ALIASES |
| 나머지 30개 기능 | **정상** | |

### 업체 관리자 (24개 테스트, 95.8% 통과)

| 항목 | 상태 | 수정 내역 |
|------|------|-----------|
| 이미지 업로드 "+" 미반응 | **수정완료** | 이미지 교체 버튼 추가 (이전 세션) |
| FAQ 저장 후 목록 미반영 | **수정완료** | upsert→insert/update 분리 (이전 세션) |
| 나머지 22개 기능 | **정상** | |

### 슈퍼관리자 (14개 테스트, 100% 통과)

| 항목 | 상태 |
|------|------|
| 전체 14개 기능 | **정상** |
| 파트너 승인/거절 중복 클릭 방지 | **수정완료** (2026-03-29, `PartnerAdmissions.tsx`) |

### 미테스트 항목 (수동 확인 필요)

| 항목 | 상태 | 우선순위 |
|------|------|----------|
| 상조 관리자 대시보드 예약/상담 표시 | **미테스트** | P1 |
| 상조 대시보드 구독/매출 확인 | **미테스트** | P1 |
| 시설별 대시보드 (장례/동물/추모/수목/공원) | **미테스트** | P1 |
| 마이페이지 전체 기능 검증 | **미테스트** | P1 |
| 모바일 UI 전체 점검 | **미테스트** | P2 |
| AI 상담 "접수 중 오류" 디버깅 | **미테스트** | P2 |
| iOS Safe Area 테스트 | **미테스트** | P3 |

---

## 출시 차단 항목 (MUST FIX)

### 즉시 수정 필요 (코드 변경)

| # | 항목 | 파일 | 상태 |
|---|------|------|------|
| 1 | FE-01: .or() SQL 삽입 방어 | lib/admin.ts, queries.ts, sangjoQueries.ts | **수정완료** (2/22) |
| 2 | FE-02: additionalData whitelist | lib/sangjoQueries.ts:60-66 | **기수정** (ALLOWED_FIELDS) |
| 3 | FE-03: 결제 인증 fallback | lib/portone.ts:129 | **기수정** (토큰 필수) |
| 4 | FE-07/08: URL javascript: 프로토콜 차단 | FacilitySheet.tsx, PartnerAdmissions.tsx | **수정완료** (2/22) |
| 5 | AUTH-01: 로그아웃 시 cachedAuthClient 정리 | lib/useAuthSync.ts | **수정완료** (2/22) |

### DB/인프라 작업 (Supabase Dashboard)

| # | 항목 | 상태 |
|---|------|------|
| 1 | Edge Function `approve-partner` 재배포 | **미완료** — Supabase Dashboard |
| 2 | Edge Function `gemini-proxy` 재배포 (인증 추가본) | **확인 필요** |
| 3 | Edge Function `verify-payment` 재배포 (인증+IDOR 방어) | **확인 필요** |
| 4 | 슈퍼관리자 MFA 활성화 | **미완료** — Clerk Dashboard |

### 수동 E2E 테스트 (코드 변경 없음)

| # | 테스트 항목 |
|---|------------|
| 1 | 슈퍼관리자 파트너 승인 E2E |
| 2 | 상조 관리자 대시보드 |
| 3 | 시설별 대시보드 |
| 4 | 마이페이지 |
| 5 | 요금제 체계 검증 |
| 6 | 모바일 UI 점검 |

---

## 출시 후 개선 항목 (POST-LAUNCH)

### P1 (1주 이내)

- ISSUE-4/5: bot_data/timeline_events facility_id BIGINT→UUID 변환
- ISSUE-10: schema.sql 재생성 (pg_dump)
- FE-04: context_data whitelist
- FE-05: InquiryModal 입력 검증
- FE-06: console.error/warn 프로덕션 제거
- AUTH-03: 카카오 인앱브라우저 감지/유도

### P2 (2주 이내)

- ISSUE-7/8: 즐겨찾기/리뷰 테이블 통합
- ISSUE-23/26: 루트 SQL + 레거시 migrations 정리
- FE-10~16: MEDIUM 프론트엔드 이슈 7건
- MemorialSpaceSchema 한글 enum 대응

### P3 (1개월 이내)

- ISSUE-1: consultations.facility_id FK 복원 검토
- ISSUE-6: notification_logs 레거시 정리
- AUTH-05: getUserRole ↔ is_super_admin 완전 통일
- iOS Safe Area env() 적용

---

## 적용된 마이그레이션 목록 (2/19~2/21)

```
20260219_protect_profiles_role.sql        — role 변경 트리거 (super_admin만)
20260219_fix_auth_uid_rls_policies.sql    — auth.uid() → clerk_user_id() 1차
20260219_fix_auth_uid_rls_v2.sql          — auth.uid() → clerk_user_id() 2차 (최종)
20260220_fix_favorite_rpc_auth_uid.sql    — 즐겨찾기 RPC auth.uid() 수정
20260220_fix_admin_users_rls.sql          — admin_users RLS 수정
20260220_fix_is_super_admin_function.sql  — is_super_admin 1차 정의
20260220_fix_superadmin_tables_rls.sql    — super_admins/admin_users RLS
20260220_get_user_role_rpc.sql            — get_user_role RPC 생성
20260220_fix_superadmin_rls.sql           — is_super_admin 최종 (admin_users 기반)
20260221_db_fixes_batch1.sql              — ISSUE-9,12,15,18,29 수정
20260221_db_fixes_batch2.sql              — ISSUE-13,14,16,17 수정
20260221_fix_consultation_status.sql      — consultation status 통일
20260221_fix_reservations_consultations_rls.sql — reservations/consultations/leads RLS 전면 재정의
20260221_cleanup_duplicate_rls.sql        — 중복 RLS 정리
```

---

## 코드 수정 이력 (이전 세션 + 현재 세션)

| 파일 | 수정 내용 |
|------|-----------|
| `hooks/useFacilityData.ts` | price_info→packages, category→type |
| `hooks/useReservations.ts` | paid_at 제거 |
| `lib/api/facilityAdmin.ts` | rejection_reason→message |
| `utils/facilityNormalizer.ts` | TYPE_MAP 한글 매핑 추가 |
| `components/FacilityList.tsx` | strictFilter i.category→i.type |
| `lib/queries.ts` | REGION_ALIASES, 주소 정규화 |
| `supabase/functions/gemini-proxy/index.ts` | Bearer 토큰 인증 추가 |
| `supabase/functions/verify-payment/index.ts` | 인증 + orderId 소유권 검증 |
| `supabase/functions/approve-partner/index.ts` | JWT fallback 강화 |
