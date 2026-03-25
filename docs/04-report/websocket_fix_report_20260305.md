# WebSocket Race Condition 수정 보고서

**작업일**: 2026-03-05
**빌드 결과**: ✓ 성공 (19.41s)

---

## 문제 원인

### 증상
```
WebSocket connection to 'wss://...supabase.co/realtime/...' failed:
WebSocket is closed before the connection is established.
```

### 근본 원인: async 구독의 race condition

모든 Realtime 구독 파일에서 동일 패턴 사용:

```ts
// 문제 패턴
let cleanup: (() => void) | undefined;
getAuthClient(session).then(client => {
  const channel = client.channel(...).subscribe(); // 비동기 실행
  cleanup = () => { channel.unsubscribe(); };      // 나중에 설정
});
return () => { cleanup?.(); }; // unmount 시 즉시 실행 → cleanup = undefined
```

컴포넌트가 `getAuthClient().then()` resolve 전에 unmount되면:
1. cleanup 함수 실행 → `cleanup`이 `undefined` → 아무 일도 안 함
2. `.then()` resolve → 채널 생성 + 구독 시작 (이미 unmount된 상태)
3. WebSocket 연결 시도 → 즉시 닫힘 → 에러 발생

---

## 수정 내용

### 수정 패턴 (mounted 플래그)

```ts
let mounted = true;                              // 추가
let cleanup: (() => void) | undefined;
getAuthClient(session).then(client => {
  if (!mounted) return;                          // 추가: unmount 후 구독 차단
  const channel = client.channel(...).subscribe();
  cleanup = () => { channel.unsubscribe(); client.removeChannel(channel); };
});
return () => { mounted = false; cleanup?.(); }; // mounted = false 추가
```

### 수정 파일 (8개)

| 파일 | 채널 수 | 수정 내용 |
|---|---|---|
| `components/dashboard/useFacilityAdmin.ts` | 2 (consultations, reservations) | mounted 플래그 추가 |
| `components/Partner/usePartnerDashboard.ts` | 3 (consultations, reservations, sangjo_contracts) | mounted 플래그 추가 |
| `components/dashboard/MyConsultations.tsx` | 1 (ai_consultations) | mounted 플래그 추가 |
| `components/dashboard/ConsultationList.tsx` | 1 (consultations) | mounted 플래그 추가 |
| `components/Partner/OperationsManagement.tsx` | 1 (partner_operations) | mounted 플래그 추가 |
| `components/Partner/LiveConsultation.tsx` | 1 (partner_conversations) | mounted 플래그 추가 |
| `components/AI/ScenarioBot.tsx` | 1 (ai_consultations) | mounted 플래그 추가 |
| `hooks/useNotifications.ts` | 1 (user_notifications) | mounted 플래그 추가 |

### 삭제 파일 (2개, dead code)

| 파일 | 이유 |
|---|---|
| `hooks/useRealtimeSubscription.ts` | import 없음 + anon 클라이언트 직접 사용 (규칙 위반) |
| `lib/queries/consultation.ts` | import 없음 + anon 클라이언트 직접 사용 (규칙 위반) |

---

## 재발 방지 규칙

> **규칙**: `getAuthClient(session).then()` 패턴에는 반드시 `mounted` 플래그 사용
>
> async `.then()` 내부에서 구독/채널 생성 시:
> 1. `let mounted = true` 선언
> 2. `.then()` 내부 첫 줄에 `if (!mounted) return`
> 3. cleanup에 `mounted = false` 포함
>
> 위반 시: 컴포넌트 마운트/언마운트가 빠른 환경(React StrictMode, 빠른 네비게이션)에서 WebSocket 에러 발생
