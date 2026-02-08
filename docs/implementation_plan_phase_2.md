# Phase 2: Logic Hardening - Implementation Plan

## 목표 (Goal)
애플리케이션의 **런타임 안정성** 및 **사용자 경험** 향상을 위한 로직 강화

---

## Scope & Priority

### P0 (High Priority - 즉시)
1. Error Handling Standardization
2. Supabase Client Singleton

### P1 (Medium Priority - 이번 주)
3. Realtime Subscription Memory Leak Fix
4. Data Merge Logic

---

## Phase 2-1: Error Handling Standardization

### 목표
- `alert()` 사용 제거 → `sonner` toast로 교체
- 모든 async 함수에 일관된 에러 핸들링 적용

### 현재 상태
**`alert()` 사용처**: 35개 파일 발견
- `App.tsx`, `MyPageView.tsx`, `FacilityAdminDashboard.tsx` 등
- 주로 성공/실패 알림에 사용

### 구현 계획

#### Step 1: Error Handler 유틸리티 생성

**파일**: `lib/errorHandler.ts`
```typescript
import { toast } from 'sonner';
import { logAuditEvent, AuditAction } from '@/lib/security/auditLog';

/**
 * 표준 에러 핸들러
 */
export function handleError(
  error: unknown,
  context: string,
  options?: {
    showToast?: boolean;
    logToAudit?: boolean;
    userId?: string;
  }
): void {
  const message = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';

  // 콘솔 로그
  console.error(`[${context}]`, error);

  // 사용자 알림 (Toast)
  if (options?.showToast !== false) {
    toast.error(message, {
      description: context,
      duration: 5000
    });
  }

  // Audit Log (선택적)
  if (options?.logToAudit && options?.userId) {
    logAuditEvent({
      userId: options.userId,
      action: AuditAction.RLS_VIOLATION,
      resourceType: 'error',
      metadata: { context, message }
    });
  }
}

/**
 * 성공 토스트
 */
export function showSuccess(message: string, description?: string): void {
  toast.success(message, { description });
}

/**
 * 경고 토스트
 */
export function showWarning(message: string, description?: string): void {
  toast.warning(message, { description });
}
```

#### Step 2: `alert()` 일괄 교체

**대상 파일** (우선순위 기준):
1. `App.tsx` (3건)
2. `MyPageView.tsx` (5건)
3. `FacilityAdminDashboard.tsx` (2건)
4. `SuperAdminDashboard.tsx` (4건)
5. 기타 32개 파일

**교체 패턴**:
```typescript
// Before
alert('저장되었습니다.');

// After
import { showSuccess } from '@/lib/errorHandler';
showSuccess('저장되었습니다.');
```

#### Step 3: Async 함수 에러 핸들링 표준화

**패턴**:
```typescript
// Before
const handleSave = async () => {
  const result = await updateProfile(data);
  alert('저장 완료');
};

// After
const handleSave = async () => {
  try {
    const result = await updateProfile(data);
    showSuccess('저장되었습니다.');
  } catch (error) {
    handleError(error, '프로필 저장', { showToast: true, userId });
  }
};
```

---

## Phase 2-2: Supabase Client Optimization

### 목표
- `createAuthenticatedClient` Singleton 패턴 강제
- 다중 인스턴스 생성 방지

### 현재 문제
**`createAuthenticatedClient` 사용처**: 3개 파일
- `lib/supabaseClient.ts`
- `lib/useAuthSync.ts`
- `components/IntegratedJourneyView.tsx`

각 컴포넌트가 독립적으로 클라이언트 생성 → 메모리 누수 및 "Multiple GoTrueClient instances" 경고

### 구현 계획

#### Step 1: Singleton Pattern 적용

**파일**: `lib/supabaseClient.ts`
```typescript
let authenticatedClientInstance: SupabaseClient | null = null;

export const createAuthenticatedClient = (clerkToken: string): SupabaseClient => {
  // 재사용 가능한 경우 기존 인스턴스 반환
  if (authenticatedClientInstance && isTokenValid(clerkToken)) {
    return authenticatedClientInstance;
  }

  // 새 인스턴스 생성
  authenticatedClientInstance = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY,
    {
      global: {
        headers: {
          Authorization: `Bearer ${clerkToken}`,
        },
      },
    }
  );

  return authenticatedClientInstance;
};

// 토큰 유효성 검증 (JWT 디코딩)
function isTokenValid(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

// 클라이언트 초기화 (로그아웃 시)
export const resetAuthenticatedClient = (): void => {
  authenticatedClientInstance = null;
};
```

#### Step 2: 사용처 리팩토링

**대상**: `useAuthSync.ts`, `IntegratedJourneyView.tsx`
- 독립적인 클라이언트 생성 제거
- 중앙 `createAuthenticatedClient` 사용

---

## Phase 2-3: Realtime Subscription Memory Leak Fix

### 목표
- `useEffect` 내 Realtime Subscription cleanup 보장

### 검증 방법
```typescript
// 모든 Realtime Subscription 패턴 검색
grep -r "supabase.channel" --include="*.tsx" --include="*.ts"
```

### 수정 패턴
```typescript
// Before (Memory Leak)
useEffect(() => {
  const channel = supabase
    .channel('my-channel')
    .on('postgres_changes', ..., () => {})
    .subscribe();
}, []);

// After (Fixed)
useEffect(() => {
  const channel = supabase
    .channel('my-channel')
    .on('postgres_changes', ..., () => {})
    .subscribe();

  // Cleanup
  return () => {
    supabase.removeChannel(channel);
  };
}, []);
```

---

## Phase 2-4: Data Merge Logic

### 목표
- AI 상담 데이터와 기존 상담 데이터 포맷 통일

### 구현 계획

#### `lib/utils/dataMerge.ts`
```typescript
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
```

**적용 위치**: `SuperAdminDashboard.tsx`, `FacilityAdminDashboard.tsx`

---

## 검증 계획 (Verification)

### 1. Error Handling
```typescript
// Test Case: 의도적 오류 발생
try {
  throw new Error('Test Error');
} catch (error) {
  handleError(error, 'Test Context', { showToast: true });
}
// 기대 결과: Toast 알림 표시, alert() 없음
```

### 2. Singleton Pattern
```typescript
// Test: 다중 호출 시 동일 인스턴스 반환
const client1 = createAuthenticatedClient(token);
const client2 = createAuthenticatedClient(token);
console.assert(client1 === client2, 'Singleton failed');
```

### 3. Memory Leak
- Chrome DevTools → Performance → Memory Profiling
- 페이지 이동 후 Realtime 채널 미제거 여부 확인

---

## 우선순위 체크리스트

### P0 (즉시)
- [ ] `lib/errorHandler.ts` 생성
- [ ] `App.tsx`, `MyPageView.tsx` alert() 제거 (총 8건)
- [ ] `createAuthenticatedClient` Singleton 적용

### P1 (이번 주)
- [ ] 나머지 33개 파일 alert() 교체
- [ ] Realtime Subscription cleanup 전수 조사
- [ ] `mapAiToLegacy` 유틸리티 구현

### P2 (다음 주)
- [ ] Error Boundary 컴포넌트 추가 (전역 에러 캐치)
- [ ] Sentry 또는 에러 모니터링 도구 통합

---

## 예상 소요 시간
- Error Handler 유틸리티: 30분
- alert() 일괄 교체 (35개 파일): 2-3시간
- Singleton Pattern: 1시간
- Realtime Subscription 수정: 1-2시간
- Data Merge Logic: 1시간
- **총 예상 시간: 6-8시간**

---

## 다음 단계 (Phase 3 Preview)
- Type Safety (any 제거)
- Code Cleanup (unused imports, console.log)
- Component Splitting (500+ lines)
