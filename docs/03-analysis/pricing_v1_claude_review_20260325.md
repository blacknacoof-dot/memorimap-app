# Pricing V1 Claude Review

작성일: 2026-03-25
목적: Claude의 요금제 v1 구현 보고에 대해, 커밋 전 다시 확인해야 할 리스크와 수정 지시를 정리한다.

## 결론

현재 상태로는 커밋 승인 보류가 맞다.

이유:

- `subscription_payments` personal insert가 현재 RLS 정책과 충돌할 가능성이 크다.
- NHN KCP 분리 방향과 실제 구독 결제 채널 사용이 아직 일치하지 않는다.
- personal canonical `plan_id` 정합성이 아직 맞지 않는다.
- 개인/시설 UI가 v1 확정안과 일부 다르게 반영되어 있다.

## 핵심 확인 사항

### 1. Personal 결제이력 insert는 현재 RLS 기준으로 실패 가능성이 큼

- 새 함수 [lib/queries.ts](C:/Users/black/Desktop/memorimap/lib/queries.ts)에서 client로 `subscription_payments` insert를 수행한다.
- 위치:
  - [lib/queries.ts](C:/Users/black/Desktop/memorimap/lib/queries.ts#L1609)
- 그러나 기존 정책은 `service_role`만 INSERT 허용이다.
- 근거:
  - [20260223_critical_fixes.sql](C:/Users/black/Desktop/memorimap/supabase/migrations/20260223_critical_fixes.sql#L98)
- 이번 마이그레이션은 SELECT 정책만 바꾸고 INSERT 정책은 바꾸지 않았다.
- 따라서 “personal 결제이력 추가”는 현재 코드만으로는 실제 동작이 보장되지 않는다.

판정:
- Edge Function 경유로 옮기거나
- subscription_payments INSERT 정책 변경을 명시적으로 마이그레이션에 포함해야 한다.

### 2. NHN KCP 분리 목표와 실제 채널 사용이 다름

- 개인 구독 결제:
  - [PersonalSubscriptionPlans.tsx](C:/Users/black/Desktop/memorimap/components/PersonalSubscriptionPlans.tsx#L175)
- 시설 구독 결제:
  - [SubscriptionPlans.tsx](C:/Users/black/Desktop/memorimap/components/SubscriptionPlans.tsx#L221)

둘 다 현재 `getChannelKey('general')`를 사용한다.

즉:

- 보고에는 `general / billing` 역할 분리 구조가 들어갔지만
- 실제 구독 결제는 아직 billing 채널을 타지 않는다.

판정:
- 구독 결제는 `billing`
- 단건/일반결제만 `general`
로 수정 필요

### 3. Personal canonical `plan_id` 정합성이 아직 맞지 않음

- 결제 검증은 `plan.nameEn` 기준이다.
- 하지만 저장은 여전히 소문자 `plan.id`를 사용한다.
- 위치:
  - [PersonalSubscriptionPlans.tsx](C:/Users/black/Desktop/memorimap/components/PersonalSubscriptionPlans.tsx#L217)
  - [lib/queries.ts](C:/Users/black/Desktop/memorimap/lib/queries.ts#L1592)
- 타입도 아직 `personal_basic`을 포함한다.
- 위치:
  - [types/db.ts](C:/Users/black/Desktop/memorimap/types/db.ts#L19)

판정:
- 저장값도 `PERSONAL_*` 기준으로 맞추고
- 타입 정의도 문서 기준과 일치시켜야 한다.

### 4. UI 반영이 v1 확정안과 일부 다름

시설 라이트:

- 문서 기준: 사진 20장, AI 50회
- 실제:
  - [SubscriptionPlans.tsx](C:/Users/black/Desktop/memorimap/components/SubscriptionPlans.tsx#L59) 사진 무제한
  - [SubscriptionPlans.tsx](C:/Users/black/Desktop/memorimap/components/SubscriptionPlans.tsx#L60) AI 100회

개인 무료:

- 문서 기준: 상조 AI 비교상담 5회
- 실제:
  - [PersonalSubscriptionPlans.tsx](C:/Users/black/Desktop/memorimap/components/PersonalSubscriptionPlans.tsx#L43) 10회

개인 프리미엄:

- 문서 기준: `전담 상담 우선 연결`은 v1 제외
- 실제:
  - [PersonalSubscriptionPlans.tsx](C:/Users/black/Desktop/memorimap/components/PersonalSubscriptionPlans.tsx#L72) 여전히 포함

판정:
- UI 문구와 제한값을 문서 v1 확정안에 다시 맞춰야 한다.

## 클로드 수정 지시

```text
커밋 보류하세요. 아래 4건 수정 후 다시 보고해주세요.

1. personal subscription_payments insert는 현재 client 경로라 RLS에 막힐 가능성이 큽니다.
- 기존 subscription_payments INSERT 정책(service_role only)과 충돌합니다.
- Edge Function으로 옮기거나, 의도된 INSERT 정책 변경을 마이그레이션에 포함하세요.

2. 개인/시설 구독 결제는 여전히 getChannelKey('general')를 사용합니다.
- NHN KCP 분리 방향이면 구독 결제는 billing 역할 채널을 사용하도록 수정하세요.
- 일반결제만 general 유지하세요.

3. personal canonical plan_id 정합성이 아직 안 맞습니다.
- 저장도 PERSONAL_* 기준으로 맞추고
- types/db.ts에서 personal_basic 제거 여부까지 정리하세요.

4. UI를 v1 확정안과 다시 맞추세요.
- 시설 LIGHT: 사진 20장, AI 50회
- 개인 무료 상조 비교상담: 5회
- 개인 프리미엄: 전담 상담 우선 연결 제거
```

## 참고 문서

- [subscription_pricing_migration.plan.md](C:/Users/black/Desktop/memorimap/docs/01-plan/features/subscription_pricing_migration.plan.md)
- [claude_pricing_execution_handoff_20260325.md](C:/Users/black/Desktop/memorimap/docs/01-plan/claude_pricing_execution_handoff_20260325.md)

## 2026-03-25 후속 확인 메모

- 위 문서에서 지적한 4개 이슈 중 코드 기준으로 확인된 상태:
  - personal / facility 구독 결제 채널은 현재 `billing` 사용
  - personal 무료 비교상담 `5회` 반영
  - facility LIGHT `사진 20장`, `AI 50회` 반영
  - `subscription_payments_insert_personal` 정책은 pricing v1 마이그레이션에 포함
- 추가 정리:
  - `types/db.ts`에서 canonical personal 타입과 legacy 허용값을 분리
  - `components/SuperAdmin/PersonalSubscriptionManager.tsx`에서 `PERSONAL_BASIC`를 `베이직 (단종)`으로 표기
- 아직 별도 확인이 필요한 항목:
  - Supabase 실DB에 `20260325_pricing_v1_schema.sql` 적용 여부
  - 운영 데이터에 legacy personal plan 값이 남아 있는지 여부

## 2026-03-25 NHN KCP 테스트 보정

- `VITE_PORTONE_BILLING_CHANNEL_KEY` 미설정 fallback은 현재 테스트 가능 상태를 뜻하지만, KCP 빌링키 기반 자동 정기결제까지 보장하는 것은 아니다.
- 상조 검증 시 입력 plan은 `SJ_STARTER`여도 실제 DB 저장 plan_id는 `sj_starter` 기준으로 확인해야 한다.
- `PORTONE_API_SECRET` 확인 위치는 프론트 env보다 Supabase Edge Function secret이 우선이다.

## 2026-03-25 facility 결제 RLS 재검토

- `verify-payment`의 `planId='SJ_STARTER'` 검증과 `facility_subscriptions.plan_id='sj_starter'` 저장은 서로 다른 단계이므로 대소문자 차이 자체는 실패 원인이 아니다.
- 실제 리스크는 facility 결제이력 insert 경로다.
- `updateFacilitySubscription()`은 auth client로 `subscription_payments` insert를 수행하지만, 신규 정책 `subscription_payments_insert_service`는 service_role only다.
- 따라서 기존 `payments_insert_service_or_owner` 정책이 남아 있는 동안만 facility / sangjo 결제 insert가 통과할 가능성이 높다.
- 결론: 구정책을 먼저 DROP하면 안 된다. facility insert 경로를 새 정책과 맞춘 뒤 DROP해야 한다.
