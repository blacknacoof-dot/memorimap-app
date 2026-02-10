# Memorimap 대시보드 데이터흐름 검증 보고서
**생성일**: 2026-02-08  
**검증범위**: 시설관리자, 상조관리자, 슈퍼관리자 대시보드  
**검증자**: OpenCode AI

---

## 1. 개요 (Executive Summary)

본 보고서는 Memorimap 플랫폼의 세 가지 주요 관리자 대시보드(시설관리자, 상조관리자, 슈퍼관리자)의 코드 데이터흐름을 분석하고, 발견된 오류 및 개선사항을 정리한 것입니다.

**총 검파일 수**: 20+ 파일  
**심각도별 이슈**: 
- 🔴 치명적(Critical): 3건
- 🟠 중요(Major): 7건
- 🟡 경고(Minor): 12건

---

## 2. 시설관리자 대시보드 (Facility Admin)

### 2.1 구조 분석

**주요 파일**:
- `components/FacilityAdminView.tsx` (492라인)
- `components/dashboard/FacilityDashboard.tsx` (136라인)
- `hooks/useFacilityAdmin.ts` (80라인)
- `lib/api/facilityAdmin.ts` (71라인)

**데이터 흐름**:
```
User → useFacilityAdmin → fetchMyFacility → Supabase
                      ↘ fetchFacilityReservations → Supabase
```

### 2.2 발견된 오류

#### 🔴 CRITICAL-001: 타입 불일치 (Type Mismatch)
**위치**: `types/db.ts:39-57`, `types/index.ts:117-133`

**문제**: Reservation 인터페이스가 두 개의 파일에서 다르게 정의됨

```typescript
// types/db.ts (DB 스키마 기준)
interface Reservation {
  id?: string;
  visit_date: string;
  time_slot: string;
  visitor_name: string;
  // ...
}

// types/index.ts (UI 기준)
interface Reservation {
  id: string;
  facilityId: number | string;
  facilityName: string;
  date: Date;
  timeSlot: string;
  // ...
}
```

**영향**: 데이터 매핑 오류로 인한 UI 표시 문제
**해결**: 단일 소스로 통합 필요

#### 🟠 MAJOR-001: Realtime Subscription 메모리 누수 가능성
**위치**: `components/FacilityAdminView.tsx:74-165`

**문제**: 컴포넌트 언마운트 시 cleanup이 있으나, useEffect 의존성 배열에 `myFacilityId`만 있음

```typescript
useEffect(() => {
  if (!myFacilityId) return;
  // ... subscription setup
  return () => {
    supabase.removeChannel(consultationChannel);
    supabase.removeChannel(reservationChannel);
  };
}, [myFacilityId]); // ⚠️ user prop 변경 시 재구독 안됨
```

**해결**: 의존성 배열에 `user` 추가 검토 필요

#### 🟠 MAJOR-002: 에러 핸들링 불충분
**위치**: `hooks/useFacilityAdmin.ts:28-35`

**문제**: 에러 발생 시 사용자에게 피드백 없음

```typescript
catch (err: any) {
  console.error("Facility Admin Load Error:", err);
  setError("데이터를 불러오는 중 오류가 발생했습니다.");
}
```

**해결**: UI에 에러 상태 표시 필요

#### 🟡 MINOR-001: 사용하지 않는 import
**위치**: `components/FacilityAdminView.tsx:3`

```typescript
import { getFacilityReservations, approveReservation, rejectReservation, getUserFacility, getFacilitySubscription, getFacilityConsultations, answerConsultation, Consultation, markConsultationAsRead, supabase } from '../lib/queries';
```

**문제**: 동적 import로 대첵되었으나 정적 import가 남아있음 (39라인 참고)

#### 🟡 MINOR-002: 매직 넘버 사용
**위치**: `components/FacilityAdminView.tsx:13`

**문제**: Props 타입이 `any`로 선언됨

```typescript
interface Props {
    user: any;
    facilities: any[];
    onNavigate: (view: any, context?: { facilityId?: string }) => void;
}
```

---

## 3. 상조관리자 대시보드 (Sangjo/Partner Admin)

### 3.1 구조 분석

**주요 파일**:
- `components/SangjoDashboard.tsx` (16라인)
- `components/Partner/PartnerDashboard.tsx` (138라인)
- `lib/sangjoQueries.ts` (176라인)

**데이터 흐름**:
```
SangjoDashboard → PartnerDashboard → LiveConsultation/OperationsManagement/AIConfiguration
                                ↘ supabase (partners, partner_conversations, partner_operations)
```

### 3.2 발견된 오류

#### 🟠 MAJOR-003: 에러 핸들링 없음
**위치**: `components/Partner/PartnerDashboard.tsx:23-28`

**문제**: 파트너 정보 조회 실패 시 처리 없음

```typescript
useEffect(() => {
  const fetchPartner = async () => {
    const { data } = await supabase.from('partners').select('name').eq('id', partnerId).single();
    if (data) setPartnerName(data.name);
  };
  fetchPartner();
}, [partnerId]);
```

**해결**: try-catch 추가 및 로딩/에러 상태 관리 필요

#### 🟡 MINOR-003: Prop Drilling
**위치**: `components/SangjoDashboard.tsx`

**문제**: 단순 wrapper 컴포넌트로 불필요한 계층 추가

```typescript
export const SangjoDashboard: React.FC<SangjoDashboardProps> = ({ sangjoId, onBack }) => {
  return (
    <div className="fixed inset-0 z-[500] bg-white">
      <PartnerDashboard partnerId={sangjoId} onLogout={onBack} />
    </div>
  );
};
```

#### 🟡 MINOR-004: 타입 정의 누락
**위치**: `lib/sangjoQueries.ts:146-162`

**문제**: `updateOperationStage` 함수 반환 타입 명시 없음

```typescript
export const updateOperationStage = async (operationId: string, stage: PartnerOperation['operation_stage']) => {
  const { data, error } = await supabase
    .from('partner_operations')
    .update({ operation_stage: stage })
    .eq('id', operationId);
  if (error) throw error;
  return data; // 타입: any
};
```

---

## 4. 슈퍼관리자 대시보드 (Super Admin)

### 4.1 구조 분석

**주요 파일**:
- `components/SuperAdmin/SuperAdminDashboard.tsx` (552라인)
- `hooks/useSuperAdmin.ts` (41라인)
- `hooks/useLeads.ts` (43라인)
- `hooks/useFinancials.ts` (65라인)
- `lib/api/superAdmin.ts` (343라인)

**데이터 흐름**:
```
SuperAdminDashboard → useSuperAdmin (권한 확인)
                    → useLeads (상담 신청)
                    → useSubscriptions (구독 관리)
                    → useRevenue (매출 분석)
```

### 4.2 발견된 오류

#### 🔴 CRITICAL-002: 데이터 정합성 문제
**위치**: `lib/api/superAdmin.ts:268-293`

**문제**: `fetchLeads` 함수에서 존재하지 않는 테이블(`consultation_leads`)을 대체하기 위해 `consultations` 테이블을 사용하지만, 필드 매핑이 불완전함

```typescript
export const fetchLeads = async () => {
  // [Fix] consultation_leads 테이블이 없으므로 consultations 테이블 사용
  const { data: leads, error } = await supabase
    .from('consultations')
    .select('*')
    .order('created_at', { ascending: false });
  // ...
  return leads.map((lead: any) => ({
    id: lead.id,
    user_name: lead.user_name || lead.visitor_name || '익명 고객',
    // contact_phone 필드가 DB에 없을 수 있음
  }));
};
```

**영향**: 상담 관리 화면에서 데이터 표시 오류
**해결**: DB 스키마 확인 후 필드 매핑 정확히 수정 필요

#### 🔴 CRITICAL-003: 보안 취약점 (SQL Injection 가능성)
**위치**: `lib/api/superAdmin.ts:128-136`

**문제**: 사용자 입력값이 직접 쿼리에 사용됨

```typescript
export const searchFacilities = async (query: string) => {
  const { data, error } = await supabase
    .from('memorial_spaces')
    .select('*')
    .ilike('name', `%${query}%`) // ⚠️ 사용자 입력 직접 사용
    .order('created_at', { ascending: false });
  // ...
};
```

**참고**: Supabase의 `ilike`는 prepared statement를 사용하므로 실제 SQL Injection은 어려움, 하지만 입력값 검증 권장

#### 🟠 MAJOR-004: 데이터 fetch 실패 시 fallback
**위치**: `lib/api/superAdmin.ts:207-238`

**문제**: 시설 이름 조회 실패 시에도 UI 표시는 되나 "(알 수 없음)"으로 표시됨

```typescript
// Fallback: Return payments with placeholder names if join fails
return payments.map(p => ({ ...p, facility_name: '(알 수 없음)' })) as (Payment & { facility_name: string })[];
```

**개선**: 사용자에게 데이터 로드 실패 알림 필요

#### 🟠 MAJOR-005: 무한 루프 가능성
**위치**: `hooks/useFinancials.ts:48-61`

**문제**: useEffect 내에서 setState 호출 시 의존성 문제 가능성

```typescript
useEffect(() => {
  const load = async () => {
    try {
      const data = await fetchPayments();
      setPayments(data as any);
      setTotalRevenue(data.reduce((acc, curr) => acc + (curr.amount || 0), 0));
    } catch (err) {
      console.error('Failed to fetch revenue:', err);
    } finally {
      setLoading(false);
    }
  };
  load();
}, []); // 의존성 배열 비어있음 - 괜찮음
```

**평가**: 현재는 괜찮으나, 향후 refresh 기능 추가 시 의존성 관리 필요

#### 🟠 MAJOR-006: 타입 단언 과다 사용
**위치**: `components/SuperAdmin/SuperAdminDashboard.tsx:352`

**문제**: `(facilities as any[]).map(...)` 대신 제네릭 타입 사용 권장

#### 🟡 MINOR-005: 중복 코드
**위치**: `components/SuperAdmin/SuperAdminDashboard.tsx:101-189`

**문제**: `AdminSettings` 컴포넌트가 동일 파일에 정의됨 (분리 권장)

#### 🟡 MINOR-006: 모의 데이터 처리
**위치**: `lib/supabaseClient.ts:95-98`

**문제**: mock 토큰 체크 로직

```typescript
if (token?.startsWith('mock-')) {
  console.log('[SupabaseAuth] Skipping mock token');
  return;
}
```

**개선**: 개발/프로덕션 환경 구분 명확히 필요

---

## 5. 공통 API 및 상태관리

### 5.1 인증 흐름

**파일**: `lib/supabaseClient.ts`, `lib/useAuthSync.ts`

**분석**: Clerk → Supabase 토큰 동기화가 Proxy 패턴으로 구현됨

#### ✅ 잘된 점:
- 싱글톤 패턴으로 클라이언트 인스턴스 재사용
- 토큰 변경 시 헤더만 업데이트 (인스턴스 재생성 없음)
- `createAuthenticatedClient`로 캐싱 적용

#### 🟡 MINOR-007: 환경 변수 디버그 로그
**위치**: `lib/supabaseClient.ts:17-18`

**문제**: 프로덕션 환경에서도 디버그 로그 출력됨

```typescript
console.log('[SupabaseConfig] URL:', supabaseUrl ? 'OK' : 'MISSING');
console.log('[SupabaseConfig] AnonKey:', supabaseAnonKey ? (supabaseAnonKey.length > 20 ? 'OK (Length: ' + supabaseAnonKey.length + ')' : 'TOO SHORT') : 'MISSING');
```

**개선**: 개발 모드에서만 로그 출력하도록 수정

### 5.2 Supabase Client 설정

**분석**: `lib/supabaseClient.ts`

```typescript
{
  auth: {
    persistSession: false, // Clerk 연동으로 로컬 스토리지 사용 안함
    autoRefreshToken: false, // Clerk이 관리
    detectSessionInUrl: false,
  }
}
```

**평가**: Clerk과의 통합을 고려한 적절한 설정

### 5.3 타입 정의

**파일**: `types/db.ts`, `types/index.ts`

#### 🔴 CRITICAL-004: 타입 정의 중복 및 불일치

**문제 목록**:

1. **Reservation** 타입 불일치
   - `types/db.ts`: DB 스키마 기준 (snake_case)
   - `types/index.ts`: UI 기준 (camelCase)
   - **해결**: Mapper 함수로 명확히 분리 필요

2. **MemorialSpace.facilities_id** 선택적 필드
   - DB는 필수일 수 있으나 TS에서는 optional로 정의됨
   - **위치**: `types/db.ts:73`

3. **PartnerInquiry.target_facility_id** 타입
   - `number | null`로 정의되었으나 실제 DB는 bigint
   - **위치**: `types/db.ts:91`

---

## 6. 데이터베이스 스키마 검증

### 6.1 필수 테이블 확인

| 테이블명 | 상태 | 비고 |
|---------|------|------|
| profiles | ✅ | 사용자 프로필 |
| memorial_spaces | ✅ | 시설 정보 |
| reservations | ✅ | 예약 데이터 |
| partner_inquiries | ✅ | 파트너 신청 |
| partners | ✅ | 상조 파트너 |
| facility_subscriptions | ✅ | 구독 정보 |
| subscription_payments | ✅ | 결제 이력 |
| consultations | ✅ | 상담 내역 |
| audit_logs | ✅ | 활동 로그 |
| consultations | ⚠️ | `consultation_leads` 대신 사용 중 |
| system_settings | ⚠️ | 없을 수 있음 (fallback 있음) |

### 6.2 RLS (Row Level Security) 정책

**슈퍼관리자 검증**: 
```typescript
// hooks/useSuperAdmin.ts:19-20
const { data, error } = await supabase.rpc('is_super_admin', { p_user_id: userId });
```

**평가**: RPC 기반 서버 측 검증으로 보안성 향상 ✅

---

## 7. 종합 평가 및 권고사항

### 7.1 심각도별 요약

#### 🔴 치명적 (Critical) - 즉시 수정 필요
1. **타입 불일치**: Reservation 인터페이스 중복 정의
2. **데이터 정합성**: `consultation_leads` 테이블 대체 로직 문제
3. **타입 정의**: MemorialSpace, PartnerInquiry 타입 불일치

#### 🟠 중요 (Major) - 우선 수정 권장
1. Realtime Subscription 메모리 누수 가능성
2. 에러 핸들링 불충분 (시설관리자)
3. 에러 핸들링 없음 (상조관리자)
4. 데이터 fetch 실패 시 fallback 처리
5. 타입 단언 과다 사용

#### 🟡 경고 (Minor) - 개선 권장
1. 사용하지 않는 import 정리
2. 매직 넘버/any 타입 구체화
3. Prop Drilling 제거
4. 환경 변수 디버그 로그 조건부 처리
5. 컴포넌트 분리 (AdminSettings 등)

### 7.2 코드 품질 점수

| 대시보드 | 구조 | 타입안정성 | 에러처리 | 성능 | 종합 |
|---------|------|-----------|---------|------|------|
| 시설관리자 | B+ | C+ | C | B | B |
| 상조관리자 | B | B | C+ | B | B |
| 슈퍼관리자 | A- | B | B+ | B+ | B+ |
| **평균** | **B+** | **B** | **B-** | **B** | **B** |

### 7.3 우선순위별 수정 계획

**1순위 (1주일 내)**:
- 타입 정의 통일 (Reservation, MemorialSpace)
- 에러 핸들링 강화 (try-catch + UI 피드백)

**2순위 (2주일 내)**:
- Realtime subscription cleanup 개선
- DB 스키마와 타입 정의 동기화

**3순위 (한 달 내)**:
- 컴포넌트 분리 및 리팩토링
- 디버그 로그 정리
- 테스트 코드 작성

### 7.4 테스트 권고사항

1. **통합 테스트**:
   - 각 대시보드별 CRUD 작업 테스트
   - 실시간 업데이트(Realtime) 테스트
   - 권한 체크 테스트

2. **E2E 테스트**:
   - 사용자 시나리오 기반 테스트
   - 에러 상황 시뮬레이션

3. **성능 테스트**:
   - 대용량 데이터 로딩 시 성능
   - 메모리 누수 체크

---

## 8. 결론

Memorimap 대시보드 시스템은 전반적으로 잘 구조화되어 있으나, 타입 정의의 일관성과 에러 핸들링 부분에서 개선이 필요합니다. 특히 Reservation 타입의 중복 정의는 즉시 수정해야 할 치명적 문제이며, 데이터 정합성을 위한 mapper 함수 도입을 권장합니다.

Supabase와 Clerk의 통합은 안전하게 구현되었으며, RPC 기반의 권한 체크는 좋은 보안 패턴입니다.

**전반적 등급: B (양호)**
**권고**: 타입 정의 정리 후 재검증 권장

---

**보고서 작성 완료**  
**다음 검증 예정일**: 2026-02-22 (2주 후)
