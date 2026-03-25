# ContractDetailDrawer 구현 계획서

> 작성일: 2026-03-06
> 목적: 계약 관제 상세 Drawer — 슈퍼관리자 모니터링 전용 (A안: 읽기 + 메모)
> 기준 커밋: 이전 작업 완료 시점

---

## 1. 리서치 결과 요약

### 1-1. SangjoContract 타입 (types/sangjo.ts:113~139)

현재 필드:
```
id, contract_number, sangjo_id, customer_name, customer_phone,
customer_address, service_type, religion, region, total_price,
status, emergency_level, platform_fee, assigned_counselor,
created_at, death_time, current_location, application_type,
preferred_call_time, timeline
```

- `admin_memo` 필드 없음 → 타입 추가 + DB 마이그레이션 필요

### 1-2. SangjoContractStatus (types/sangjo.ts:81~89)

한글 상태 7종:
```
'상담신청' | '예약대기' | '계약진행' | '임종발생' | '현장도착' | '염습중' | '장례식진행' | '완료'
```

### 1-3. RLS 확인 결과

| 정책명 | 파일 | 결과 |
|-------|------|------|
| sangjo_contracts_select_v2 | 20260301_fix_sangjo_contracts_select_update_rls.sql | is_super_admin() OR sangjo_hq_admins JOIN |
| sangjo_contracts_update_v2 | 동일 파일 | is_super_admin() OR sangjo_hq_admins JOIN |

- 슈퍼관리자 UPDATE 권한 확보됨 ✅

### 1-4. Realtime 구독 (hooks/useContractMonitoring.ts)

- `sangjo_contracts` 테이블 변경 이벤트 실시간 구독 중
- UPDATE 이벤트 발생 시 `contracts` state 자동 갱신 ✅
- `updateAdminMemo` 호출 후 별도 refresh 불필요

### 1-5. z-index 레이어맵 (코드베이스 전수 조사)

| 컴포넌트 | z-index |
|---------|---------|
| SideMenu | z-[60] / z-[70] |
| SideMenuDrawer (SuperAdmin) | z-[100] |
| BottomNav | z-[200] |
| FacilitySheet | z-[210] |
| Lightbox | z-[220] |
| SangjoCompanySheet | z-[250] |
| PartnerDetailModal | z-[9999] |
| **ContractDetailDrawer (신규)** | **z-[300]** ← SuperAdmin 전용, 기존 레이어와 충돌 없음 |

### 1-6. Drawer 패턴 레퍼런스

SideMenu.tsx (components/SideMenu.tsx:56):
```tsx
// 왼쪽 슬라이드 패턴 — 오른쪽으로 반전하여 사용
fixed inset-y-0 left-0 w-[280px] bg-white z-[70] shadow-2xl
transform transition-transform duration-300
${isOpen ? 'translate-x-0' : '-translate-x-full'}
```

ContractDetailDrawer는 우측 슬라이드:
```tsx
fixed inset-y-0 right-0 w-96 bg-white z-[300] shadow-2xl
transform transition-transform duration-300
${isOpen ? 'translate-x-0' : 'translate-x-full'}
```

### 1-7. confirmAsync 패턴

- import 경로: `'../../src/components/common/ConfirmModal'`
- 사용 패턴: `if (!await confirmAsync('메시지')) return;`
- A안에서는 비가역 액션 없음 → confirmAsync 불필요

### 1-8. API 패턴 (lib/api/superAdmin.ts)

- 함수 시그니처: `(params, client: SupabaseClient) => Promise<void>`
- 에러 시 `throw error`
- audit_logs INSERT 패턴 확인됨 (updateUserRole 참조)

### 1-9. admin_memo 현황

- 코드베이스 전체 grep: 0건
- migration 전체 grep: 0건
- **완전 신규 추가**

---

## 2. 구현 범위 (A안 확정)

### 포함
- 계약 기본 정보 표시 (읽기 전용)
- 관리자 메모 저장 (유일한 쓰기 액션)
- 우측 슬라이드 Drawer

### 제외 (B안 요소, 구현 안 함)
- 상태 변경 (status)
- 긴급도 변경 (emergency_level)
- 상담 종료 버튼

---

## 3. 작업 파일 및 순서

| 단계 | 파일 | 작업 종류 | 비고 |
|------|------|----------|------|
| 1 | `types/sangjo.ts` | 수정 | `admin_memo?: string` 추가 |
| 2 | `supabase/migrations/20260306000000_add_contract_admin_memo.sql` | 신규 | DB 컬럼 추가 |
| 3 | `hooks/useContractMonitoring.ts` | 수정 | `updateAdminMemo` 함수 추가 + return |
| 4 | `components/SuperAdmin/ContractDetailDrawer.tsx` | 신규 | Drawer 컴포넌트 |
| 5 | `components/SuperAdmin/ContractMonitoring.tsx` | 수정 | Drawer 상태 추가, 관제 버튼 연결 |

---

## 4. 각 파일 상세 스펙

### [1] types/sangjo.ts

```ts
// 변경 위치: SangjoContract 인터페이스 마지막 필드 뒤 (139번 줄 앞)
admin_memo?: string;
```

### [2] supabase/migrations/20260306000000_add_contract_admin_memo.sql

```sql
-- sangjo_contracts 테이블에 슈퍼관리자 메모 컬럼 추가
ALTER TABLE public.sangjo_contracts
  ADD COLUMN IF NOT EXISTS admin_memo TEXT;

COMMENT ON COLUMN public.sangjo_contracts.admin_memo
  IS '슈퍼관리자 관제 메모 — 파트너/고객에게 노출되지 않음';
```

### [3] hooks/useContractMonitoring.ts

추가 함수:
```ts
const updateAdminMemo = async (contractId: string, memo: string): Promise<void> => {
    const { error } = await client
        .from('sangjo_contracts')
        .update({ admin_memo: memo })
        .eq('id', contractId);
    if (error) throw error;
    // Realtime이 contracts state를 자동 갱신하므로 수동 refresh 불필요
};
```

return에 추가:
```ts
return {
    contracts,
    aiConsultations,
    loading,
    joinedConversationId,
    handleJoinChat,
    updateAdminMemo,  // 추가
};
```

### [4] components/SuperAdmin/ContractDetailDrawer.tsx (신규)

UI 구성:
```
[fixed inset-y-0 right-0 w-96 z-[300] bg-white shadow-2xl]

─────────────────────────
 헤더
 계약 관제 상세    [X]
─────────────────────────
 계약 기본 정보 (읽기 전용)
  - 계약번호: #XXXX
  - 고객명: OOO
  - 지역: OO
  - 접수일시: YYYY.MM.DD HH:mm
  - 서비스유형: OO
  - 담당 상조사: OO
  - 긴급도 배지 (normal=초록, urgent=노랑, critical=빨강)
  - 현재 상태 배지
─────────────────────────
 관리자 메모
 [textarea — 500자 제한]
 [저장] (isSubmitting 처리)
─────────────────────────
```

Props 인터페이스:
```ts
interface ContractDetailDrawerProps {
    contract: SangjoContract | null;
    isOpen: boolean;
    onClose: () => void;
    onSaveMemo: (contractId: string, memo: string) => Promise<void>;
}
```

상태:
```ts
const [memo, setMemo] = useState('');
const [isSaving, setIsSaving] = useState(false);
```

useEffect — contract 변경 시 memo 초기화:
```ts
useEffect(() => {
    setMemo(contract?.admin_memo ?? '');
}, [contract?.id]);
```

저장 핸들러:
```ts
const handleSave = async () => {
    if (isSaving || !contract) return;
    setIsSaving(true);
    try {
        await onSaveMemo(contract.id, memo);
        toast.success('메모가 저장되었습니다.');
    } catch (e: unknown) {
        toast.error('저장 실패: ' + (e instanceof Error ? e.message : '알 수 없는 오류'));
    } finally {
        setIsSaving(false);
    }
};
```

배경 오버레이 클릭 시 닫기:
```tsx
<div className="fixed inset-0 z-[299] bg-black/40" onClick={onClose} />
```

ESC 키 닫기:
```ts
useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
}, [isOpen, onClose]);
```

긴급도 배지 컬러:
```ts
const EMERGENCY_BADGE = {
    critical: 'bg-red-100 text-red-700',
    urgent:   'bg-amber-100 text-amber-700',
    normal:   'bg-green-100 text-green-700',
} as const;
```

### [5] components/SuperAdmin/ContractMonitoring.tsx

추가 state:
```ts
const [drawerContract, setDrawerContract] = useState<SangjoContract | null>(null);
```

훅에서 updateAdminMemo 추출:
```ts
const { contracts, aiConsultations, loading, handleJoinChat, updateAdminMemo } = useContractMonitoring(client);
```

관제 버튼 onClick 수정 (contract 타입):
```tsx
onClick={() => item.type === 'ai'
    ? handleJoinChat(item)
    : setDrawerContract(item)  // toast.info 대신 Drawer 오픈
}
```

ContractDetailDrawer 렌더링 (return 안, 최상단):
```tsx
<ContractDetailDrawer
    contract={drawerContract}
    isOpen={drawerContract !== null}
    onClose={() => setDrawerContract(null)}
    onSaveMemo={updateAdminMemo}
/>
```

---

## 5. 데이터 흐름

```
사용자: 관제 카드 "관제" 버튼 클릭 (contract 타입)
  → ContractMonitoring: setDrawerContract(item)
  → ContractDetailDrawer isOpen=true, 계약 정보 표시
  → 사용자: 메모 입력 후 "저장" 클릭
  → handleSave → onSaveMemo(contract.id, memo)
  → updateAdminMemo → client.from('sangjo_contracts').update({ admin_memo })
  → Supabase Realtime: UPDATE 이벤트 발생
  → useContractMonitoring: contracts state 자동 갱신 (contract.admin_memo 포함)
  → 다음 번 Drawer 열 때 memo 최신값 표시
```

---

## 6. 리스크 분석

| 리스크 | 가능성 | 대응 |
|--------|--------|------|
| admin_memo 컬럼 마이그레이션 미실행 | 중 | 마이그레이션 먼저 실행 후 코드 배포 |
| Realtime 미구독 상태에서 memo 갱신 안 됨 | 낮음 | useContractMonitoring 이미 구독 중 |
| z-[300]과 다른 레이어 충돌 | 낮음 | SuperAdmin 내부에만 렌더되므로 안전 |
| 300줄 초과 | 낮음 | ContractDetailDrawer 예상 ~120줄, ContractMonitoring +15줄 |
| memo 상태 stale (이전 contract 메모 잔류) | 중 | useEffect([contract?.id])로 초기화 |

---

## 7. 검증 기준

- [x] "관제" 버튼 클릭 → Drawer 우측에서 슬라이드 오픈
- [x] 계약 기본 정보 정확히 표시 (계약번호, 고객명, 지역, 접수일시, 긴급도, 상태)
- [x] 기존 admin_memo 있으면 textarea에 자동 입력
- [x] 메모 저장 → toast.success
- [x] 저장 중 중복 클릭 → 첫 요청만 처리 (isSaving 가드)
- [x] 저장 실패 → toast.error + isSaving 해제
- [x] X 버튼 클릭 → Drawer 닫힘
- [x] 배경 클릭 → Drawer 닫힘
- [x] ESC 키 → Drawer 닫힘
- [x] 다른 계약 카드 클릭 → Drawer 내용 교체 (stale 없음)
- [x] AI 카드 "관제" 버튼 → 기존 handleJoinChat 동작 유지
- [x] 빌드 성공
- [x] 300줄 이하

---

## 8. 수동 작업 완료

- [x] Supabase Dashboard SQL Editor 실행 완료 (2026-03-06)
```sql
ALTER TABLE public.sangjo_contracts
  ADD COLUMN IF NOT EXISTS admin_memo TEXT;
```

## 9. 구현 완료 (2026-03-06)

수정/생성 파일:
- types/sangjo.ts — admin_memo?: string 추가
- supabase/migrations/20260306000000_add_contract_admin_memo.sql — 마이그레이션 파일
- hooks/useContractMonitoring.ts — updateAdminMemo 추가
- components/SuperAdmin/ContractDetailDrawer.tsx — 신규 생성
- components/SuperAdmin/ContractMonitoring.tsx — Drawer 연결

---

## 9. 의존성 체계

```
[A] types/sangjo.ts          (의존성 없음 — 먼저)
[B] migration SQL            (독립 — DB 수동 실행)
[C] useContractMonitoring.ts (A 완료 후)
[D] ContractDetailDrawer.tsx (A, C 완료 후)
[E] ContractMonitoring.tsx   (D 완료 후)
```
