# Phase 2: Logic Hardening - 작업 현황 및 진행 가이드

**문서 생성일**: 2026-02-08  
**상태**: 진행 중 (13% 완료)  
**우선순위**: P0 (즉시 진행 필요)

---

## 1. 작업 개요

Phase 2는 애플리케이션의 **런타임 안정성** 및 **사용자 경험**을 향상시키기 위한 로직 강화 작업입니다.

### 목표
- ❌ `alert()` 사용 제거 → `sonner` toast로 교체
- ⚠️ Supabase Client Singleton 패턴 완성
- ❌ Realtime Subscription 메모리 누수 방지
- ❌ AI/기존 상담 데이터 포맷 통일

---

## 2. 작업 현황 상세

### 2.1 Phase 2-1: Error Handling Standardization

#### 현재 상태: ❌ 미구현

**누락 파일**:
```
lib/errorHandler.ts (미생성)
```

**구현 필요 함수**:
```typescript
// lib/errorHandler.ts
export function handleError(error: unknown, context: string, options?: {...}): void
export function showSuccess(message: string, description?: string): void
export function showWarning(message: string, description?: string): void
```

**alert() 사용 현황**:

| 파일 | 건수 | 우선순위 | 상태 |
|------|------|----------|------|
| App.tsx | 2건 | P0 | 미교체 |
| MyPageView.tsx | 2건 | P0 | 미교체 |
| FacilityAdminDashboard.tsx | 5건 | P0 | 미교체 |
| SuperAdminDashboard.tsx | 8건 | P0 | 미교체 |
| PartnerAdmissions.tsx | 4건 | P1 | 미교체 |
| SubscriptionPlans.tsx | 5건 | P1 | 미교체 |
| FuneralCompanySheet.tsx | 5건 | P1 | 미교체 |
| ReviewForm.tsx | 3건 | P1 | 미교체 |
| ContractMonitoring.tsx | 4건 | P1 | 미교체 |
| FacilityEditModal.tsx | 3건 | P1 | 미교체 |
| 기타 25개 파일 | 38건 | P2 | 미교체 |
| **총계** | **77건** | - | **0%** |

#### 작업 순서

**Step 1: Error Handler 생성** (30분)
```bash
# 파일 생성
touch lib/errorHandler.ts
```

**Step 2: P0 파일 처리** (2시간)
1. App.tsx (Line 1992, 1996)
2. MyPageView.tsx (Line 229, 231)
3. FacilityAdminDashboard.tsx (Line 139, 178, 180, 193, 195)
4. SuperAdminDashboard.tsx (Line 106, 110, 199, 202, 222, 274, 299, 302)

**교체 패턴**:
```typescript
// Before
alert('저장되었습니다.');

// After
import { showSuccess } from '@/lib/errorHandler';
showSuccess('저장되었습니다.');
```

---

### 2.2 Phase 2-2: Supabase Client Optimization

#### 현재 상태: ⚠️ 부분 구현 (60%)

**위치**: `lib/supabaseClient.ts:121-161`

**구현된 내용**:
- ✅ `cachedAuthClient` 캐싱 적용
- ✅ 토큰 변경 시 재생성 로직
- ✅ Unique storage key 적용

**누락된 내용**:
```typescript
// 1. JWT 만료 시간 검증 함수
function isTokenValid(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

// 2. 클라이언트 초기화 함수 (로그아웃 시)
export const resetAuthenticatedClient = (): void => {
  cachedAuthClient = null;
  cachedToken = null;
  clientInstanceCounter = 0;
};

// 3. 토큰 유효성 검증 적용
export const createAuthenticatedClient = (token: string): SupabaseClient => {
  // 재사용 가능한 경우 기존 인스턴스 반환
  if (cachedAuthClient && cachedToken === token && isTokenValid(token)) {
    return cachedAuthClient;
  }
  // ... 나머지 로직
};
```

**사용처 리팩토링 필요**:
- `lib/useAuthSync.ts:81-82`
- 로그아웃 시 `resetAuthenticatedClient()` 호출 필요

---

### 2.3 Phase 2-3: Realtime Subscription Memory Leak Fix

#### 현재 상태: ❌ 미완료

**발견된 사용처**:
```
components/AI/ScenarioBot.tsx:141-157
```

**현재 코드 (Memory Leak)**:
```typescript
const listenToEvents = (convId: string) => {
    supabase.channel(`ai-conv-${convId}`)
        .on('postgres_changes', {...}, (payload) => {...})
        .subscribe();
    // ❌ cleanup 누락
};
```

**수정 필요 코드**:
```typescript
const listenToEvents = (convId: string) => {
    const channel = supabase.channel(`ai-conv-${convId}`)
        .on('postgres_changes', {...}, (payload) => {...})
        .subscribe();
    
    // Cleanup 함수 반환
    return () => {
        supabase.removeChannel(channel);
    };
};

// useEffect에서 사용
useEffect(() => {
    const cleanup = listenToEvents(convId);
    return () => cleanup?.();
}, [convId]);
```

**추가 검색 필요**:
```bash
# 전체 프로젝트에서 Realtime Subscription 검색
grep -r "\.channel\(" --include="*.tsx" --include="*.ts" src/ components/ lib/
grep -r "\.subscribe()" --include="*.tsx" --include="*.ts" src/ components/ lib/
```

---

### 2.4 Phase 2-4: Data Merge Logic

#### 현재 상태: ❌ 미구현

**누락 파일**:
```
lib/utils/dataMerge.ts (미생성)
```

**구현 필요 내용**:
```typescript
// lib/utils/dataMerge.ts

export interface UnifiedConsultation {
  id: string;
  user_name: string;
  phone_number: string;
  facility_name: string;
  consultation_type: string;
  status: string;
  created_at: string;
  source: 'ai' | 'legacy';
}

export function mapAiToLegacy(aiConsultation: any): UnifiedConsultation {
  return {
    id: aiConsultation.id,
    user_name: aiConsultation.visitor_name || '익명',
    phone_number: aiConsultation.contact_number || '',
    facility_name: aiConsultation.facilities?.name || '(삭제된 시설)',
    consultation_type: 'ai_chat',
    status: aiConsultation.status || 'pending',
    created_at: aiConsultation.created_at,
    source: 'ai'
  };
}

export function mapLegacyToUnified(legacy: any): UnifiedConsultation {
  return {
    id: legacy.id,
    user_name: legacy.user_name || legacy.visitor_name || '익명',
    phone_number: legacy.phone_number || legacy.contact_number || '',
    facility_name: legacy.facility_name || legacy.facilities?.name || '(삭제된 시설)',
    consultation_type: legacy.consultation_type || legacy.type || 'general',
    status: legacy.status || 'pending',
    created_at: legacy.created_at,
    source: 'legacy'
  };
}
```

**적용 위치**:
- `SuperAdminDashboard.tsx`
- `FacilityAdminDashboard.tsx`

---

## 3. 작업 체크리스트

### P0 (즉시 - 이번 주 완료 목표)

- [ ] `lib/errorHandler.ts` 생성 (handleError, showSuccess, showWarning)
- [ ] App.tsx alert() 2건 교체
- [ ] MyPageView.tsx alert() 2건 교체
- [ ] FacilityAdminDashboard.tsx alert() 5건 교체
- [ ] SuperAdminDashboard.tsx alert() 8건 교체
- [ ] ScenarioBot.tsx cleanup 함수 추가
- [ ] Supabase Client JWT 검증 추가
- [ ] `resetAuthenticatedClient()` 함수 추가

### P1 (이번 주)

- [ ] PartnerAdmissions.tsx alert() 4건 교체
- [ ] SubscriptionPlans.tsx alert() 5건 교체
- [ ] FuneralCompanySheet.tsx alert() 5건 교체
- [ ] ReviewForm.tsx alert() 3건 교체
- [ ] ContractMonitoring.tsx alert() 4건 교체
- [ ] FacilityEditModal.tsx alert() 3건 교체
- [ ] 기타 파일 25개 alert() 교체
- [ ] `lib/utils/dataMerge.ts` 생성
- [ ] SuperAdminDashboard.tsx 데이터 머지 적용
- [ ] FacilityAdminDashboard.tsx 데이터 머지 적용

### P2 (다음 주)

- [ ] Error Boundary 컴포넌트 추가
- [ ] Sentry 또는 에러 모니터링 도구 통합
- [ ] Realtime Subscription 전수 조사 및 수정

---

## 4. 예상 소요 시간

| 작업 | 예상 시간 | 누적 |
|------|-----------|------|
| Error Handler 생성 | 30분 | 30분 |
| P0 파일 alert() 교체 (4개 파일) | 2시간 | 2.5시간 |
| Supabase Singleton 완성 | 1시간 | 3.5시간 |
| ScenarioBot cleanup 수정 | 30분 | 4시간 |
| P1 파일 alert() 교체 (6개 파일) | 3시간 | 7시간 |
| 나머지 파일 alert() 교체 (25개 파일) | 4시간 | 11시간 |
| Data Merge Logic | 1시간 | 12시간 |
| **총계** | **12시간** | **1.5일** |

---

## 5. 작업 가이드

### 5.1 Error Handler 생성

```typescript
// lib/errorHandler.ts
import { toast } from 'sonner';
import { logAuditEvent, AuditAction } from '@/lib/security/auditLog';

interface ErrorHandlerOptions {
  showToast?: boolean;
  logToAudit?: boolean;
  userId?: string;
}

export function handleError(
  error: unknown,
  context: string,
  options?: ErrorHandlerOptions
): void {
  const message = error instanceof Error 
    ? error.message 
    : '알 수 없는 오류가 발생했습니다.';

  console.error(`[${context}]`, error);

  if (options?.showToast !== false) {
    toast.error(message, {
      description: context,
      duration: 5000
    });
  }

  if (options?.logToAudit && options?.userId) {
    logAuditEvent({
      userId: options.userId,
      action: AuditAction.RLS_VIOLATION,
      resourceType: 'error',
      metadata: { context, message }
    });
  }
}

export function showSuccess(message: string, description?: string): void {
  toast.success(message, { description });
}

export function showWarning(message: string, description?: string): void {
  toast.warning(message, { description });
}
```

### 5.2 alert() 교체 스크립트

```bash
# 1. Error Handler import 추가
sed -i "1s/^/import { handleError, showSuccess, showWarning } from '\/lib\/errorHandler';\n/" App.tsx

# 2. alert()을 toast로 교체 (수동으로 진행 권장)
# App.tsx 예시
# alert('고객센터(1588-0000)로 연결합니다.');
# → showSuccess('고객센터(1588-0000)로 연결합니다.');
```

### 5.3 Supabase Client Singleton 완성

```typescript
// lib/supabaseClient.ts 수정

// 1. JWT 검증 함수 추가
function isTokenValid(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

// 2. createAuthenticatedClient 수정
export const createAuthenticatedClient = (token: string): SupabaseClient => {
  if (cachedAuthClient && cachedToken === token && isTokenValid(token)) {
    return cachedAuthClient;
  }
  // ... 기존 로직
};

// 3. 초기화 함수 추가
export const resetAuthenticatedClient = (): void => {
  cachedAuthClient = null;
  cachedToken = null;
  clientInstanceCounter = 0;
};
```

### 5.4 Realtime Cleanup 수정

```typescript
// components/AI/ScenarioBot.tsx 수정

const listenToEvents = (convId: string) => {
    const channel = supabase.channel(`ai-conv-${convId}`)
        .on('postgres_changes', {...}, (payload) => {...})
        .subscribe();
    
    // Cleanup 함수 반환
    return () => {
        channel.unsubscribe();
        supabase.removeChannel(channel);
    };
};

// useEffect에서 사용
useEffect(() => {
    let cleanup: (() => void) | undefined;
    
    if (conversationId) {
        cleanup = listenToEvents(conversationId);
    }
    
    return () => {
        cleanup?.();
    };
}, [conversationId]);
```

---

## 6. 테스트 계획

### 6.1 Error Handling 테스트

```typescript
// 테스트 시나리오
1. 의도적 오류 발생
   - 예상: Toast 알림 표시
   - 금지: alert() 표시

2. 네트워크 오류 시뮬레이션
   - 예상: handleError() 호출
   - 확인: Audit Log 기록 여부
```

### 6.2 Singleton 패턴 테스트

```typescript
// 테스트 코드
const client1 = createAuthenticatedClient(token);
const client2 = createAuthenticatedClient(token);
console.assert(client1 === client2, 'Singleton failed');

// 토큰 만료 후 새 인스턴스 생성 확인
setTimeout(() => {
  const client3 = createAuthenticatedClient(expiredToken);
  console.assert(client1 !== client3, 'Token expiration not handled');
}, 1000);
```

### 6.3 Memory Leak 테스트

```bash
# Chrome DevTools 사용
1. Performance 탭 → Memory Profiling
2. 페이지 이동 반복
3. Realtime 채널 카운트 확인 (0으로 유지되어야 함)
```

---

## 7. 위험 요소 및 대응책

| 위험 | 가능성 | 영향도 | 대응책 |
|------|--------|--------|--------|
| alert() 교체 누락 | 중간 | 중간 | 정기 검토 회의 |
| Realtime 누수 발견 | 높음 | 높음 | Chrome DevTools 모니터링 |
| JWT 검증 오류 | 낮음 | 높음 | 단위 테스트 필수 |
| Data Merge 호환성 | 중간 | 중간 | 스테이징 환경 테스트 |

---

## 8. 참고 자료

### 문서
- Phase 2 계획: `docs/implementation_plan_phase_2.md`
- Phase 1-4 보안 보고서: `PHASE_1_4_SECURITY_VERIFICATION_REPORT.md`

### 코드
- Supabase Client: `lib/supabaseClient.ts`
- Realtime 사용: `components/AI/ScenarioBot.tsx`
- Toast 라이브러리: `sonner` (이미 설치됨)

### 명령어
```bash
# alert() 사용처 검색
grep -rn "alert(" --include="*.tsx" --include="*.ts" | grep -v "backup" | wc -l

# Realtime 채널 검색
grep -rn "\.channel(" --include="*.tsx" --include="*.ts" | grep -v backup

# TypeScript 빌드 확인
npx tsc --noEmit
```

---

## 9. 결론 및 다음 단계

### 현재 상황
- Phase 2 작업이 **13%** 완료됨
- 대부분의 작업이 미시작 상태
- P0 작업부터 즉시 진행 필요

### 즉시 필요한 작업 (오늘)
1. ✅ `lib/errorHandler.ts` 생성 (30분)
2. ✅ App.tsx alert() 교체 (30분)
3. ✅ MyPageView.tsx alert() 교체 (30분)
4. ✅ ScenarioBot.tsx cleanup 추가 (30분)

### 이번 주 목표
- P0 작업 완료
- P1 작업 50% 완료

### 다음 주 목표
- P1 작업 완료
- P2 작업 시작

---

**문서 담당자**: AI Assistant  
**마지막 수정**: 2026-02-08
