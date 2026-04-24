# "준비 중" 기능 구현 계획서

> 작성일: 2026-03-06
> 대상: 슈퍼관리자 대시보드 내 4개 미구현 기능
> 기준 커밋: c059be8

---

## 목차

1. [현황 진단 — 왜 구현되지 않았는가](#1-현황-진단)
2. [기능별 심층 분석](#2-기능별-심층-분석)
   - [F1. 메시지 버튼 (ContractMonitoring)](#f1-메시지-버튼)
   - [F2. 계약 관제 상세 버튼 (ContractMonitoring)](#f2-계약-관제-상세-버튼)
   - [F3. 리포트 다운로드 (RevenueManagement)](#f3-리포트-다운로드)
   - [F4. 알림 설정 토글 (AdminSettings)](#f4-알림-설정-토글)
3. [우선순위 매트릭스](#3-우선순위-매트릭스)
4. [기능별 구현 전략](#4-기능별-구현-전략)
5. [DB 스키마 변경 계획](#5-db-스키마-변경-계획)
6. [실행 순서 및 의존성](#6-실행-순서-및-의존성)
7. [리스크 분석](#7-리스크-분석)
8. [검증 기준](#8-검증-기준)

---

## Status Update (2026-04-24)

### 구현 상태 기준

- `구현 완료 / 검증 필요`
- `구현 완료 / 자동화 미흡`
- `미구현`

### 이번 문서 기준 정정

- `F1. 메시지 버튼 (ContractMonitoring)`:
  `구현 완료 / 검증 필요`
  `ContractMonitoring`에서 `onNavigateCommunication` prop을 받아 커뮤니케이션 탭으로 이동함.
- `F2. 계약 관제 상세 버튼 (ContractMonitoring)`:
  `구현 완료 / 검증 필요`
  `ContractDetailDrawer`가 연결되어 있고 관리자 메모 저장까지 동작함.
- `F3. 리포트 다운로드 (RevenueManagement)`:
  `구현 완료 / 검증 필요`
  CSV 다운로드 로직이 구현되어 있음.
- `F4. 알림 설정 토글 (AdminSettings)`:
  `구현 완료 / 검증 필요`
  `system_settings` 기반 토글 저장 로직이 구현되어 있음.

### 릴리스 관점에서 남은 항목

- 릴리스 블로커
  - `구현 완료 / 검증 필요` `verify-payment` 실배포 경로 재검증 및 필요 시 재배포
  - `구현 완료 / 검증 필요` 슈퍼관리자 파트너 승인 E2E
  - `구현 완료 / 검증 필요` 관리자 권한/RLS spot check
  - `구현 완료 / 검증 필요` iOS/Android 실기기 점검
- 비블로커
  - `구현 완료 / 자동화 미흡` `tests/e2e/superAdmin.joinChat.spec.ts`
  - `구현 완료 / 자동화 미흡` `tests/e2e/review-delete.spec.ts`
  - `구현 완료 / 자동화 미흡` `tests/e2e/core.flows.spec.ts` 로그인 성공 케이스 TODO
  - `미구현` `components/Partner/OperationsManagement.tsx` 더보기 액션
  - `미구현` `components/Partner/LiveConsultation.tsx` 추가 기능 버튼

## 1. 현황 진단

### 왜 구현되지 않았는가

코드베이스를 추적한 결과, 이 4개 기능은 **UI 설계 단계에서 자리(placeholder)만 잡아두고** 이후 기능 구현이 누락된 케이스다. 공통 패턴은 동일하다:

```
버튼 onClick → toast.info('...기능은 준비 중입니다.')
```

누락 원인을 기능별로 정리하면:

| 기능 | 누락 원인 |
|------|----------|
| 메시지 버튼 | 슈퍼관리자 ↔ 파트너 직접 메시지 시스템이 설계된 적 없음. `AdminCommunication`은 공지/문의 관리이지 1:1 메시지 아님 |
| 계약 관제 상세 | `sangjo_contracts` 테이블 데이터가 존재하지만, 상세 뷰/모달 컴포넌트 자체가 없음 |
| 리포트 다운로드 | `payments` 데이터는 이미 훅으로 로드됨. CSV 변환 로직이 추가되지 않은 순수 누락 |
| 알림 설정 | `user_notifications` 테이블과 `useNotifications` 훅은 있지만, **관리자 알림 수신 설정을 저장할 테이블이 없음** |

---

## 2. 기능별 심층 분석

### F1. 메시지 버튼

**위치:** `components/SuperAdmin/ContractMonitoring.tsx:136~140`

**현재 동작:**
```
각 관제 카드 우측 하단 MessageSquare 아이콘 버튼
→ onClick: toast.info('메시지 기능은 준비 중입니다.')
```

**카드 타입 2종:**
- `type === 'contract'` — `sangjo_contracts` 테이블 데이터. `sangjo_id` 필드(배정 파트너)
- `type === 'ai'` — `ai_consultations` 테이블 데이터. `facility_name`, `conversation_id` 보유

**핵심 질문: "메시지"가 무엇인가?**

선택지 A — **AdminCommunication 탭으로 이동 (최소 구현)**
- 메시지 버튼 클릭 → SideMenuDrawer를 통해 `communication` 탭 전환
- 구현 공수: 최소 (부모 컴포넌트에서 setActiveTab 콜백 전달)
- 한계: 특정 파트너 대상 필터링 없이 전체 소통 센터로 이동함

선택지 B — **대상 파트너로 필터링된 소통 탭으로 이동 (권장)**
- 클릭 시 `communication` 탭 이동 + 해당 파트너/시설명 검색어 자동 입력
- `AdminCommunication`에 `initialFilter?: string` prop 추가 필요
- 구현 공수: 소 (탭 전환 + prop 하나 추가)

선택지 C — **1:1 메시지 모달 (신규 시스템)**
- 슈퍼관리자 → 파트너로 직접 메시지 발송
- DB 신규 테이블 필요 (`admin_messages`), 파트너 수신 UI 별도 구축 필요
- 구현 공수: 대 (새 테이블, RLS, 파트너 대시보드 수신 UI까지)

**결론:** 선택지 B 권장. C는 파트너 대시보드 수신 UI가 없어 반쪽짜리가 됨.

**데이터 흐름 분석:**
- contract item → `item.sangjo_id` (상조사 ID) → 소통 센터 파트너 문의 탭 필터
- ai item → `item.facility_name` (시설명) → 소통 센터 파트너 문의 탭 필터
- `ContractMonitoring`은 `onNavigate` prop이 없음 → 부모 `SuperAdminDashboard`에서 콜백 주입 필요

---

### F2. 계약 관제 상세 버튼

**위치:** `components/SuperAdmin/ContractMonitoring.tsx:141~148`

**현재 동작:**
```
type === 'ai'  → handleJoinChat(item)  ← 이미 구현됨
type === 'contract' → toast.info('계약 관제 상세 기능은 준비 중입니다.')
```

**즉, AI 상담 개입은 구현됨. 계약(contract) 타입만 미구현.**

**`sangjo_contracts` 테이블 보유 필드 (useContractMonitoring 기준):**
```
contract_number, customer_name, sangjo_id, region, emergency_level, status, created_at
```

**"관제 상세"에서 슈퍼관리자가 할 수 있어야 하는 것:**

| 액션 | 설명 | 난이도 |
|------|------|--------|
| 상태 변경 | pending → in_progress → completed 등 | 중 |
| 긴급도 변경 | normal → urgent → critical | 중 |
| 파트너 재배정 | 다른 sangjo_id로 변경 | 고 |
| 메모 추가 | 관제 기록 텍스트 입력 | 하 |
| 히스토리 조회 | 상태 변경 이력 | 고 (audit_logs 연동) |

**구현 전략 — ContractDetailDrawer (우측 슬라이드 패널):**
- 관제 카드에서 "관제" 버튼 클릭 → 우측에서 Drawer 슬라이드
- 상단: 계약 기본 정보 (contract_number, customer_name, region, created_at)
- 중단: 긴급도/상태 변경 셀렉트 + 저장
- 하단: 메모 입력 textarea + 저장
- 저장 → `sangjo_contracts` UPDATE → Realtime으로 카드 목록 자동 갱신

**DB 현황:**
- `sangjo_contracts` 테이블은 이미 존재 (useContractMonitoring가 SELECT 중)
- UPDATE RLS 정책 확인 필요 → `20260301_fix_sangjo_contracts_select_update_rls.sql`에서 이미 처리됨
- `notes` 또는 `admin_memo` 컬럼이 스키마에 없으면 마이그레이션 추가 필요

---

### F3. 리포트 다운로드

**위치:** `components/SuperAdmin/RevenueManagement.tsx:104~109`

**현재 동작:**
```
"리포트 다운로드" 버튼 → toast.info('리포트 다운로드 기능은 준비 중입니다.')
```

**이미 로드된 데이터 (`useRevenue()` 반환값):**
```ts
payments: Payment[]   // 전체 결제 내역
totalRevenue: number  // 누적 매출 합계
```

**`payments` 필드:**
```
id, amount, paid_at, description, facility_name, status, subscription_id
```

**`settlements` (컴포넌트 내부 계산값):**
```
facility별 그룹핑: company(시설명), amount(누적결제), fee(수수료), lastPaidAt
```

**다운로드 콘텐츠 설계:**

현재 탭(`viewType`)에 따라 다른 CSV 생성:

| viewType | CSV 내용 |
|----------|---------|
| `'total'` (매출 내역) | 결제일, 시설명, 금액, 설명, 상태 |
| `'partner'` (정산 현황) | 시설명, 누적결제, 수수료수익, 마지막결제일 |

**CSV 다운로드 구현 방식:**
- 순수 프론트엔드 (서버 불필요)
- `Blob` → `URL.createObjectURL` → `<a>` 태그 클릭 시뮬레이션 → `revokeObjectURL`
- BOM(`\uFEFF`) 처리 필요 — 한글 엑셀 호환성

**파일명 포맷:**
```
memorimap_revenue_YYYYMMDD.csv  (매출 내역)
memorimap_settlement_YYYYMMDD.csv  (정산 현황)
```

**구현 공수:** 최소. DB 변경 없음. 순수 유틸 함수 1개 + 버튼 로직 교체.

---

### F4. 알림 설정 토글

**위치:** `components/SuperAdmin/AdminSettings.tsx:120~123`

**현재 동작:**
```tsx
<input type="checkbox" defaultChecked
  onChange={() => toast.info('알림 설정 기능은 준비 중입니다.')} />
```

**3종 알림 항목:**
1. 새 상담 접수 알림
2. 결제 발생 알림
3. 입점 신청 알림

**핵심 문제 — 이 설정이 무엇을 제어하는가?**

"알림"의 의미를 먼저 정의해야 한다:

**시나리오 A — 앱 내 알림 (`user_notifications` 테이블)**
- 슈퍼관리자가 로그인 시 알림 벨(NotificationCenter)에 뜨는 알림
- `user_notifications` 테이블에 INSERT 트리거가 있거나, 이벤트 발생 시 코드에서 직접 INSERT
- 토글 설정 = "이 유형의 앱 내 알림을 끈다/켠다"

**시나리오 B — 이메일 알림**
- 이벤트 발생 시 슈퍼관리자 이메일로 발송 (Resend 사용)
- 설정 = 이메일 발송 여부 제어
- Edge Function 수정 필요

**시나리오 C — 하이브리드 (A + B)**

**현실적 판단:**
- 현재 `user_notifications` 테이블 존재, `useNotifications` 훅 존재
- 이벤트 발생 시 실제로 `user_notifications`에 INSERT되고 있는지는 별도 확인 필요
- 이메일 알림(B)은 Edge Function 개입 필요 → 공수 큼

**권장 구현 (시나리오 A — 앱 내 알림 제어):**

설정 저장소: `system_settings` 테이블 (기존 인프라 활용)
```
key: 'admin_notif_consultation'  value: 'true'/'false'
key: 'admin_notif_payment'       value: 'true'/'false'
key: 'admin_notif_admission'     value: 'true'/'false'
```

- `useSystemSettings`로 로드 → `checked` 상태 초기화
- `onChange` → `updateSystemSetting(key, value, client)` 호출
- 저장 성공 → `toast.success('설정이 저장되었습니다.')`

**주의:** `useSystemSettings`는 현재 anon client 사용. 쓰기(`updateSystemSetting`)는 반드시 auth client(`useSuperAdminClient()`) 사용해야 함.

---

## 3. 우선순위 매트릭스

| 기능 | 비즈니스 가치 | 구현 공수 | 리스크 | 우선순위 |
|------|-------------|---------|--------|---------|
| **F3. 리포트 다운로드** | 중 (운영 편의) | 최소 (2h) | 없음 | **P0** |
| **F1. 메시지 버튼** | 중 (운영 UX) | 소 (3h) | 낮음 | **P1** |
| **F4. 알림 설정** | 중 (운영 제어) | 중 (4h) | 중간 (system_settings 쓰기 RLS) | **P1** |
| **F2. 계약 관제 상세** | 고 (핵심 관제 기능) | 중~대 (8h+) | 높음 (sangjo_contracts 스키마 확인 필요) | **P2** |

---

## 4. 기능별 구현 전략

### F3. 리포트 다운로드 (P0)

**수정 파일:** `components/SuperAdmin/RevenueManagement.tsx` 1개

**구현 방식:**
1. `viewType` 상태에 따라 다른 CSV 데이터 배열 생성
2. BOM 포함 CSV 문자열 조립 (한글 컬럼명 포함)
3. `Blob` → `ObjectURL` → `<a>` 다운로드 트리거 → cleanup
4. 버튼 `onClick`을 `toast.info` → 위 함수 호출로 교체

**CSV 컬럼 설계:**
```
[매출 내역]
결제일시, 시설명, 금액(원), 설명, 상태

[정산 현황]
시설명, 누적결제(원), 수수료수익(원), 마지막결제일
```

**에러 처리:**
- `payments.length === 0` → `toast.warning('다운로드할 데이터가 없습니다.')`
- 다운로드 중 에러 → `toast.error('다운로드 실패')`

---

### F1. 메시지 버튼 (P1)

**수정 파일:**
1. `components/SuperAdmin/SuperAdminDashboard.tsx` — `onNavigate` + `onFilter` 콜백을 `ContractMonitoring`에 전달
2. `components/SuperAdmin/ContractMonitoring.tsx` — props 추가, 버튼 onClick 교체
3. `components/admin/AdminCommunication.tsx` — `initialFilter?: string` prop 추가, 마운트 시 검색어 자동 입력

**흐름:**
```
관제 카드 메시지 버튼 클릭
  → ContractMonitoring: onNavigateCommunication(partnerName) 호출
  → SuperAdminDashboard: setActiveTab('communication') + setCommunicationFilter(partnerName)
  → AdminCommunication 렌더링 + initialFilter prop으로 파트너 필터링
```

**ContractMonitoring props 추가:**
```ts
interface ContractMonitoringProps {
  onNavigateCommunication?: (partnerName: string) => void;
}
```

**AdminCommunication props 추가:**
```ts
interface AdminCommunicationProps {
  initialFilter?: string;
}
```

---

### F4. 알림 설정 토글 (P1)

**수정 파일:**
1. `components/SuperAdmin/AdminSettings.tsx` — 토글 상태 관리 + 저장 로직
2. `lib/api/superAdmin.ts` — `updateSystemSetting` 이미 존재 (재사용)

**구현 방식:**
1. `useSuperAdminClient()` — 이미 AdminSettings에서 사용 중 (쓰기 권한 확보됨)
2. `useSystemSettings(['admin_notif_consultation', 'admin_notif_payment', 'admin_notif_admission'])` 로드
3. 로드 값이 없는 경우(초기 상태) → 기본값 `true`
4. 토글 변경 → `updateSystemSetting(key, newValue, client)` 즉시 저장
5. 저장 성공 → `toast.success`, 실패 → `toast.error`

**주의사항:**
- `useSystemSettings`는 anon client로 읽음 → 초기값 읽기는 OK
- 저장 시 `updateSystemSetting`은 `client: SupabaseClient` 파라미터를 받음 → `useSuperAdminClient()` 전달 필수
- 저장 중 중복 클릭 방지: 토글별 `saving` 상태 관리 필요

**알림 설정 실제 효과:**
- 현재는 시스템 이벤트(상담 접수, 결제 발생, 입점 신청) → `user_notifications` INSERT 코드가 어디에 있는지 추가 확인 필요
- 설정 저장 자체는 P1에서 완성. 실제 알림 발생 로직과의 연동은 P2에서 처리

---

### F2. 계약 관제 상세 (P2)

**신규 컴포넌트:** `components/SuperAdmin/ContractDetailDrawer.tsx`

**수정 파일:**
1. `components/SuperAdmin/ContractMonitoring.tsx` — Drawer 상태 + 선택된 contract 상태 추가
2. `hooks/useContractMonitoring.ts` — `updateContract(contractNumber, updates)` 함수 추가
3. `supabase/migrations/YYYYMMDD_add_contract_admin_memo.sql` — `admin_memo` 컬럼 추가 (없는 경우)

**ContractDetailDrawer 구성:**
```
[Drawer 우측 패널 — w-96]

상단: 계약 기본 정보
  - 계약번호, 고객명, 지역, 접수일시

중단: 상태 관리
  - 긴급도 셀렉트: normal | urgent | critical
  - 상태 셀렉트: pending | processing | resolved
  - 저장 버튼 (isSubmitting 처리)

하단: 관리자 메모
  - textarea (최대 500자)
  - 저장 버튼 (isSubmitting 처리)

비가역 액션:
  - "상담 종료" 버튼 → confirmAsync() → status = 'closed'
```

**DB 변경 확인 사항:**
1. `sangjo_contracts` 스키마 현재 컬럼 확인 → `admin_memo` 없으면 마이그레이션
2. UPDATE RLS 정책 확인 → `is_super_admin()` 기반인지 확인
3. audit_logs INSERT — 관제 상세에서 상태 변경 시 감사 기록 남기기

---

## 5. DB 스키마 변경 계획

### 변경 필요 항목

| 변경 내용 | 필요 기능 | 마이그레이션 파일 |
|----------|---------|----------------|
| `sangjo_contracts.admin_memo TEXT NULL` 컬럼 추가 | F2 계약 관제 상세 | `YYYYMMDD_add_contract_admin_memo.sql` |
| `system_settings`에 알림 설정 초기값 INSERT | F4 알림 설정 | 마이그레이션 또는 코드 기본값 처리 |

### 변경 불필요 항목

| 기능 | 이유 |
|------|------|
| F3 리포트 다운로드 | 순수 프론트엔드 — DB 변경 없음 |
| F1 메시지 버튼 | `AdminCommunication` 기존 테이블 그대로 사용 |
| F4 알림 설정 저장 | `system_settings` 테이블에 key-value로 저장 — 신규 컬럼 불필요 |

### 확인 필요 (작업 전 Supabase SQL Editor에서 직접 확인)

```sql
-- 1. sangjo_contracts 현재 컬럼 목록 확인
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'sangjo_contracts';

-- 2. system_settings RLS — anon SELECT 허용 여부
SELECT policyname, cmd, roles, qual
FROM pg_policies
WHERE tablename = 'system_settings';

-- 3. sangjo_contracts UPDATE RLS — is_super_admin() 포함 여부
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'sangjo_contracts' AND cmd = 'UPDATE';
```

---

## 6. 실행 순서 및 의존성

```
[1단계 — DB 확인 (사전 작업)]
  └─ SQL Editor: sangjo_contracts 컬럼 확인
  └─ SQL Editor: system_settings RLS 확인
  └─ SQL Editor: sangjo_contracts UPDATE RLS 확인

[2단계 — F3 리포트 다운로드]  ← 독립 작업, 의존성 없음
  └─ RevenueManagement.tsx 수정
  └─ 빌드 검증

[3단계 — F1 메시지 버튼]  ← F3 완료 후 진행
  └─ AdminCommunication.tsx — initialFilter prop 추가
  └─ ContractMonitoring.tsx — props 추가, 버튼 교체
  └─ SuperAdminDashboard.tsx — 콜백 연결
  └─ 빌드 검증

[4단계 — F4 알림 설정]  ← F1과 독립 진행 가능
  └─ AdminSettings.tsx — 토글 상태/저장 로직
  └─ 빌드 검증

[5단계 — F2 계약 관제 상세]  ← 1~4 완료 후 진행
  └─ 마이그레이션 작성 (admin_memo 컬럼 필요 시)
  └─ useContractMonitoring.ts — updateContract 함수 추가
  └─ ContractDetailDrawer.tsx 신규 생성
  └─ ContractMonitoring.tsx — Drawer 연결
  └─ 빌드 검증
```

---

## 7. 리스크 분석

| 리스크 | 가능성 | 영향 | 대응 |
|--------|--------|------|------|
| `system_settings` anon UPDATE 가능 → 보안 구멍 | 낮음 (기존 RLS 있음) | 높음 | 저장 시 반드시 auth client 사용, RLS 정책 사전 확인 |
| `sangjo_contracts` UPDATE RLS 미설정 | 중간 | 높음 | DB 확인 후 미설정이면 마이그레이션에서 정책 추가 |
| F1 메시지 버튼 — `onNavigate` 콜백 체인 누락 | 낮음 | 중간 | SuperAdminDashboard props 계약 명확히 |
| CSV 한글 깨짐 (엑셀 호환) | 중간 | 낮음 | BOM(`\uFEFF`) 앞에 반드시 붙이기 |
| F2 ContractDetailDrawer — z-index 충돌 | 낮음 | 낮음 | `z-[200]` 이상 적용 (SideMenuDrawer z-[100] 위) |
| F4 알림 설정이 실제 알림 발생과 미연동 | 높음 | 중간 | 설정 저장만 구현, 연동은 P2 별도 작업으로 분리 명시 |

---

## 8. 검증 기준

### F3 리포트 다운로드
- [ ] "매출 내역" 탭에서 다운로드 → `memorimap_revenue_YYYYMMDD.csv` 다운로드
- [ ] "정산 현황" 탭에서 다운로드 → `memorimap_settlement_YYYYMMDD.csv` 다운로드
- [ ] 엑셀에서 열었을 때 한글 깨짐 없음
- [ ] 데이터 없을 때 → toast.warning 표시, 다운로드 없음

### F1 메시지 버튼
- [ ] contract 카드 메시지 버튼 → `communication` 탭 전환
- [ ] `AdminCommunication` initialFilter에 파트너명 자동 입력
- [ ] ai 카드 메시지 버튼 → 동일하게 시설명으로 필터링

### F4 알림 설정
- [ ] 토글 켜기/끄기 → `system_settings` DB 반영 확인 (SQL Editor)
- [ ] 페이지 새로고침 후 → 이전 설정값 그대로 유지
- [ ] 저장 중 중복 클릭 시 → 첫 번째 요청만 처리
- [ ] 저장 성공 → toast.success 표시

### F2 계약 관제 상세
- [ ] "관제" 버튼 클릭 → ContractDetailDrawer 우측에서 슬라이드 오픈
- [ ] 긴급도/상태 변경 → 저장 → 관제 카드 목록 실시간 갱신
- [ ] 메모 저장 → DB 반영
- [ ] "상담 종료" → confirmAsync → 계약 종료 처리
- [ ] Drawer 외부 클릭 또는 ESC → Drawer 닫힘
- [ ] 비가역 액션에 confirm dialog 필수

---

## 부록. 작업별 파일 체크리스트

| 작업 | 수정/신규 파일 | 비고 |
|------|-------------|------|
| F3 | `components/SuperAdmin/RevenueManagement.tsx` | 수정 |
| F1 | `components/SuperAdmin/ContractMonitoring.tsx` | 수정 |
| F1 | `components/admin/AdminCommunication.tsx` | 수정 |
| F1 | `components/SuperAdmin/SuperAdminDashboard.tsx` | 수정 |
| F4 | `components/SuperAdmin/AdminSettings.tsx` | 수정 |
| F2 | `components/SuperAdmin/ContractDetailDrawer.tsx` | 신규 |
| F2 | `hooks/useContractMonitoring.ts` | 수정 |
| F2 | `supabase/migrations/YYYYMMDD_add_contract_admin_memo.sql` | 신규 (필요 시) |
