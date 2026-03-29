# 슈퍼관리자 대시보드 무결성 검증 리포트

**검증일**: 2026-03-05
**대상**: `components/SuperAdmin/` 전체 흐름
**검증 방법**: 코드베이스 심층 정적 분석 (컴포넌트 → 훅 → API → DB → Edge Function)

---

## 1. 전체 아키텍처 개요

```
SuperAdminDashboard (진입점)
  └── SuperAdminGuard (인증 게이트)
        └── useSuperAdminAuth (JWT → is_super_admin RPC → client 주입)
              └── SuperAdminClientContext (React Context로 client 전파)
                    └── 각 탭 컴포넌트 (useSuperAdminClient() 소비)
```

### 탭 구성 (총 12개)

| 탭 ID | 레이블 | 컴포넌트 | 노출 위치 |
|---|---|---|---|
| `monitoring` | 통합 관제 | `ContractMonitoring` | 상단 탭 (기본) |
| `admissions` | 파트너 관리 | `PartnerAdmissions` + `PartnerManagement` | 상단 탭 |
| `revenue` | 매출 분석 | `RevenueManagement` | 상단 탭 |
| `leads` | 상담 관리 | `AdminLeadsView` | 상단 탭 |
| `subs` | 구독 현황 | `SubscriptionManager` | 드로어 메뉴 |
| `facilities` | 시설 통합 관리 | `FacilityManagement` | 드로어 메뉴 |
| `users` | 회원/권한 관리 | `UserManagement` | 드로어 메뉴 |
| `notices` | 공지사항 관리 | `NoticeManagement` | 드로어 메뉴 |
| `logs` | 시스템 활동 로그 | `AdminLogsView` | 드로어 메뉴 |
| `communication` | 소통 센터 | `AdminCommunication` | 드로어 메뉴 |
| `admin_settings` | 관리자 설정 | `AdminSettings` | 드로어 메뉴 |
| `system_settings` | 환경 설정 | `SystemSettings` | 드로어 메뉴 |

---

## 2. 인증 흐름 상세 검증

### 2.1 `useSuperAdminAuth` (hooks/useSuperAdminAuth.ts)

**흐름**:
1. `useSession()` → `session.access_token` 확인
2. `getAuthClient(session, { strict: true })` → JWT 세팅된 Supabase client 획득
3. `authClient.rpc('is_super_admin')` → DB 레벨 권한 확인
4. 성공 시 `client` 상태에 저장, `SuperAdminGuard`에 전달

**RPC 함수 `is_super_admin()` 구현**:
```sql
-- supabase/migrations/20260220_fix_is_super_admin_function.sql
SELECT 1 FROM public.profiles
WHERE clerk_id = public.clerk_user_id()  -- auth.uid()::text
  AND role = 'super_admin'
```
- `SECURITY DEFINER` 적용 ✓
- `profiles.role` 기준 단일화 ✓
- `GRANT TO authenticated` ✓

**무결성 판단**: **통과**
- session 없으면 early return + error 메시지
- RPC 실패 시 `isSuperAdmin = false` + client = null
- 취소(cancelled) 플래그로 race condition 방지
- `recheckFlag` 로 수동 재확인 지원

### 2.2 `SuperAdminGuard` (components/SuperAdmin/SuperAdminGuard.tsx)

- `loading` 중 → Loader 표시
- `!isSuperAdmin || !client` → 접근 차단 화면 + 재확인 버튼
- 정상 → `SuperAdminClientContext.Provider`에 client 주입

**무결성 판단**: **통과**
- client가 null이면 절대 children 렌더링 안 함
- 재확인(`recheck`) 기능 제공

### 2.3 중복 훅 이슈

| 훅 | 파일 | 비고 |
|---|---|---|
| `useSuperAdminAuth` | `hooks/useSuperAdminAuth.ts` | 실제 사용 훅 |
| `useSuperAdmin` | `hooks/useSuperAdmin.ts` | **중복 훅** — 별도 client 생성, cancelled 플래그 없음 |

**이슈 [MEDIUM]**: `useSuperAdmin`은 `useSuperAdminAuth`와 동일 목적이나 기능이 열등함 (cancelled 플래그 미적용). 현재 `useSuperAdminAuth`만 사용되고 있어 실제 영향은 없으나, 혼란 방지를 위해 삭제 권장.

---

## 3. 각 탭 흐름 상세 검증

### 3.1 통합 관제 (`ContractMonitoring`)

**데이터 소스**:
- `sangjo_contracts` 테이블: 실시간 Realtime 구독 (`postgres_changes`)
- `ai_consultations` 테이블: `AGENT_REQUESTED`, `AGENT_CONNECTED` 상태만 필터

**클라이언트**: `useSuperAdminClient()` — SuperAdminGuard에서 주입된 auth client ✓

**Realtime 구독 패턴**:
```ts
const channelSuffix = Date.now(); // 채널명 충돌 방지
const contractChannel = client.channel(`contract-monitor-${channelSuffix}`)
```
- cleanup: `contractChannel.unsubscribe()` + `client.removeChannel()` ✓
- mounted 플래그: **없음** — 단, 이 훅은 `getAuthClient().then()` 패턴이 아닌 `useEffect` + 동기 channel 생성이므로 race condition 없음 ✓

**AI 개입 (`handleJoinChat`)**:
- 이미 `AGENT_CONNECTED` 상태이면 경고 후 중단
- `aiConsultationService.updateStatus()` 호출
- 낙관적 UI 업데이트 (setAiConsultations)
- 에러 코드 `PGRST116` → "이미 다른 관리자 선점" 처리

**무결성 판단**: **통과**
- 메시지 기능: `toast.info('준비 중')` — 미구현 명시됨 (허용)
- 계약 상세 기능: `toast.info('준비 중')` — 미구현 명시됨 (허용)

---

### 3.2 파트너 입점 신청 (`PartnerAdmissions`)

**데이터**: `usePartnerInquiries({ status: 'pending', client })`
- `partner_inquiries` 테이블, status='pending' 필터
- React Query 사용 (`useQuery`) — 캐싱 + 자동 refetch 지원
- 중복 제거 로직: `company_name` 기준 dedup (최신 유지)

**승인 흐름**:
```
handleApprove(inquiry)
  → confirmModal.open()         (confirm dialog ✓)
  → useApprovePartner.approvePartner({ action: 'approve' })
    → client.functions.invoke('approve-partner')  (Edge Function 경유)
      [Edge Function]
      1. Authorization 헤더 검증 (Bearer JWT)
      2. supabaseAdmin.profiles.role = 'super_admin' 서버 재검증
      3. Zod 스키마 검증 (inquiryId, action)
      4. partner_inquiries 조회
      5. 승인: facility 생성 + partner 생성 + role 변경 + audit_log
      6. 이메일 발송 (Resend)
      7. 인앱 알림 저장
```

**거절 흐름**:
```
handleRejectSubmit()
  → isRejecting 상태로 중복 클릭 방지 ✓
  → approvePartner({ action: 'reject', rejectionReason })
    [Edge Function]
    → 동일 company_name의 모든 pending 건 일괄 rejected 처리
    → audit_log 기록
    → 거절 이메일 발송
```

**무결성 판단**: **통과**
- confirm dialog: 승인 ConfirmModal ✓, 거절 별도 모달(사유 입력) ✓
- 승인/거절 제출 중복 방지 ✓
  - 2026-03-29 재검증: `PartnerAdmissions.tsx`에서 `approvePartner.loading`을 `isApproving`으로 연결하고, 승인 버튼 / 거절 버튼 / 거절 모달 확인 버튼에 `disabled` 및 처리 중 상태를 적용
- Edge Function에서 서버 사이드 super_admin 재검증 ✓
- audit_log 기록 ✓

**이슈 없음**

---

### 3.3 기존 파트너 관리 (`PartnerManagement`)

**데이터**: `getPartners(client)` (`lib/sangjoQueries.ts`)

**상태 변경 흐름**:
```
handleStatusChange(id, status)
  → confirmAsync() (confirm dialog ✓)
  → client.auth.getUser() — 실제 admin ID 획득
  → updatePartnerStatus(id, status, approvedBy, client)
```

**무결성 판단**: **통과**
- confirm dialog ✓
- 실제 admin user ID를 `approved_by`에 저장 (하드코딩 없음) ✓

---

### 3.4 매출 분석 (`RevenueManagement`)

**데이터**: `useRevenue()` (hooks/useFinancials.ts)
- `getAuthClient(session, { strict: true })` — **슈퍼관리자 컨텍스트 밖에서 자체 세션 사용**
- `fetchPayments(client)` → `subscription_payments` 테이블

**수수료율**:
- `useSystemSettings(['commission_rate'])` → `system_settings` 테이블에서 로드 ✓ (하드코딩 없음)

**이슈 [LOW]**: `useRevenue`는 `useSuperAdminClient()` 대신 자체 `getAuthClient(session)`을 사용함.
- 실제 권한은 RLS가 보호하므로 보안 이슈는 없음
- 그러나 SuperAdminGuard의 client 주입 패턴과 불일치

**리포트 다운로드**: `toast.info('준비 중')` — 미구현 명시됨 (허용)

---

### 3.5 상담 관리 / AI Leads (`AdminLeadsView`)

**데이터**: `getAllLeads(client)` (`lib/queries.ts`)
- `consultations` 테이블 조회
- 전화번호 마스킹: `010-1234-5678` → `010-****-5678` ✓ (개인정보 보호)
- 중복 제거: 전화번호 기준 dedup (최신 유지)

**무결성 판단**: **통과**
- 전화번호 마스킹 처리됨 ✓
- useSuperAdminClient 사용 ✓

---

### 3.6 구독 현황 (`SubscriptionManager`)

**데이터**: `useSubscriptions()` (hooks/useFinancials.ts)
- `admin_subscriptions_with_facility` 뷰 조회
- 플랜명 fallback 매핑 (plan_id → 한글명)

**재결제일 변경**:
```
handleUpdateBillingDate(facilityId, current)
  → promptAsync() — 날짜 입력 모달
  → updateSubscriptionBillingDate(facilityId, isoDate, client)
    → facility_subscriptions 테이블 업데이트
    → UUID / bigint 자동 판별
```
- isUpdating 중복 방지 ✓

**무결성 판단**: **통과**

---

### 3.7 시설 통합 관리 (`FacilityManagement`)

**데이터**: `useAllFacilities()` (hooks/useAdminFacilities.ts)
- `searchFacilities(query, client)` — `.ilike()` + sanitize ✓ (SQL injection 방지)
- 페이지네이션 지원

**관리자 배정**:
```
handleSave(facilityId)
  → updateManager(facilityId, finalId)
  → facilities.user_id 업데이트
```

**UX 안내**: "Facility Admin 권한 먼저 부여 후 할당" 경고 표시 ✓

**무결성 판단**: **통과**
- ilike 검색 전 사용자 입력 sanitize ✓ (`lib/api/superAdmin.ts:73`)

---

### 3.8 회원/권한 관리 (`UserManagement`)

**데이터**: `useAllUsers()` (hooks/useUsers.ts)
- `profiles` 테이블 전체 조회

**권한 변경**:
```
onChange(e)
  → confirmAsync() (confirm dialog ✓)
  → updateRole(user.id, newRole)
    → updateUserRole() (lib/api/superAdmin.ts)
      → profiles.role 업데이트
      → audit_logs INSERT (action: 'UPDATE_ROLE') ✓
```

**무결성 판단**: **통과**
- confirm dialog ✓
- audit_log 기록 ✓
- 취소 시 select value 원복 ✓

---

### 3.9 공지사항 관리 (`NoticeManagement`)

**데이터**: `getPlatformNotices(undefined, client)` (`lib/sangjoQueries.ts`)

**CRUD 흐름**:
- 생성: `createPlatformNotice(formData, client)` — `isSubmitting` 중복 방지 ✓
- 수정: `updatePlatformNotice(id, formData, client)` — `isSubmitting` 중복 방지 ✓
- 삭제: `deletePlatformNotice(id, client)` — `confirmAsync()` ✓

**무결성 판단**: **통과**
- isSubmitting ✓, confirmAsync 삭제 ✓

---

### 3.10 시스템 활동 로그 (`AdminLogsView`)

**데이터**: `fetchAuditLogs(client)` (`lib/api/superAdmin.ts`)
- `audit_logs` 테이블, 최근 100건, 내림차순

**표시 액션**:
- `APPROVE_PARTNER` → "입점 승인"
- `REJECT_PARTNER` → "입점 반려"
- `UPDATE_ROLE` → "권한 변경"

**무결성 판단**: **통과**

---

### 3.11 환경 설정 (`SystemSettings`)

**수수료율**: `system_settings` 테이블에서 로드/저장 ✓
**점검 모드**: `confirmAsync()` → `updateSystemSetting('maintenance_mode', ...)` ✓
**매출 데이터 동기화**: `toast.warning('SQL 패치 실행 필요')` — 수동 프로세스 안내 (허용)

**무결성 판단**: **조건부 통과**
- isSaving 중복 방지 ✓
- confirmAsync ✓

**이슈 [LOW]**: `SystemSettings`는 초기 렌더 시 commission 기본값 `'3.5'`를 하드코딩. DB 로드 실패 시 이 값으로 저장될 수 있음.

---

### 3.12 관리자 설정 (`AdminSettings`)

**이슈 [HIGH]**: `supabase` anon 클라이언트 직접 import 사용 발견

```typescript
// AdminSettings.tsx:3
import { supabase } from '../../lib/supabaseClient'; // anon client 직접 import

// handleChangePassword 함수에서 사용:
const { error } = await supabase.auth.resetPasswordForEmail(email, {...});
```

- `supabase.auth.resetPasswordForEmail()` 은 anon client로도 동작 가능 (Auth API)
- 비밀번호 재설정은 공개 Auth API 사용이 허용됨 (보안 이슈 없음)
- 단, CLAUDE.md 규칙 위반: "anon client 직접 import 금지"

**profiles 업데이트**: `client.from('profiles').update().eq('clerk_id', user.id)` — auth client 사용 ✓

---

## 4. Edge Function `approve-partner` 검증

### 보안 레이어
1. **Authorization 헤더 필수** — 없으면 즉시 400 ✓
2. **JWT 검증** — `supabaseAuth.auth.getUser(token)` ✓
3. **Server-side super_admin 재검증** — `supabaseAdmin.profiles.role = 'super_admin'` ✓
4. **Zod 스키마 검증** — `inquiryId`, `action` 타입 검증 ✓
5. **CORS origin 화이트리스트** — `localhost` 미포함 ✓ (프로덕션 전용)

### 승인 시 원자적 처리
- `partner_inquiries` 조회 확인
- 시설(facility) 생성
- 파트너(partner) 생성
- 역할(role) 변경
- 동일 업체 나머지 pending 건 자동 처리
- `audit_logs` 기록
- Resend 이메일 발송

### 거절 시
- 동일 `company_name`의 **모든 pending 건** 일괄 rejected
- 사유 기록 (`rejectionReason` || '운영 정책 부적합')
- audit_log 기록
- 거절 이메일 발송

**무결성 판단**: **통과**

---

## 5. DB/RLS 검증

### `is_super_admin()` 함수

```sql
-- 최종 버전 (20260220_fix_is_super_admin_function.sql)
SECURITY DEFINER
STABLE
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE clerk_id = public.clerk_user_id()
      AND role = 'super_admin'
  );
$$
```

- `SECURITY DEFINER` ✓ (RLS 우회 없이 profiles 직접 읽기)
- `profiles.role` 기준 단일화 ✓
- `GRANT TO authenticated` ✓

### 관련 테이블 RLS 적용 현황

| 테이블 | RLS | super_admin 정책 |
|---|---|---|
| `profiles` | ✓ | `is_super_admin()` |
| `partner_inquiries` | ✓ | `is_super_admin()` |
| `partners` | ✓ | `is_super_admin()` |
| `audit_logs` | ✓ | `is_super_admin()` |
| `system_settings` | ✓ | `is_super_admin()` |
| `sangjo_contracts` | ✓ | `is_super_admin()` |
| `ai_consultations` | ✓ | `is_super_admin()` |

---

## 6. 발견된 이슈 요약

### [HIGH] AdminSettings.tsx — anon client import

| 항목 | 내용 |
|---|---|
| 파일 | `components/SuperAdmin/AdminSettings.tsx:3` |
| 이슈 | `supabase` anon client 직접 import (`import { supabase } from '...'`) |
| 실제 영향 | 비밀번호 재설정은 Auth 공개 API이므로 보안 취약점은 없음 |
| 규칙 위반 | CLAUDE.md 규칙 1: "anon client 함수 내부 직접 import 금지" |
| 권장 조치 | `useSuperAdminClient()`의 `client.auth.resetPasswordForEmail()` 사용으로 교체 |

### [MEDIUM] useSuperAdmin.ts — 중복 훅

| 항목 | 내용 |
|---|---|
| 파일 | `hooks/useSuperAdmin.ts` |
| 이슈 | `useSuperAdminAuth`와 동일 목적의 열등한 버전 중복 존재 |
| 실제 영향 | 현재 사용처 없음 (SuperAdminDashboard는 useSuperAdminAuth 사용) |
| 권장 조치 | 파일 삭제 |

### [MEDIUM] useRevenue / useSubscriptions — Guard 패턴 우회

| 항목 | 내용 |
|---|---|
| 파일 | `hooks/useFinancials.ts` |
| 이슈 | `useSuperAdminClient()` 대신 자체 `getAuthClient(session, { strict: true })` 사용 |
| 실제 영향 | RLS가 보호하므로 보안 취약점 없음. 단, Guard 패턴 일관성 깨짐 |
| 권장 조치 | `SubscriptionManager`, `RevenueManagement`에서 `useSuperAdminClient()` 주입 방식으로 전환 |

### [LOW] SystemSettings — 수수료 기본값 하드코딩

| 항목 | 내용 |
|---|---|
| 파일 | `components/SuperAdmin/SystemSettings.tsx:9` |
| 이슈 | `useState('3.5')` — DB 로드 실패 시 3.5%로 저장 가능 |
| 실제 영향 | 운영 환경에서 DB 정상이면 발생하지 않음 |
| 권장 조치 | 저장 버튼을 DB 로드 완료 전 비활성화 처리 |

### [LOW] ContractMonitoring — 메시지/관제 기능 미완성

| 항목 | 내용 |
|---|---|
| 파일 | `components/SuperAdmin/ContractMonitoring.tsx:137,142` |
| 이슈 | 메시지 버튼, 계약 관제 상세 — `toast.info('준비 중')` |
| 실제 영향 | UX 불편하나 데이터 무결성과 무관 |

---

## 7. 미완성 기능 (의도적 준비 중)

| 기능 | 위치 | 상태 |
|---|---|---|
| 리포트 다운로드 | `RevenueManagement.tsx:105` | toast.info 처리 |
| 메시지 기능 | `ContractMonitoring.tsx:137` | toast.info 처리 |
| 계약 관제 상세 | `ContractMonitoring.tsx:142` | toast.info 처리 |
| 알림 설정 저장 | `AdminSettings.tsx:122` | toast.info 처리 |
| 매출 데이터 동기화 | `SystemSettings.tsx:126` | 수동 SQL 실행 안내 |

---

## 8. P0 잔존 이슈 (대시보드 외부)

| 이슈 | 파일 | 상태 |
|---|---|---|
| `window.location.reload()` 잔존 | `ErrorBoundary.tsx:115`, `index.tsx:54` | 미수정 |
| `@ts-ignore` 잔존 | `lib/queries.ts:1591` | 미수정 |
| Edge Function `approve-partner` | Supabase Dashboard | 재배포 필요 |
| `useFacilityAdmin.ts` 중복 | `hooks/` vs `components/dashboard/` | 미정리 |

---

## 9. 최종 무결성 점수

| 영역 | 상태 | 비고 |
|---|---|---|
| 인증 게이트 (SuperAdminGuard) | ✅ 통과 | JWT + DB 이중 검증 |
| 파트너 승인/거절 E2E | ✅ 통과 | Edge Function 서버 검증 포함 |
| 실시간 관제 | ✅ 통과 | Realtime cleanup 정상 |
| 매출/구독 데이터 | ✅ 통과 (주의) | Guard 패턴 우회이나 RLS 보호됨 |
| 유저 권한 관리 | ✅ 통과 | confirm + audit_log |
| 공지사항 CRUD | ✅ 통과 | confirm + isSubmitting |
| 시스템 설정 | ✅ 조건부 통과 | 기본값 하드코딩 LOW |
| 감사 로그 | ✅ 통과 | 최근 100건 표시 |
| anon client 규칙 준수 | ⚠️ 위반 1건 | AdminSettings 비밀번호 재설정 |
| Edge Function 보안 | ✅ 통과 | CORS + JWT + DB 3중 검증 |
| RLS 전체 | ✅ 통과 | is_super_admin() profiles 기준 |

**종합 판단**: 보안 취약점은 발견되지 않았습니다. 규칙 위반 1건(anon client 직접 import)과 일관성 이슈 2건(Guard 패턴 우회, 중복 훅)이 존재하며, 출시 후 P2 작업으로 처리 권장합니다.

---

## 10. 권장 수정 우선순위

### 즉시 (출시 전)
- Edge Function `approve-partner` 재배포 확인 (Supabase Dashboard)

### P1 (이번 주)
- `hooks/useSuperAdmin.ts` 삭제 (dead code)

### P2 (출시 후)
1. `AdminSettings.tsx` — anon client → `client.auth` 교체
2. `useFinancials.ts` — Guard client 주입 방식으로 전환
3. `SystemSettings.tsx` — 로드 완료 전 저장 버튼 비활성화
