# 슈퍼관리자 코드베이스 수정 계획

> 작성일: 2026-03-06
> 근거 문서: `research_superadmin_dashboard.md` (2026-03-06 코드 검증 완료본)
> 승인 전까지 코드 수정 금지

---

## 검증 방법

- 모든 컴포넌트 파일 직접 Read
- 리서치 문서와 실제 코드 1:1 대조
- 신규 이슈 5건 추가 발견 (리서치에 없던 것)

---

## 신규 발견 이슈 (리서치 이후 코드 직접 검증으로 추가)

| # | 파일 | 문제 | 심각도 |
|---|------|------|--------|
| N-1 | `hooks/useUsers.ts:27` | `updateRole`에서 actorId 미전달 → audit_logs.user_id = 'system' | HIGH |
| N-2 | `components/SuperAdmin/PartnerManagement.tsx:22` | `useEffect` client 의존성 누락 | MEDIUM |
| N-3 | `components/admin/AdminCommunication.tsx:73` | 공지 작성이 `notices` 테이블 → `NoticeManagement`는 `platform_notices` 읽기 → 실제 데이터 불일치 | HIGH |
| N-4 | `components/SuperAdmin/PartnerAdmissions.tsx` | 업종 탭 필터 dead state (UI 버튼 없음, selectedTab 항상 'all') | LOW |
| N-5 | `hooks/useUsers.ts:15,27` | fetchUsers + updateRole 각각 getAuthClient 호출 → 불필요한 이중 인증 | LOW |

---

## Phase 1 — P0: 데이터/보안 버그 (즉시 수정)

### 1-1. audit_logs 실제 관리자 ID 미기록

**심각도**: HIGH
**현상**: 슈퍼관리자가 유저 권한을 변경해도 audit_logs.user_id = 'system'으로 기록됨. 누가 변경했는지 추적 불가.

**원인 추적**:
```
UserManagement.tsx:111
  updateRole(user.id, newRole)          ← actorId 없음

hooks/useUsers.ts:28
  updateUserRole(userId, newRole, client)  ← actorId 파라미터 미전달

lib/api/superAdmin.ts:48
  user_id: actorId || 'system'          ← actorId 없으면 'system' 기록
```

**수정 범위**:
- `hooks/useUsers.ts` — `updateRole(userId, newRole)` → `updateRole(userId, newRole, actorId?: string)` 시그니처 추가, `updateUserRole` 호출 시 actorId 전달
- `components/SuperAdmin/UserManagement.tsx` — `useUser()` 훅으로 현재 관리자 ID 취득 후 `updateRole` 호출 시 전달

**변경 파일**: 2개
- `hooks/useUsers.ts`
- `components/SuperAdmin/UserManagement.tsx`

**검증**: 권한 변경 후 `audit_logs` 테이블에서 `user_id`가 실제 관리자 UUID인지 확인

---

### 1-2. PartnerManagement useEffect client 의존성 누락

**심각도**: MEDIUM
**현상**: SuperAdminGuard가 client를 재생성해도 파트너 목록이 갱신되지 않음. 세션 만료 후 재인증 시 빈 목록 유지.

**원인**:
```ts
// PartnerManagement.tsx:21-23
useEffect(() => {
    loadPartners();
}, []);  // ← client 빠짐
```

**수정**:
```ts
useEffect(() => {
    loadPartners();
}, [client]);  // client 추가
```

**변경 파일**: 1개
- `components/SuperAdmin/PartnerManagement.tsx`

**주의**: `loadPartners`가 `useCallback`으로 감싸져 있지 않으므로 client만 의존성으로 충분

---

### 1-3. AdminCommunication 공지 테이블 이원화 (데이터 불일치)

**심각도**: HIGH
**현상**: 소통 센터에서 작성한 공지가 공지사항 관리 탭에서 보이지 않음.

**원인**:
```
AdminCommunication (소통 센터 탭)
  → 공지 읽기: getNotices(client) → lib/queries.ts → notices 테이블
  → 공지 작성: createNotice(title, content, client) → lib/queries.ts → notices 테이블

NoticeManagement (공지사항 관리 탭)
  → 공지 읽기/쓰기: getPlatformNotices/createPlatformNotice → lib/sangjoQueries.ts → platform_notices 테이블

결론: 2개의 서로 다른 테이블에 공지 데이터가 분산됨
```

**수정 방향**: AdminCommunication의 공지 기능을 `platform_notices` 테이블 기준으로 통일

- `getNotices` → `getPlatformNotices(undefined, client)` (sangjoQueries)
- `createNotice` → `createPlatformNotice({ title, content, notice_type: 'info' }, client)` (sangjoQueries)
- `NoticeItem` 인터페이스 → `PlatformNotice` 타입으로 교체

**변경 파일**: 1개
- `components/admin/AdminCommunication.tsx`

**사전 확인**: `notices` 테이블에 기존 데이터가 있다면 `platform_notices`로 이전 필요 (DB 마이그레이션)

---

## Phase 2 — P1: 코드 품질 (이번 주)

### 2-1. PartnerAdmissions 업종 탭 dead state 제거

**심각도**: LOW
**현상**: `selectedTab` state와 필터 로직이 코드에 존재하지만 UI 버튼이 없어 항상 'all'. 불필요한 코드.

**수정 방향**: dead state 제거 (B안 — 코드 단순화)
- `selectedTab` state 제거
- `setSelectedTab` 제거
- filter 로직에서 탭 조건 제거 (검색어 필터만 유지)

**변경 파일**: 1개
- `components/SuperAdmin/PartnerAdmissions.tsx`

---

### 2-2. PartnerAdmissions confirm 패턴 통일

**심각도**: LOW
**현상**: `PartnerAdmissions`만 `useConfirmModal().open()` 콜백 방식 사용. 나머지 컴포넌트는 `confirmAsync()` Promise 방식 통일.

**현재 코드**:
```ts
const confirmModal = useConfirmModal();
confirmModal.open({
    title: '입점 승인 확인',
    message: `...`,
    onConfirm: async () => { ... }
});
```

**수정 후**:
```ts
if (!await confirmAsync('...')) return;
// 승인 로직
```

**변경 파일**: 1개
- `components/SuperAdmin/PartnerAdmissions.tsx`

---

### 2-3. useUsers.ts console.error 제거

**심각도**: LOW
**현상**: 프로덕션에 console.error 노출

**파일**: `hooks/useUsers.ts:19`
```ts
console.error('Failed to fetch users:', error);  // 제거
```

**수정**: 제거 또는 `toast.error`로 교체
**변경 파일**: 1개
- `hooks/useUsers.ts`

---

## Phase 3 — P2: 구조 개선 (출시 후)

### 3-1. 레거시 파일 삭제

삭제 전 반드시 `grep`으로 import 사용처 전수 확인 후 진행.

| 파일 | 대체 컴포넌트 | 상태 |
|------|-------------|------|
| `components/admin/AdminApprovals.tsx` | `PartnerAdmissions` | 삭제 가능 |
| `components/admin/AdminSubscriptions.tsx` | `SubscriptionManager` | 삭제 가능 |
| `components/SuperAdmin/SubscriptionStatus.tsx` | `SubscriptionManager` | 삭제 가능 |
| `components/SuperAdmin/FacilityMappingModal.tsx` | Edge Function 자동 처리 | 보류 (수동 매핑 기능 필요 시 재활용) |

---

### 3-2. 인라인 타입 → types/db.ts 이관

| 타입명 | 현재 위치 | 이관 후 |
|--------|----------|---------|
| `Lead` | `AdminLeadsView.tsx:7-19` | `types/db.ts` |
| `NoticeItem` | `AdminCommunication.tsx:7-12` | `PlatformNotice` 사용으로 대체 (1-3 수정 후 자동 해결) |
| `SupportInquiryItem` | `AdminCommunication.tsx:14-25` | `types/db.ts` |

---

### 3-3. NotificationCenter 300줄 초과 분리

**파일**: `components/NotificationCenter.tsx` (344줄)
**문제**: `NotificationModal` 인라인 254줄 (lines 48-301)

**수정**:
- `NotificationModal` → `components/NotificationModal.tsx` 분리
- 헬퍼 함수 (`getRelativeTime`, `TypeBadge`, `TypeIcon`) 함께 이동
- `NotificationCenter.tsx`에서 import

**변경 파일**: 2개 (기존 1개 수정 + 신규 1개 생성)

---

### 3-4. SideMenuDrawer 분리

**파일**: `components/SuperAdmin/SuperAdminDashboard.tsx`
**문제**: `SideMenuDrawer` 인라인 컴포넌트 103줄 (lines 29-103)

**수정**: `components/SuperAdmin/SideMenuDrawer.tsx` 별도 파일로 분리
**변경 파일**: 2개

---

## 잠재적 충돌 지점

| 지점 | 위험 | 대응 |
|------|------|------|
| `useAllUsers` 시그니처 변경 | 다른 곳에서 import 시 브레이킹 | 수정 전 grep 확인 |
| `AdminCommunication` 테이블 변경 | 기존 notices 테이블 데이터 유실 | 마이그레이션 or 이전 |
| 레거시 파일 삭제 | 예상치 못한 import | 삭제 전 grep 필수 |
| `PartnerAdmissions` confirmAsync 교체 | 동작 방식 변경 (콜백→Promise) | E2E 테스트로 검증 |

---

## 실행 순서

```
[Phase 1] 즉시
  1-2. PartnerManagement useEffect 1줄 수정        (영향 범위: 최소)
  1-1. useUsers actorId 전달                        (영향 범위: 소)
  1-3. AdminCommunication 테이블 통일               (영향 범위: 중, DB 확인 필요)

[Phase 2] 이번 주
  2-3. useUsers console.error 제거                  (1줄)
  2-1. PartnerAdmissions dead state 제거            (소)
  2-2. PartnerAdmissions confirmAsync 통일          (소)

[Phase 3] 출시 후
  3-1. 레거시 파일 삭제
  3-2. 타입 이관
  3-3. NotificationCenter 분리
  3-4. SideMenuDrawer 분리
```

---

## 수정 완료 기준

- [ ] Phase 1-1: audit_logs에 관리자 UUID 기록 확인
- [ ] Phase 1-2: client 재생성 시 파트너 목록 자동 갱신 확인
- [ ] Phase 1-3: 소통 센터 공지 작성 → 공지사항 관리 탭에서 표시 확인
- [ ] Phase 2: 빌드 에러 없음 (`npm run build`)
- [ ] Phase 3: 삭제 후 빌드 에러 없음
