# 슈퍼관리자 버튼별 기능 진입점 흐름 검증 리포트

**검증일**: 2026-03-05
**검증 방식**: 버튼 onClick → 핸들러 → API 함수 → DB 테이블 전수 추적

---

## 1. 글로벌 네비게이션

### 1-1. 상단 탭 버튼 (4개)

| 버튼 | 클릭 시 | 진입 컴포넌트 |
|---|---|---|
| 통합 관제 | `setActiveTab('monitoring')` | `ContractMonitoring` |
| 파트너 관리 | `setActiveTab('admissions')` | `PartnerAdmissions` + `PartnerManagement` |
| 매출 분석 | `setActiveTab('revenue')` | `RevenueManagement` |
| 상담 관리 | `setActiveTab('leads')` | `AdminLeadsView` |

### 1-2. 드로어 메뉴 버튼 (8개)

| 버튼 | tabId | 진입 컴포넌트 |
|---|---|---|
| 상조 파트너 관리 | `admissions` | PartnerAdmissions + PartnerManagement |
| 실시간 통합 관제 | `monitoring` | ContractMonitoring |
| 시설 통합 관리 | `facilities` | FacilityManagement |
| 구독 현황 | `subs` | SubscriptionManager |
| 회원/권한 관리 | `users` | UserManagement |
| 공지사항 관리 | `notices` | NoticeManagement |
| 시스템 활동 로그 | `logs` | AdminLogsView |
| 소통 센터 | `communication` | AdminCommunication |
| 관리자 설정 | `admin_settings` | AdminSettings |
| 환경 설정 | `system_settings` | SystemSettings |

### 1-3. 헤더 버튼

| 버튼 | 동작 |
|---|---|
| 나가기 (LogOut) | `onBack?.()` — 상위 컴포넌트에 위임, 라우팅 결정은 부모 담당 |
| 알림 (NotificationCenter) | 별도 컴포넌트 독립 동작 |

---

## 2. 통합 관제 (ContractMonitoring)

**데이터 초기 로드**: `useContractMonitoring(client)`
- `sangjo_contracts` 전체 조회
- `ai_consultations` status IN (AGENT_REQUESTED, AGENT_CONNECTED) 필터

**Realtime 구독**: `sangjo_contracts`, `ai_consultations` postgres_changes 감시

### 버튼 흐름

#### [메시지 버튼] (MessageSquare 아이콘)
```
onClick → toast.info('메시지 기능은 준비 중입니다.')
```
**상태**: 미구현 (UI만 존재)

#### [관제/개입 버튼] (ChevronRight 아이콘)
```
item.type === 'contract'
  → toast.info(`계약 ${item.contract_number} 관제 상세 기능은 준비 중`)

item.type === 'ai'
  → handleJoinChat(item)
    → consultation.status === AGENT_CONNECTED?
        → toast.warning('이미 연결됨') → 종료
    → aiConsultationService.updateStatus(
          client,
          conversation_id,
          AiConsultationStatus.AGENT_CONNECTED
        )
        → ai_consultations 테이블 status 업데이트
    → setAiConsultations 낙관적 업데이트
    → setJoinedConversationId 저장
    → toast.success('개입 성공')
    → 실패 시: PGRST116 → '다른 관리자 선점' / 그 외 에러 toast
```

**계약(contract) 관제 버튼**: 미구현
**AI 개입 버튼**: 구현 완료, 중복 개입 방지 로직 있음

---

## 3. 파트너 관리 (PartnerAdmissions + PartnerManagement)

### 3-1. 신규 입점 신청 (PartnerAdmissions)

**데이터**: `usePartnerInquiries({ status: 'pending', client })` → `partner_inquiries` WHERE status='pending'

#### [승인 버튼]
```
handleApprove(inquiry)
  → confirmModal.open({ title: '입점 승인 확인', message: ... })
  → [확인 클릭 시]
    → approvePartner({ inquiryId: inquiry.id, action: 'approve' })
      → client.functions.invoke('approve-partner', { body: { inquiryId, action: 'approve' } })
        [Edge Function: approve-partner]
        1. Authorization 헤더 검증
        2. JWT 검증 (supabaseAuth.auth.getUser)
        3. DB 서버 재검증 (profiles.role = 'super_admin')
        4. Zod 스키마 검증
        5. partner_inquiries 조회
        6. partner_inquiries.status = 'approved' 업데이트
        7. facilities 테이블 신규 생성
        8. partners 테이블 신규 생성
        9. profiles.role = 'facility_admin' 또는 'sangjo_admin' 변경
        10. 동일 company_name 중복 pending 자동 처리
        11. audit_logs INSERT (action: 'APPROVE_PARTNER')
        12. 승인 이메일 발송 (Resend)
        13. user_notifications INSERT
      → toast.success('승인되었습니다.')
      → refetch()
    → 실패 시: toast.error(error.message)
```

**confirm dialog**: ✅ ConfirmModal
**audit_log**: ✅ APPROVE_PARTNER
**중복 클릭 방지**: ✅ confirmModal 모달 닫힘 전까지 재진입 불가

#### [거절 버튼]
```
onClick → setRejectTarget({ id, name }) + setRejectReason('')
  → 거절 사유 입력 모달 표시

[거절 확인 버튼]
handleRejectSubmit()
  → isRejecting 체크 (중복 방지) ✅
  → approvePartner({ inquiryId, action: 'reject', rejectionReason })
      [Edge Function: approve-partner]
      1~4. 동일 검증
      5. partner_inquiries 조회
      6. 동일 company_name 모든 pending → status='rejected' 일괄 처리
      7. audit_logs INSERT (action: 'REJECT_PARTNER')
      8. 거절 이메일 발송 (Resend)
  → toast.success('거절되었습니다.')
  → setRejectTarget(null), setRejectReason('')
  → refetch()
  → 실패 시: toast.error(error.message)
```

**confirm dialog**: ✅ 별도 거절 사유 입력 모달
**isRejecting**: ✅ 중복 제출 방지

#### [새로고침 인디케이터] (초록/노란 dot)
```
onClick → refetch() (React Query 수동 refetch)
```

---

### 3-2. 기존 파트너 관리 (PartnerManagement)

**데이터**: `getPartners(client)` → `partners` 테이블 전체

#### [서비스 일시정지 버튼] (approved 상태일 때)
```
handleStatusChange(partner.id, 'suspended')
  → confirmAsync('상태를 "일시정지" 하시겠습니까?') ✅
  → [확인 시]
    → client.auth.getUser() — 실제 admin UUID 획득
    → updatePartnerStatus(id, 'suspended', undefined, client)
        → partners 테이블 UPDATE { status: 'suspended' }
    → toast.success('상태가 업데이트되었습니다.')
    → loadPartners() 재조회
```

#### [서비스 재개 버튼] (suspended 상태일 때)
```
handleStatusChange(partner.id, 'approved')
  → confirmAsync('상태를 "서비스 재개" 하시겠습니까?') ✅
  → client.auth.getUser() — admin UUID
  → updatePartnerStatus(id, 'approved', user.id, client)
      → partners 테이블 UPDATE {
            status: 'approved',
            approved_at: now(),
            approved_by: adminUserId
          }
  → toast.success
  → loadPartners()
```

#### [상세보기 버튼] (ExternalLink 아이콘)
```
onClick → setSelectedPartner(partner) → PartnerDetailModal 렌더링
```

#### PartnerDetailModal 내 버튼들

```
[서비스 일시정지]
  → onClose() 먼저 실행
  → onStatusChange(partner.id, 'suspended')
      → PartnerManagement.handleStatusChange (confirmAsync 포함) ✅

[서비스 재개]
  → onClose() 먼저 실행
  → onStatusChange(partner.id, 'approved')
      → PartnerManagement.handleStatusChange (confirmAsync 포함) ✅

[닫기]
  → onClose() → setSelectedPartner(null)
```

**이슈 [MEDIUM]**: pending 상태에서 PartnerDetailModal 내 "신규 입점 신청에서 처리" 안내만 표시됨. 모달에서 직접 승인/거절 불가 — 의도된 UX이나 혼란 가능.

---

## 4. 매출 분석 (RevenueManagement)

**데이터**: `useRevenue()` → `getAuthClient(session, { strict: true })` → `fetchPayments(client)`
- `subscription_payments` 테이블 + `admin_subscriptions_with_facility` 뷰 JOIN

**이슈 [MEDIUM]**: `useSuperAdminClient()` 아닌 자체 세션으로 별도 client 생성 (Guard 패턴 우회)

#### [매출 내역 / 정산 현황 탭 전환]
```
onClick → setViewType('total' | 'partner') — 로컬 상태 변경, 네트워크 호출 없음
```

#### [리포트 다운로드 버튼]
```
onClick → toast.info('리포트 다운로드 기능은 준비 중입니다.')
```
**상태**: 미구현

---

## 5. 상담 관리 / AI Leads (AdminLeadsView)

**데이터**: `getAllLeads(client)` → `leads` 테이블 전체

**이슈 [LOW]**: `lib/api/superAdmin.ts`에도 `fetchLeads`가 있어 `consultations` 테이블을 조회하는 중복 함수 존재. `AdminLeadsView`는 `leads` 테이블을 사용하는 `getAllLeads`를 사용 중. 두 API 함수의 조회 테이블이 다름.

| 함수 | 위치 | 조회 테이블 |
|---|---|---|
| `getAllLeads` | `lib/queries.ts:633` | `leads` |
| `fetchLeads` | `lib/api/superAdmin.ts:219` | `consultations` |

**`fetchLeads`는 현재 사용처 없음** — dead code 가능성 있음.

#### [새로고침 버튼]
```
onClick → loadLeads()
  → getAllLeads(client) → leads 테이블 재조회
```

---

## 6. 구독 현황 (SubscriptionManager)

**데이터**: `useSubscriptions()` → `getAuthClient(session)` → `fetchSubscriptions(client)`
- `admin_subscriptions_with_facility` 뷰 + `subscription_plans` JOIN

**이슈 [MEDIUM]**: `useSuperAdminClient()` 아닌 자체 세션으로 client 생성

#### [상태 필터 카드 버튼] (전체/활성/대기만료)
```
onClick → setStatusFilter('all' | 'active' | 'inactive') — 로컬 필터
```

#### [관리하기 버튼]
```
onClick → onManage(fac.facility_name)
  → SuperAdminDashboard:
      setFacilitySearchTerm(name)
      setActiveTab('facilities')
  → FacilityManagement 탭으로 이동 + 해당 시설명으로 검색 자동 실행
```

#### [재결제일 클릭]
```
onClick → handleUpdateBillingDate(facilityId, current)
  → isUpdating 체크 (중복 방지) ✅
  → promptAsync('새로운 재결제 예정일을 입력하세요', ...) — 입력 모달
  → [입력 완료 시]
    → updateSubscriptionBillingDate(facilityId, isoDate, client)
        → facility_subscriptions 테이블 UPDATE { next_billing_date, updated_at }
        → UUID/bigint 자동 판별 (isUUID 정규식)
    → toast.success
    → 실패 시: toast.error('날짜 형식 오류 또는 업데이트 실패')
```

---

## 7. 시설 통합 관리 (FacilityManagement)

**데이터**: `useAllFacilities()` → `searchFacilities(query, page)` → `facilities` 테이블

#### [검색 버튼 / 엔터]
```
handleSearch(0)
  → searchFacilities(searchTerm, 0)
      → lib/api/superAdmin.ts:searchFacilities
      → 입력값 sanitize: query.trim().replace(/[%_\\]/g, '\\$&') ✅
      → facilities 테이블 .ilike('name', `%${sanitized}%`)
```

#### [전체보기 버튼]
```
onClick
  → setSearchTerm('')
  → search('', 0) — 빈 검색으로 전체 조회
  → onClearSearch?.() — facilitySearchTerm 초기화
```

#### [관리자 변경 버튼] (Edit2 아이콘)
```
handleStartEdit(f)
  → setEditingId(f.id)
  → setTempManagerId(f.user_id || '')
  → 인라인 select 드롭다운 표시 (facility_admin 권한 유저만 후보)
```

#### [저장 버튼] (편집 모드)
```
handleSave(facilityId)
  → finalId = tempManagerId || null
  → updateManager(facilityId, finalId)
      → updateFacilityManager(facilityId, newManagerId, client)
      → facilities 테이블 UPDATE { user_id: newManagerId }
  → setEditingId(null)
```

#### [취소 버튼] (편집 모드)
```
onClick → setEditingId(null) — 로컬 상태 초기화
```

#### [이전/다음 페이지 버튼]
```
onClick → handleSearch(page ± 1) → 페이지 이동 쿼리
```

---

## 8. 회원/권한 관리 (UserManagement)

**데이터**: `useAllUsers()` → `getAuthClient(session, { strict: true })` → `fetchAllUsers(client)` → `profiles` 테이블
**이슈 [MEDIUM]**: `useSuperAdminClient()` 대신 자체 세션 사용

#### [새로고침 버튼] (RefreshCw 아이콘)
```
onClick → refresh() → fetchAllUsers() → profiles 테이블 재조회
```

#### [권한 변경 select]
```
onChange(e)
  → confirmAsync(`${user.email}님의 권한을 ${newRole}으로 변경하시겠습니까?`) ✅
  → [확인 시]
    → updateRole(user.id, newRole)
        → updateUserRole(userId, newRole, client)
            → profiles UPDATE { role: newRole } WHERE clerk_id = userId
            → audit_logs INSERT { action: 'UPDATE_ROLE', metadata: { new_role } } ✅
        → toast.success('권한이 변경되었습니다.')
        → fetchUsers() 재조회
  → [취소 시]
    → el.value = user.role (select 값 원복) ✅
```

---

## 9. 공지사항 관리 (NoticeManagement)

**데이터**: `getPlatformNotices(undefined, client)` → `platform_notices` 또는 `notices` 테이블

#### [새 공지 작성 버튼]
```
handleCreate()
  → setEditingNotice(null)
  → setFormData({ title: '', content: '', notice_type: 'info' })
  → setIsModalOpen(true)
```

#### [모달 내 등록하기 버튼]
```
handleSubmit()
  → 제목/내용 빈값 검증 ✅
  → isSubmitting 체크 (중복 방지) ✅
  → createPlatformNotice(formData, client)
      → platform_notices 테이블 INSERT
  → toast.success
  → setIsModalOpen(false)
  → loadNotices() 재조회
```

#### [수정 버튼] (Edit3 아이콘)
```
handleEdit(notice)
  → setEditingNotice(notice)
  → setFormData({ title, content, notice_type })
  → setIsModalOpen(true)

[모달 내 수정하기 버튼]
handleSubmit()
  → isSubmitting 체크 ✅
  → updatePlatformNotice(notice.id, formData, client)
      → platform_notices 테이블 UPDATE
  → toast.success
```

#### [삭제 버튼] (Trash2 아이콘)
```
handleDelete(notice)
  → confirmAsync(`"${notice.title}" 공지를 삭제하시겠습니까?`) ✅
  → deletePlatformNotice(notice.id, client)
      → platform_notices 테이블 DELETE
  → setNotices(prev => prev.filter(n => n.id !== notice.id)) (낙관적 업데이트)
  → toast.success
```

---

## 10. 시스템 활동 로그 (AdminLogsView)

**데이터**: `fetchAuditLogs(client)` → `audit_logs` 테이블 최근 100건

#### [새로고침 버튼]
```
onClick → loadLogs()
  → fetchAuditLogs(client) → audit_logs 재조회
```

표시 내용: action 레이블, metadata.reason, user_id, resource_type, resource_id, created_at

---

## 11. 관리자 설정 (AdminSettings)

#### [정보 업데이트 버튼]
```
handleSaveProfile()
  → user.id 없으면 early return ✅
  → saving 체크 (중복 방지) ✅
  → client.from('profiles').update({ full_name, phone }).eq('clerk_id', user.id)
  → toast.success / toast.error
```

#### [비밀번호 재설정 이메일 발송 버튼]
```
handleChangePassword()
  → user email 없으면 toast.error + return ✅
  → client.auth.resetPasswordForEmail(email, { redirectTo: '/#/reset-password' })
      → Supabase Auth API 이메일 발송
  → toast.success('비밀번호 재설정 이메일이 발송되었습니다.')
```
- ✅ `supabase` anon import 제거 완료 (이번 세션 수정)

#### [알림 설정 토글]
```
onChange → toast.info('알림 설정 기능은 준비 중입니다.')
```
**상태**: 미구현 (토글 시각적 동작만)

---

## 12. 환경 설정 (SystemSettings)

#### [점검 모드 토글]
```
onChange(e)
  → checked 상태 확인
  → confirmAsync(`점검 모드를 ${label}하시겠습니까?`) ✅
  → [취소 시] e.target.checked = !checked (원복) ✅
  → [확인 시]
    → updateSystemSetting('maintenance_mode', checked, client)
        → system_settings 테이블 UPSERT { key: 'maintenance_mode', value: checked }
    → toast.success
    → 실패 시: toast.error + e.target.checked 원복 ✅
```

#### [설정 저장 버튼] (수수료율)
```
onClick
  → confirmAsync(`수수료율을 ${commission}%로 변경하시겠습니까?`) ✅
  → handleSaveSystemSettings()
    → isSaving 체크 (중복 방지) ✅
    → updateSystemSetting('commission_rate', commission, client)
        → system_settings 테이블 UPSERT { key: 'commission_rate', value: commission }
    → toast.success
```

#### [동기화 프로세스 시작 버튼]
```
onClick
  → confirmAsync('데이터베이스를 스캔하여 누락된 매출 기록을 생성하시겠습니까?') ✅
  → toast.warning('SQL 패치를 데이터베이스에서 실행해주세요.', { duration: 8000 })
```
**상태**: 실제 로직 없음 — 수동 SQL 실행 안내

---

## 13. 발견된 이슈 종합

### Dead Code (사용처 없음)

| 파일 | 이유 |
|---|---|
| `components/SuperAdmin/FacilityMappingModal.tsx` | import 없음 — 어디서도 사용되지 않음 |
| `components/SuperAdmin/SubscriptionStatus.tsx` | import 없음 — SubscriptionManager로 대체됨 |
| `lib/api/superAdmin.ts:fetchLeads()` | consultations 테이블 조회, 사용처 없음 (AdminLeadsView는 getAllLeads 사용) |

### Guard 패턴 우회 (보안 이슈 없음, 일관성 이슈)

| 컴포넌트 | 사용 패턴 |
|---|---|
| `RevenueManagement` | `useRevenue()` → 자체 `getAuthClient(session)` |
| `SubscriptionManager` | `useSubscriptions()` → 자체 `getAuthClient(session)` |
| `UserManagement` | `useAllUsers()` → 자체 `getAuthClient(session)` |

### 미구현 기능 (의도적 stub)

| 버튼 | 위치 | 처리 |
|---|---|---|
| 메시지 | ContractMonitoring | toast.info |
| 계약 관제 상세 | ContractMonitoring | toast.info |
| 리포트 다운로드 | RevenueManagement | toast.info |
| 알림 설정 | AdminSettings | toast.info |
| 매출 동기화 | SystemSettings | toast.warning + 수동 안내 |

### 데이터 조회 불일치

| 이슈 | 설명 |
|---|---|
| `AdminLeadsView` — `getAllLeads` | `leads` 테이블 조회 |
| `lib/api/superAdmin.ts:fetchLeads` | `consultations` 테이블 조회 (dead code) |
| → 두 함수가 다른 테이블 조회 | `fetchLeads` 삭제 권장 |

---

## 14. 버튼별 보안 규칙 준수 현황

| 규칙 | 준수 현황 |
|---|---|
| 비가역 액션 confirm dialog | ✅ 승인/거절/삭제/권한변경/상태변경/점검모드/수수료 모두 적용 |
| isSubmitting/isRejecting/isSaving 중복 방지 | ✅ 모든 제출 버튼 적용 |
| audit_log 기록 | ✅ 승인/거절/권한변경 기록 (일시정지/재개는 미기록) |
| URL 보안 (https 검증) | ✅ business_license_url `/^https?:\/\//i` 검증 후 링크 표시 |
| 입력 sanitize | ✅ 시설 검색, FacilityMappingModal 검색 모두 적용 |
| 전화번호 마스킹 | ✅ AdminLeadsView 010-****-5678 처리 |

---

## 15. 권장 조치

| 우선순위 | 파일 | 조치 |
|---|---|---|
| P1 | `FacilityMappingModal.tsx` | 삭제 (dead code) |
| P1 | `SubscriptionStatus.tsx` | 삭제 (SubscriptionManager로 대체됨) |
| P1 | `lib/api/superAdmin.ts:fetchLeads` | 함수 삭제 (dead code) |
| P2 | `PartnerManagement` 일시정지/재개 | audit_log 기록 추가 |
| P2 | `useRevenue`, `useSubscriptions`, `useAllUsers` | `useSuperAdminClient()` 주입 방식으로 전환 |
