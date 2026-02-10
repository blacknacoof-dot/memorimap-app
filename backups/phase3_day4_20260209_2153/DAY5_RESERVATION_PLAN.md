# Day 5: 예약 로직 이동 작업계획

**작업일**: 2026-02-09  
**난이도**: 🟡 중간  
**위험도**: 🟡 중간 (DB 연동 포함)  
**예상 소요시간**: 4-6시간  
**작업자**: AI Assistant

---

## 1. 작업 개요

### 대상 기능
- 예약 상태 관리 (`reservations`, `setReservations`)
- 예약 생성 (`handleBookingConfirm`)
- 예약 상태 변경 (`handleUpdateReservationStatus`)
- Supabase 연동 (DB insert/update)

### ⚠️ 주의사항
- DB 스키마와 연동됨
- 트랜잭션 처리 필요
- 에러 핸들링 중요
- 롤백 가능성 확보

---

## 2. 작업 순서

### Step 1: 사전 준비 (30분)

#### 1.1 현재 상태 백업
```bash
# 작업 시작 전 반드시 백업
git status
git log --oneline -3
```

**확인사항**:
- [ ] 이전 작업(Day 4) 정상 완료 확인
- [ ] Git 커밋 완료 확인 (5df7fb2)
- [ ] 개발 서버 정상 동작 확인

#### 1.2 예약 로직 위치 파악
```bash
# App.tsx에서 예약 관련 코드 검색
grep -n "reservations\|handleBookingConfirm\|handleUpdateReservation" App.tsx
```

**예상 위치**:
- Line ~95: `const [reservations, setReservations]`
- Line ~1045: `const handleBookingConfirm`
- Line ~1085: `const handleUpdateReservationStatus`

---

### Step 2: useReservations Hook 생성 (1시간)

#### 2.1 파일 생성
**위치**: `hooks/useReservations.ts`

**구현 내용**:
```typescript
import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Reservation } from '../types';

interface UseReservationsReturn {
  reservations: Reservation[];
  setReservations: React.Dispatch<React.SetStateAction<Reservation[]>>;
  handleBookingConfirm: (reservation: Reservation) => Promise<void>;
  handleUpdateReservationStatus: (id: string, status: 'confirmed' | 'cancelled') => void;
  isLoading: boolean;
  error: Error | null;
}

export const useReservations = (
  user: any,
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void,
  setViewState: (state: ViewState) => void
): UseReservationsReturn => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleBookingConfirm = useCallback(async (reservation: Reservation) => {
    if (!user?.id) {
      showToast("예약을 위해 로그인이 필요합니다.", 'error');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: insertError } = await supabase
        .from('reservations')
        .insert({
          user_id: user.id,
          facility_id: reservation.facility_id,
          facility_name: reservation.facility_name,
          visit_date: reservation.visit_date,
          time_slot: reservation.time_slot,
          visitor_name: reservation.visitor_name,
          visitor_count: reservation.visitor_count,
          purpose: reservation.purpose,
          special_requests: reservation.special_requests,
          status: reservation.status,
          payment_amount: reservation.payment_amount
        })
        .select()
        .single();

      if (insertError) throw insertError;

      if (data) {
        setReservations(prev => [...prev, { ...reservation, id: data.id }]);
        showToast("예약이 확정되었습니다!");
        setViewState(ViewState.MY_PAGE);
      }
    } catch (err: any) {
      console.error('Reservation error:', err);
      setError(err);
      showToast(`예약 중 오류가 발생했습니다: ${err.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, showToast, setViewState]);

  const handleUpdateReservationStatus = useCallback((id: string, status: 'confirmed' | 'cancelled') => {
    setReservations(prev => prev.map(r => 
      r.id === id ? { ...r, status } : r
    ));
  }, []);

  return {
    reservations,
    setReservations,
    handleBookingConfirm,
    handleUpdateReservationStatus,
    isLoading,
    error
  };
};
```

**검증**:
- [ ] TypeScript 오류 없음
- [ ] Import 경로 정확
- [ ] 타입 정의 완료

---

### Step 3: App.tsx 수정 (1.5시간)

#### 3.1 Import 추가
```typescript
import { useReservations } from './hooks/useReservations';
```

#### 3.2 State 및 함수 교체

**변경 전**:
```typescript
const [reservations, setReservations] = useState<Reservation[]>([]);
```

**변경 후**:
```typescript
// Reservations State - useReservations hook 사용
const {
  reservations,
  setReservations,
  handleBookingConfirm,
  handleUpdateReservationStatus,
  isLoading: isReservationsLoading,
  error: reservationError
} = useReservations(user, showToast, setViewState);
```

#### 3.3 기존 함수 제거

**제거 대상**:
- `const handleBookingConfirm = async (...) => {...}` (약 35줄)
- `const handleUpdateReservationStatus = (...) => {...}` (약 3줄)

**검증**:
- [ ] `reservations` 참조하는 모든 곳 확인
- [ ] `setReservations` 참조하는 모든 곳 확인
- [ ] 자식 컴포넌트에 전달되는 props 확인

---

### Step 4: 테스트 (1.5시간)

#### 4.1 빌드 테스트
```bash
npx tsc --noEmit
npm run build
```

#### 4.2 기능 테스트 체크리스트

| 기능 | 테스트 방법 | 예상 결과 | 실제 결과 |
|------|------------|-----------|-----------|
| **예약 생성** | 시설 선택 → 예약 버튼 클릭 | 예약 성공 메시지 | ☐ |
| **DB 저장** | Supabase Dashboard 확인 | 데이터 저장됨 | ☐ |
| **예약 조회** | 마이페이지 → 예약 내역 | 예약 표시됨 | ☐ |
| **예약 확정** | 관리자 대시보드 | 상태 변경됨 | ☐ |
| **예약 취소** | 예약 취소 버튼 클릭 | 상태 'cancelled'로 변경 | ☐ |
| **에러 처리** | 네트워크 끊고 예약 시도 | 에러 메시지 표시 | ☐ |
| **로딩 상태** | 예약 진행 중 | 로딩 표시 | ☐ |

#### 4.3 에러 케이스 테스트
```bash
# 개발 서버 실행
npm run dev

# 테스트 시나리오:
# 1. 정상 예약
# 2. 로그인 안 된 상태에서 예약 시도
# 3. 네트워크 오류 시뮬레이션
# 4. 중복 예약 방지
```

---

### Step 5: 검증 및 커밋 (30분)

#### 5.1 최종 검증
```bash
# TypeScript 검증
npx tsc --noEmit

# 빌드 검증
npm run build

# Git 상태 확인
git status
git diff --stat
```

#### 5.2 Git 커밋
```bash
git add hooks/useReservations.ts App.tsx
git commit -m "Phase 3: Extract reservation logic to useReservations hook

- Create hooks/useReservations.ts for reservation management
- Move reservations, setReservations states to hook
- Move handleBookingConfirm with Supabase integration
- Move handleUpdateReservationStatus
- Add loading and error states
- Add proper error handling with toast notifications
- Remove ~40 lines from App.tsx
- All reservation functionality preserved

Refs: Phase 3 roadmap Day 5 task"
```

---

## 3. 롤백 전략

### 문제 발생 시 대응

#### 상황 1: TypeScript 오류
```bash
# 오류 발생 시 즉시 원복
sed -i '/useReservations/d' App.tsx
git checkout HEAD -- App.tsx
npm run build
```

#### 상황 2: 기능 오작동
```bash
# 직전 커밋으로 롤백
git log --oneline -3
git reset --hard HEAD~1
```

#### 상황 3: DB 관련 오류
```bash
# Supabase 연결 확인
npm run dev
# 브라우저 콘솔에서 에러 확인
# → Supabase RLS 정책 문제인지 확인
```

### 백업에서 복원
```bash
# 외장 백업에서 복원
robocopy "D:\추모맵\backup_20260209_2046" "C:\Users\black\Desktop\memorimap" /E /MIR
```

---

## 4. 위험 관리

### 위험도 평가
| 위험 요소 | 가능성 | 영향 | 대응책 |
|-----------|--------|------|--------|
| **DB 연결 실패** | 낮음 | 높음 | 에러 핸들링 + 토스트 |
| **트랜잭션 오류** | 낮음 | 높음 | try-catch + 롤백 |
| **타입 오류** | 중간 | 중간 | TypeScript 검증 |
| **상태 동기화 오류** | 중간 | 중간 | 테스트 체크리스트 |

### 모니터링 지표
```typescript
// useReservations.ts에 추가
debugLog('Reservation created:', { id: data.id, facility: reservation.facility_name });
debugLog('Reservation error:', error);
```

---

## 5. 작업 체크리스트

### 사전 준비 ☐
- [ ] 현재 상태 확인 (Day 4 완료)
- [ ] Git 커밋 확인
- [ ] 개발 서버 정상 동작 확인

### 개발 작업 ☐
- [ ] hooks/useReservations.ts 생성
- [ ] App.tsx import 추가
- [ ] useReservations hook 사용
- [ ] 기존 함수 제거
- [ ] TypeScript 오류 0개 확인

### 테스트 ☐
- [ ] 빌드 성공
- [ ] 예약 생성 테스트
- [ ] 예약 조회 테스트
- [ ] 예약 상태 변경 테스트
- [ ] 에러 케이스 테스트
- [ ] DB 데이터 확인

### 마무리 ☐
- [ ] Git 커밋
- [ ] 작업 로그 문서화
- [ ] 다음 작업 준비

---

## 6. 예상 결과

### 코드 변화
| 파일 | 변경 | 설명 |
|------|------|------|
| `hooks/useReservations.ts` | +100줄 | 새로운 hook 생성 |
| `App.tsx` | -40줄 | 예약 로직 제거 |
| `App.tsx` | +10줄 | hook import 및 사용 |

### 기능적 결과
- ✅ 예약 생성 기능 유지
- ✅ 예약 상태 관리 유지
- ✅ Supabase 연동 유지
- ✅ 에러 핸들링 개선
- ✅ 로딩 상태 관리 추가

---

## 7. 참고 자료

### 관련 파일
```
App.tsx:
  - Line ~95: reservations state
  - Line ~1045: handleBookingConfirm
  - Line ~1085: handleUpdateReservationStatus

lib/supabaseClient.ts:
  - Supabase 클라이언트 설정

types/index.ts:
  - Reservation 타입 정의
```

### 이전 작업 참고
```
Phase 3 작업 로그:
- Day 3: useToast (87ed993)
- Day 4: useComparison (5df7fb2)
```

---

## 8. 시작 명령

```bash
# 작업 시작
cd C:\Users\black\Desktop\memorimap
git status
git log --oneline -3

# 백업 확인 (있으면)
ls D:\추모맵\backup_20260209_2046\App.tsx

# 개발 서버 시작
npm run dev
```

---

## 9. 문서 정보

- **파일명**: DAY5_RESERVATION_PLAN.md
- **위치**: C:\Users\black\Desktop\memorimap\DAY5_RESERVATION_PLAN.md
- **작성자**: AI Assistant
- **작성일**: 2026-02-09
- **버전**: 1.0
- **상태**: 승인 대기 중

---

## 10. 결론

예약 로직 이동은 **DB 연동이 포함**되어 있어 주의가 필요합니다.

**핵심 체크포인트**:
1. ✅ Supabase 연결 정상 확인
2. ✅ 에러 핸들링 완료
3. ✅ 테스트 체크리스트 통과
4. ✅ 롤백 준비 완료

**시작하시겠습니까?**

