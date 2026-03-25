# 슈퍼관리자 시스템 작업 계획서

> 기준 리서치: `research_superadmin_integrated_control.md`
> 작성일: 2026-03-06 | 코드베이스: commit 281cef3

---

## 목차

1. [현재 상태 진단](#1-현재-상태-진단)
2. [이슈 분류표 (우선순위 매트릭스)](#2-이슈-분류표-우선순위-매트릭스)
3. [P0: 즉시 처리 (Blocker)](#3-p0-즉시-처리-blocker)
4. [P1: 이번 주 (고위험 코드 이슈)](#4-p1-이번-주-고위험-코드-이슈)
5. [P2: 코드 품질 정리](#5-p2-코드-품질-정리)
6. [P3: 장기 구조 개선](#6-p3-장기-구조-개선)
7. [실행 순서 및 의존성 맵](#7-실행-순서-및-의존성-맵)
8. [리스크 분석](#8-리스크-분석)
9. [검증 기준](#9-검증-기준)
10. [리서치 문서 오류 수정 사항](#10-리서치-문서-오류-수정-사항)

---

## 1. 현재 상태 진단

### 1-1. 시스템 현황

| 구분 | 상태 | 비고 |
|------|------|------|
| 빌드 | 정상 | commit 281cef3 기준 |
| 슈퍼관리자 2중 가드 | 정상 | ContentRouter + SuperAdminGuard |
| Realtime 구독 | 정상 | removeChannel 제거 완료 (commit 281cef3) |
| AdminSettings phone_number | 정상 | commit 85672eb 수정 완료 |
| SystemSettings maintenanceMode | 정상 | commit 85672eb 수정 완료 |
| Edge Function approve-partner | **미배포** | Supabase Dashboard 수동 재배포 필요 |
| 파트너 승인 E2E | **미검증** | 코드 완료, 실 테스트 필요 |

### 1-2. 코드베이스 규모

| 파일 | 줄 수 | 상태 |
|------|-------|------|
| `lib/queries.ts` | 2,046줄 | 300줄 초과 — P3 분리 대상 |
| `components/NotificationCenter.tsx` | 344줄 | 300줄 초과 — P2 분리 대상 |
| `lib/api/superAdmin.ts` | 260줄 | 정상 범위 내 |
| `components/SuperAdmin/SuperAdminDashboard.tsx` | 231줄 | 인라인 컴포넌트 포함 — P2 분리 대상 |
| `components/SuperAdmin/AdminLeadsView.tsx` | 167줄 | 로컬 타입 정의 포함 — P2 이전 대상 |

### 1-3. 리서치에서 확인된 핵심 발견

**잘못 기재된 정보 (즉시 수정):**
- 리서치 Section 10-11에서 `ContractMonitoring`이 `client` prop을 직접 받는다고 기재했으나, 실제로는 `useSuperAdminClient()`로 Context에서 가져와 `useContractMonitoring(client)`에 전달함. 일관성 문제 없음.

**확인된 데드코드:**
- `lib/api/superAdmin.ts`: `fetchNotices`, `createNotice`, `deleteNotice` — 어떤 컴포넌트에서도 import되지 않음
- `lib/api/superAdmin.ts`: `fetchAllFacilities`, `searchFacilities` — FacilityManagement는 `useAdminFacilities.ts`의 직접 query 사용

**확인된 코드 품질 이슈:**
- `hooks/useAdminFacilities.ts:53,74` — `console.error` 2건 (프로덕션 노출)
- `hooks/useFinancials.ts:40,66` — `console.error` 2건 (프로덕션 노출)

**확인된 설계 이슈:**
- `hooks/useSystemSettings.ts` — anon client 사용, `system_settings` RLS 정책 확인 필요
- `AdminFacility` 인터페이스에 레거시 필드 (`manager_id`, `owner_user_id`) 잔존
- `AdminLeadsView.tsx` 내 `Lead` 인터페이스 로컬 정의 — `types/db.ts` 이전 필요

---

## 2. 이슈 분류표 (우선순위 매트릭스)

| # | 이슈 | 파일 | 우선순위 | 영향도 | 난이도 | 타입 |
|---|------|------|---------|--------|--------|------|
| A1 | Edge Function approve-partner 재배포 | Supabase Dashboard | **P0** | 파트너 승인 전체 불능 | 낮음 (수동) | Blocker |
| B1 | console.error 제거 (4건) | useAdminFacilities.ts, useFinancials.ts | **P1** | 프로덕션 로그 노출 | 낮음 | 코드 품질 |
| B2 | system_settings RLS 검증 | Supabase DB | **P1** | anon client 읽기 실패 시 수수료율 0 | 중간 | 보안/기능 |
| C1 | 데드코드 삭제 (5함수) | lib/api/superAdmin.ts | **P2** | 코드 혼선 | 낮음 | 정리 |
| C2 | Lead 인터페이스 이전 | AdminLeadsView.tsx → types/db.ts | **P2** | 타입 중복 | 낮음 | 타입 정리 |
| C3 | NotificationModal 분리 | NotificationCenter.tsx (344줄) | **P2** | 300줄 원칙 위반 | 중간 | 구조 |
| C4 | SideMenuDrawer 분리 | SuperAdminDashboard.tsx | **P2** | 인라인 컴포넌트 원칙 위반 | 중간 | 구조 |
| C5 | AdminFacility 레거시 필드 | useAdminFacilities.ts | **P2** | 타입 혼선 | 낮음 | 타입 정리 |
| C6 | 리서치 문서 오류 수정 | research_superadmin_integrated_control.md | **P2** | 문서 신뢰도 | 낮음 | 문서 |
| D1 | lib/queries.ts 분리 | lib/queries.ts (2,046줄) | **P3** | 유지보수성 | 높음 | 구조 |
| D2 | useAdminFacilities vs superAdmin.ts 중복 정리 | lib/api/superAdmin.ts | **P3** | API 경로 이중화 | 중간 | 구조 |

---

## 3. P0: 즉시 처리 (Blocker)

### A1. Edge Function approve-partner 재배포

**상태:** 코드 완료, Supabase 서버에 미반영

**배경:**
- `supabase/functions/approve-partner/index.ts` — JWT 검증, `is_super_admin()` 확인, 원자적 트랜잭션, Resend 이메일, 인앱 알림, system_logs 기록
- 최근 수정사항이 배포되지 않아 파트너 승인 버튼 클릭 시 오류 발생 가능

**실행 방법:**
```
Supabase Dashboard → Edge Functions → approve-partner → Deploy
또는:
supabase functions deploy approve-partner --project-ref <PROJECT_REF>
```

**환경변수 확인 필요:**
```
RESEND_API_KEY  — 미설정 시 이메일 발송 skip (경고만, 기능은 작동)
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

**검증:**
1. 슈퍼관리자 로그인 → 파트너 관리 탭 → 대기 중인 신청 1건 선택
2. "승인" 클릭 → confirmAsync 표시 → 확인
3. `partner_inquiries.status` = 'approved' 변경 확인
4. `partners` 테이블 신규 레코드 생성 확인
5. `user_notifications` 알림 생성 확인
6. 신청자 이메일 수신 확인 (RESEND_API_KEY 설정 시)
7. `system_logs` 감사 기록 확인

---

## 4. P1: 이번 주 (고위험 코드 이슈)

### B1. console.error 제거 — 4건

**영향:** 프로덕션에서 개발 로그 노출 (CLAUDE.md 규칙 위반)

#### B1-1. hooks/useAdminFacilities.ts

| 위치 | 현재 코드 | 조치 |
|------|-----------|------|
| line 53 | `console.error('Search facilities failed:', error)` | 삭제 (setLoading(false) finally에서 처리) |
| line 74 | `console.error('Update manager failed:', error)` | 삭제 (toast.error로 대체됨) |

**주의:** line 74 아래 `const message = error instanceof Error ? error.message : '알 수 없는 오류'` → `toast.error('업데이트 실패: ' + message)` 이미 존재함. console.error만 삭제.

#### B1-2. hooks/useFinancials.ts

| 위치 | 현재 코드 | 조치 |
|------|-----------|------|
| line 40 | `console.error('Failed to fetch subscriptions:', err)` | 삭제 |
| line 66 | `console.error('Failed to fetch revenue:', err)` | 삭제 |

**주의:** 두 함수 모두 에러 시 `setLoading(false)`만 처리하고 UI 피드백 없음. console.error 삭제 후 사용자에게 알릴 수단 없음 → 삭제만 할지, toast.error 추가할지 결정 필요.
- 권장: `toast.error('구독 데이터 로딩에 실패했습니다.')` / `toast.error('매출 데이터 로딩에 실패했습니다.')` 추가

**실행 순서:**
1. `hooks/useAdminFacilities.ts` 수정 (console.error 2건 삭제)
2. `hooks/useFinancials.ts` 수정 (console.error 2건 삭제 + toast.error 추가)
3. 빌드 검증: `npm run build`

---

### B2. system_settings RLS 검증

**배경:**
`hooks/useSystemSettings.ts`는 anon client (`supabase`)로 `system_settings` 테이블을 읽음.
`RevenueManagement`가 이 훅으로 수수료율 로드 → anon 읽기 실패 시 `getNumber('commission_rate', 10)` → 기본값 10% 사용.

**확인 방법 (Supabase SQL Editor):**
```sql
-- system_settings 테이블 RLS 정책 확인
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'system_settings';

-- anon으로 직접 조회 테스트
SELECT key, value FROM system_settings WHERE key = 'commission_rate';
```

**가능한 시나리오:**

| 시나리오 | 결과 | 조치 |
|---------|------|------|
| anon SELECT 허용 | 정상 작동 | 조치 불필요 |
| anon SELECT 거부 | commission_rate = 10% 기본값 사용 (silent fail) | useSystemSettings → auth client 변경 또는 RevenueManagement에서 직접 auth client로 로드 |

**권장 조치 (anon 거부인 경우):**
`RevenueManagement`에서 `useSystemSettings` 대신 `useSuperAdminClient()`로 직접 로드:
```ts
// SystemSettings.tsx 패턴과 동일하게:
client.from('system_settings')
  .select('key, value')
  .eq('key', 'commission_rate')
  .single()
```

---

## 5. P2: 코드 품질 정리

### C1. 데드코드 삭제 — lib/api/superAdmin.ts

**확인된 미사용 함수 (grep 결과: 어떤 컴포넌트도 import 안 함):**

| 함수 | 대상 테이블 | 삭제 이유 |
|------|-----------|---------|
| `fetchNotices(client)` | `notices` (레거시) | `platform_notices` 전환 완료, 미사용 |
| `createNotice(notice, client)` | `notices` (레거시) | 동일 |
| `deleteNotice(id, client)` | `notices` (레거시) | 동일 |
| `fetchAllFacilities(client)` | `facilities` | `useAdminFacilities.ts`가 직접 query, 미사용 |
| `searchFacilities(query, client)` | `facilities` | 동일 |

**삭제 전 최종 확인 (실행):**
```bash
grep -r "fetchNotices\|createNotice\|deleteNotice\|fetchAllFacilities\|searchFacilities" \
  --include="*.ts" --include="*.tsx" \
  --exclude-dir=node_modules .
```
`lib/api/superAdmin.ts` 자체와 `lib/queries.ts`(별도 동명 함수) 외 결과 없으면 삭제 안전.

**삭제 범위:**
- `lib/api/superAdmin.ts`: line 62–82 (`fetchAllFacilities`, `searchFacilities`)
- `lib/api/superAdmin.ts`: line 191–217 (`fetchNotices`, `createNotice`, `deleteNotice`)
- `Notice` import가 사용되지 않게 되면 `import { Notice, ... }` 에서 `Notice` 제거

**예상 절감:** 약 55줄 → 260줄 → 205줄

---

### C2. Lead 인터페이스 이전

**현재:**
```ts
// components/SuperAdmin/AdminLeadsView.tsx:7 (로컬 정의)
interface Lead {
  id: string; created_at: string; contact_name: string;
  contact_phone: string; phone_number?: string; category: string;
  urgency?: string; scale?: string;
  status: 'new' | 'in_progress' | 'contacted' | 'closed';
  context_data?: Record<string, unknown>; priorities?: string[];
}
```

**목표:** `types/db.ts`로 이전 후 `AdminLeadsView.tsx`에서 import

**실행 순서:**
1. `types/db.ts` 끝에 `Lead` 인터페이스 추가 (export)
2. `AdminLeadsView.tsx`에서 로컬 정의 삭제
3. `import { Lead } from '@/types/db'` 추가
4. `lib/queries.ts`의 `LeadInput` 인터페이스(line 583)와 중복 여부 확인 — 별도 목적이면 공존 유지

---

### C3. NotificationCenter.tsx 분리 (344줄 → 300줄 이하)

**현재 구조:**
```
NotificationCenter.tsx (344줄)
  ├─ NotificationModal (인라인 컴포넌트 — line 48~300)
  └─ NotificationCenter (export — line 303~344)
```

**목표 구조:**
```
components/NotificationModal.tsx (신규 — 인라인 컴포넌트 추출)
  └─ export const NotificationModal: React.FC<...>

components/NotificationCenter.tsx (축소 — ~80줄)
  └─ import { NotificationModal } from './NotificationModal'
  └─ export const NotificationCenter: React.FC
```

**NotificationModal Props 계약:**
```ts
interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: UserNotification[];
  unreadCount: number;
  isLoading: boolean;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (id: string) => void;
}
```

**실행 순서:**
1. `NotificationCenter.tsx` 읽기 → `NotificationModal` 인라인 컴포넌트 경계 확인
2. `components/NotificationModal.tsx` 파일 생성 (추출)
3. `NotificationCenter.tsx`에서 인라인 삭제 → import 추가
4. 빌드 검증

---

### C4. SideMenuDrawer 분리

> **[결정: 스킵] — 2026-03-06**

**스킵 이유 (검토 근거):**

| 판단 기준 | 분석 결과 |
|----------|----------|
| 규칙 위반 여부 | `SuperAdminDashboard.tsx` 232줄 — 300줄 원칙 **위반 없음** |
| 재사용 가능성 | `SideMenuDrawer`는 `SuperAdminDashboard`에서만 1회 사용. 외부 참조 **0곳** |
| 분리 실익 | 분리 후 Dashboard 232 → ~160줄로 감소하지만, **75줄짜리 전용 파일 신규 생성** |
| 리스크 | lucide-react 아이콘 import 이전 시 누락 위험, 득보다 실 |
| CLAUDE.md 원칙 | "하나의 작업에 필요한 최소 복잡도" — 단일 사용처 컴포넌트 분리는 과도한 추상화 |

**결론:** C3(`NotificationCenter` 344줄 초과)과 달리, C4는 **300줄 규칙 위반이 없고 단일 사용처**이므로 분리를 생략. 향후 `SideMenuDrawer`를 다른 관리자 뷰에서 재사용하게 되는 시점에 재검토.

---

**[원래 계획 (보존)]**

**현재:**
`SuperAdminDashboard.tsx` 내 인라인 컴포넌트 (231줄 중 일부)

**목표:**
```
components/SuperAdmin/SideMenuDrawer.tsx (신규)
  └─ export const SideMenuDrawer: React.FC<SideMenuDrawerProps>

components/SuperAdmin/SuperAdminDashboard.tsx (축소)
  └─ import { SideMenuDrawer } from './SideMenuDrawer'
```

**SideMenuDrawer Props 계약:**
```ts
interface SideMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}
```

**실행 순서 (재개 시):**
1. `SuperAdminDashboard.tsx` 전체 읽기 → SideMenuDrawer 인라인 경계 확인
2. `SideMenuDrawer.tsx` 신규 파일 생성
3. `SuperAdminDashboard.tsx` 업데이트
4. 빌드 검증

---

### C5. AdminFacility 레거시 필드 정리

**현재 (`hooks/useAdminFacilities.ts:6`):**
```ts
export interface AdminFacility {
  id: string; name: string; address: string;
  category?: string; type?: string;
  user_id?: string;         // v4 스키마 실제 컬럼
  manager_id?: string;      // 레거시 — 미사용
  owner_user_id?: string;   // 레거시 — 미사용
  images?: string[] | null; phone?: string | null;
  description?: string | null; package_count?: number;
}
```

**확인 후 조치:**
```bash
# manager_id, owner_user_id 참조 여부 확인
grep -r "manager_id\|owner_user_id" \
  --include="*.ts" --include="*.tsx" \
  --exclude-dir=node_modules .
```
- 참조 없으면: 두 필드 삭제
- `FacilityManagement.tsx`에서 참조하면: 실제 사용 용도 확인 후 결정

---

### C6. 리서치 문서 오류 수정

**오류 내용:**
`Section 10-11`: "ContractMonitoring은 useSuperAdminClient() 대신 client prop 직접 수신 — 일관성 위배"

**실제:**
`ContractMonitoring.tsx:13`: `const client = useSuperAdminClient();` → Context에서 정상 수신 후 hook에 전달.
일관성 문제 없음. 해당 항목 삭제 필요.

---

## 6. P3: 장기 구조 개선

### D1. lib/queries.ts 분리 (2,046줄)

**현재:** 하나의 파일에 모든 쿼리 혼재

**목표 구조:**
```
lib/queries/
  ├─ facilities.ts     — searchFacilities, searchFacilitiesV2, getFacilityDetails
  ├─ users.ts          — getUserRole, getUserProfile
  ├─ reservations.ts   — createReservation, updateReservation
  ├─ consultations.ts  — createConsultation, getAllLeads
  ├─ reviews.ts        — getReviews, createReview
  └─ index.ts          — re-export (하위호환 유지)
```

**의존성 분석 필요:**
- `lib/queries.ts`를 import하는 파일 전체 목록
- 각 함수별 사용 컴포넌트 맵핑
- re-export `index.ts`로 하위호환 보장 후 점진적 직접 import 전환

**리스크:** 높음 — 2,046줄 파일, 광범위한 의존성. 충분한 분석 없이 진행 금지.

---

### D2. useAdminFacilities vs superAdmin.ts 쿼리 경로 통합

**현재 이중화:**
- `lib/api/superAdmin.ts`: `fetchAllFacilities()`, `searchFacilities()` — 미사용 데드코드 (C1에서 삭제 예정)
- `hooks/useAdminFacilities.ts`: `search()` — `facilities` 직접 query

**C1 완료 후 자연 해소.** D2는 C1 완료 시 별도 작업 불필요.

---

### D3. useSystemSettings anon → auth 고려

**현재:**
`useSystemSettings.ts`가 anon client 사용 → B2 검증 결과에 따라 결정.

**anon 허용이 확인된 경우:** 현행 유지
**anon 거부인 경우:** B2에서 즉시 수정. D3는 B2 포함.

---

## 7. 실행 순서 및 의존성 맵

### 의존성 그래프

```
A1 (Edge Function)
  └─ 독립 실행 가능 (수동 작업)

B1 (console.error 제거)
  └─ 독립 실행 가능

B2 (RLS 검증)
  └─ 검증 결과에 따라 D3 포함 또는 스킵

C1 (데드코드 삭제)
  └─ 독립 실행 가능
  └─ D2 자동 해소

C2 (Lead 타입 이전)
  └─ 독립 실행 가능

C3 (NotificationModal 분리)
  └─ 독립 실행 가능

C4 (SideMenuDrawer 분리)
  └─ 독립 실행 가능

C5 (레거시 필드 삭제)
  └─ 독립 실행 가능
  └─ FacilityManagement.tsx 참조 없음 확인 후 실행

C6 (리서치 문서 수정)
  └─ 독립 실행 가능 (즉시)

D1 (queries.ts 분리)
  └─ B1, C1, C2 완료 후 실행 권장
  └─ 단독 진행 시 충분한 의존성 분석 필수
```

### 권장 실행 배치

| 배치 | 작업 | 병렬 가능 | 예상 범위 |
|------|------|---------|---------|
| 1차 | A1 (수동), C6 (문서 수정) | 병렬 | 즉시 |
| 2차 | B1 (console.error 4건), C1 (데드코드 5함수), C5 (레거시 필드) | 병렬 | 파일 3개 동시 수정 가능 |
| 3차 | B2 (RLS 검증) | 단독 | 검증 결과 확인 후 결정 |
| 4차 | C2 (Lead 타입), C3 (NotificationModal 분리), C4 (SideMenuDrawer 분리) | 병렬 가능하나 각 파일 완성 후 빌드 검증 권장 |
| 5차 | D1 (queries.ts 분리) | 단독 | 별도 세션 |

---

## 8. 리스크 분석

### 고위험

| 리스크 | 발생 조건 | 영향 | 대응책 |
|--------|---------|------|--------|
| Edge Function 트랜잭션 실패 | Supabase DB 연결 불안정 | 파트너 승인 반쪽 처리 | 함수 원자성 확인, 실패 시 수동 롤백 SQL 준비 |
| queries.ts 분리 중 import 누락 | re-export 누락 | 런타임 undefined 에러 | index.ts re-export 패턴 + 빌드 검증 필수 |
| system_settings anon 거부 | RLS 정책 강화 시 | 수수료율 0% 또는 기본값 적용 | B2 검증 선행 |

### 중위험

| 리스크 | 발생 조건 | 영향 | 대응책 |
|--------|---------|------|--------|
| NotificationModal 분리 시 portal 동작 변화 | createPortal + backdrop 관련 | 모달 z-index/overflow 깨짐 | 분리 후 실기기 + 브라우저 렌더링 확인 |
| SideMenuDrawer props 계약 불일치 | 인라인 상태 읽기 방식과 차이 | 서랍 메뉴 열림/닫힘 동작 불능 | 분리 전 인라인 코드 정확히 읽어 props 확정 |

### 저위험

| 리스크 | 발생 조건 | 영향 | 대응책 |
|--------|---------|------|--------|
| console.error 삭제 후 디버깅 어려움 | 운영 중 쿼리 오류 시 | 오류 원인 파악 난이도 증가 | toast.error UI 피드백으로 대체 |
| 데드코드 삭제 후 Notice import 오류 | types/db.ts `Notice` 타입 다른 곳에서 사용 시 | 빌드 에러 | 삭제 전 grep으로 `Notice` 타입 사용처 전체 확인 |

---

## 9. 검증 기준

### 각 작업 완료 기준

| 작업 | 완료 기준 |
|------|---------|
| A1 | 슈퍼관리자에서 파트너 승인 E2E 성공, partner_inquiries.status='approved', partners 레코드 생성, user_notifications 생성 |
| B1 | 빌드 성공 + 브라우저 콘솔에 관련 console.error 미출력 |
| B2 | SQL로 anon/auth 각각 system_settings SELECT 테스트, 결과 문서화 |
| C1 | 빌드 성공 + 삭제된 함수 이름 grep 결과 0건 |
| C2 | 빌드 성공 + `AdminLeadsView.tsx`에 로컬 `interface Lead` 미존재 |
| C3 | 빌드 성공 + `NotificationCenter.tsx` 300줄 이하 + 알림 모달 정상 동작 |
| C4 | 빌드 성공 + `SuperAdminDashboard.tsx` 인라인 SideMenuDrawer 미존재 + 서랍 메뉴 정상 동작 |
| C5 | 빌드 성공 + `manager_id`, `owner_user_id` 필드 삭제 + grep 참조 없음 확인 |
| C6 | 리서치 문서 Section 10-11 수정 완료 |

### 빌드 검증 명령
```bash
npm run build
# TypeScript 에러 0건 + 번들 생성 성공
```

### 파트너 승인 E2E 검증 SQL
```sql
-- 1. 승인 후 상태 확인
SELECT id, company_name, status FROM partner_inquiries WHERE status = 'approved' ORDER BY created_at DESC LIMIT 5;

-- 2. 파트너 생성 확인
SELECT id, name, company_name, status FROM partners ORDER BY created_at DESC LIMIT 5;

-- 3. 알림 생성 확인
SELECT id, user_id, title, type, created_at FROM user_notifications ORDER BY created_at DESC LIMIT 5;

-- 4. 감사 로그 확인
SELECT action, resource_type, resource_id, created_at FROM system_logs ORDER BY created_at DESC LIMIT 5;
```

---

## 10. 리서치 문서 오류 수정 사항

리서치 문서 (`research_superadmin_integrated_control.md`) Section 10-11 전체 삭제 필요.

**삭제 대상:**
```
### 10-11. ContractMonitoring — client prop vs Context
- ContractMonitoring은 useSuperAdminClient() 대신 client: SupabaseClient prop 직접 수신
- 다른 13개 탭은 모두 useSuperAdminClient() 사용
- 일관성 위배 — P2 통일 대상
```

**근거:**
`ContractMonitoring.tsx:10–14` 실제 코드:
```ts
import { useSuperAdminClient } from './SuperAdminGuard';

export const ContractMonitoring: React.FC = () => {
    const client = useSuperAdminClient();  // Context에서 정상 수신
    const { ... } = useContractMonitoring(client);  // hook에 전달
```
→ `useSuperAdminClient()` 사용 중. 일관성 문제 없음. 리서치 오류.

---

## 부록: 작업별 체크리스트

### P1 작업 체크리스트 (B1)

- [ ] `hooks/useAdminFacilities.ts` Read
- [ ] line 53 `console.error` 삭제
- [ ] line 74 `console.error` 삭제 (toast.error 이미 존재 확인)
- [ ] `hooks/useFinancials.ts` Read
- [ ] line 40 `console.error` 삭제 + `toast.error` 추가
- [ ] line 66 `console.error` 삭제 + `toast.error` 추가
- [ ] `npm run build` 성공

### P2 작업 체크리스트 (C1)

- [ ] `grep fetchNotices createNotice deleteNotice fetchAllFacilities searchFacilities` 실행 → superAdmin.ts 외 0건 확인
- [ ] `Notice` 타입 사용처 확인
- [ ] `lib/api/superAdmin.ts` Read
- [ ] 5개 함수 삭제 (line 62–82, 191–217)
- [ ] 사용되지 않는 import 정리
- [ ] `npm run build` 성공

### P2 작업 체크리스트 (C2)

- [ ] `AdminLeadsView.tsx` Read
- [ ] `types/db.ts` Read
- [ ] `Lead` 인터페이스를 `types/db.ts`에 추가
- [ ] `AdminLeadsView.tsx` 로컬 정의 삭제 + import 추가
- [ ] `lib/queries.ts:583` `LeadInput`과 충돌 없음 확인
- [ ] `npm run build` 성공

### P2 작업 체크리스트 (C3 — NotificationModal 분리)

- [ ] `components/NotificationCenter.tsx` 전체 Read
- [ ] NotificationModal 인라인 컴포넌트 경계 확인 (line 48~?)
- [ ] createPortal 사용 여부 확인 (분리 후 portal 대상 유지 필요)
- [ ] Props 인터페이스 확정
- [ ] `components/NotificationModal.tsx` 신규 생성
- [ ] `NotificationCenter.tsx` 인라인 삭제 + import 추가
- [ ] `npm run build` 성공
- [ ] 브라우저에서 알림 모달 열기/닫기 동작 확인

### P2 작업 체크리스트 (C4 — SideMenuDrawer 분리)

- [ ] `components/SuperAdmin/SuperAdminDashboard.tsx` 전체 Read
- [ ] SideMenuDrawer 인라인 컴포넌트 경계 확인
- [ ] 사용하는 상태/콜백 목록 정리 → Props 계약 확정
- [ ] `components/SuperAdmin/SideMenuDrawer.tsx` 신규 생성
- [ ] `SuperAdminDashboard.tsx` 업데이트 + import 추가
- [ ] `npm run build` 성공
- [ ] 서랍 메뉴 열기/닫기 + 탭 전환 동작 확인
