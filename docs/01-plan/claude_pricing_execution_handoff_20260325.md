# Claude Pricing Execution Handoff

작성일: 2026-03-25
목적: Claude가 요금제 및 PortOne 연동 작업을 계속 이어서 수행할 수 있도록, 기준 문서와 현재 작업 지시를 한 곳에 모아두는 실행용 문서입니다.

## 1. 운영 규칙

- 이 문서는 Claude 작업 지시 누적 문서로 사용한다.
- 새 지시는 항상 `## 4. 업데이트 로그`에 날짜와 함께 추가한다.
- 최신 실행 기준은 항상 `## 3. 현재 작업 지시`를 우선한다.
- 이미 끝난 내용은 삭제하지 말고 로그로 남긴다.
- 브랜치는 `dev`, `main`만 사용한다.
- 문서는 `docs/` 하위에만 저장한다.

## 2. 기준 문서

- `docs/01-plan/features/subscription_pricing_migration.plan.md`
- `docs/01-plan/portone_application_checklist_memorimap_20260325.md`
- `docs/01-plan/portone_nhn_kcp_direction_20260325.md`
- `docs/01-plan/pg_review_submission_rules_20260325.md`
- `docs/01-plan/repository_workflow_unification.plan.md`

## 3. 현재 작업 지시

### 3.1 작업 목표

- PortOne 연동과 요금제 구조를 v1 기준으로 정리한다.
- NHN KCP를 우선 기준으로 구현한다.
- 다만 KG이니시스도 추후 붙일 수 있도록 PG 종속 코드는 하드코딩하지 않는다.

### 3.2 구현 원칙

1. Track A를 우선한다.
- 실결제 안정화가 먼저다.
- 기존 월 구독 구조를 깨지 말고 보강한다.

2. Track B는 스키마/타입/조회 경로부터 진행한다.
- `billing_cycle`
- `display_plan_name`
- `discount_amount`
- `discount_reason`
- 기존 가입자 `monthly` 백필 고려

3. `plan_id` 정합성을 먼저 맞춘다.
- personal / facility canonical `plan_id` 규칙을 확정 반영한다.
- personal 결제 후 저장되는 `plan_id`와 문서 기준이 일치하는지 확인한다.
- 시설 결제 이력과 구독 상태 기록도 함께 점검한다.

4. UI는 기존 컴포넌트를 재사용한다.
- `components/SubscriptionPlans.tsx`
- `components/PersonalSubscriptionPlans.tsx`
- 처음부터 새로 만들지 말고 v1 정책 기준으로 수정한다.

5. 상조는 파일럿 고정비형으로 유지한다.
- `150만원/월, 3개월`
- 이후 `SJ_STARTER` 정가 전환 원칙
- 수수료형 로직은 넣지 않는다.

### 3.3 PG 구현 원칙

- NHN KCP 우선
- KG이니시스도 추후 붙일 수 있도록 provider/channel 설정은 분리 가능하게 유지
- 특정 PG 문자열을 화면/비즈니스 로직 전역에 직접 하드코딩하지 않는다
- 결제 요청 파라미터, 채널 키, 검증 로직은 추상화 가능한 구조로 정리한다

### 3.4 우선 작업 순서

1. 현재 결제/구독 데이터 구조 점검
2. 최소 스키마 변경안 반영
3. 타입/쿼리 수정
4. 기존 요금제 화면에 v1 정책 반영
5. 결제 성공 후 저장 흐름 검증
6. 백필/검증 계획 정리

### 3.5 작업 후 보고 형식

- 변경 파일
- 마이그레이션 여부
- NHN KCP 기준 현재 동작 범위
- KG이니시스 추가 시 남은 작업
- 테스트 또는 미검증 항목

## 4. 업데이트 로그

### 2026-03-25 1차 등록

- NHN KCP 우선 방향 확정
- KG이니시스 확장 가능 구조 유지 원칙 추가
- 개인/시설/상조 v1 요금제 정책 문서 기준 반영
- 상조는 수수료형이 아니라 파일럿 고정비형으로 유지

## 5. 다음 지시 추가 템플릿

아래 형식으로 이어서 추가:

```md
### YYYY-MM-DD 업데이트

- 배경:
- 새 결정:
- Claude 작업 지시:
- 검증 기준:
- 보류 사항:
```

## 6. 빠른 복사용 지시문

```text
기준 문서:
- docs/01-plan/features/subscription_pricing_migration.plan.md
- docs/01-plan/claude_pricing_execution_handoff_20260325.md

작업 원칙:
- NHN KCP 우선
- KG이니시스 추후 확장 가능 구조 유지
- Track A 우선, Track B는 스키마/타입/조회 경로부터
- 기존 요금제 UI 재사용
- 상조는 파일럿 고정비형 유지

작업 후에는 변경 파일, 마이그레이션 여부, 현재 동작 범위, 남은 작업을 같이 보고하세요.
```

## 7. 2026-03-25 추가 상태 확인

### 현재 확인 결과

- 최신 구현 커밋은 `b0a922e feat(pricing): implement v1 pricing structure + payment flow hardening`
- 이후 커밋 `4f97d6a`는 코드 변경이 아니라 핸드오프/방향 문서 추가다.
- 현재 코드 기준으로 구독 결제 채널은 personal / facility 모두 `billing`으로 반영되어 있다.
- 현재 코드 기준으로 personal 무료 비교상담 `5회`, facility LIGHT `사진 20장 / AI 50회`가 반영되어 있다.
- `subscription_payments_insert_personal` 정책은 `supabase/migrations/20260325_pricing_v1_schema.sql`에 포함되어 있다.

### 이번 후속 정리

- `types/db.ts`
  - canonical personal plan 타입과 legacy 허용값을 분리했다.
- `components/SuperAdmin/PersonalSubscriptionManager.tsx`
  - `PERSONAL_BASIC`를 `베이직 (단종)`으로 표시하도록 수정했다.
- `npm run typecheck`
  - 통과

### 남은 확인 항목

1. Supabase에 `20260325_pricing_v1_schema.sql`이 실제 적용되었는지 확인
2. 운영 DB에 `PERSONAL_BASIC` 또는 소문자 personal plan_id 잔여 row가 남아 있는지 확인
3. 남아 있으면 canonical 값 기준으로 백필 여부 결정
