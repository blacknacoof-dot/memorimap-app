# 요금제 Feature Gating SQL 검증 가이드

이 문서는 Supabase SQL Editor에서 그대로 복붙해서 실행할 수 있게 쿼리를 단락별로 나눈 검증용 가이드다.

## 0. 사전 확인

정확한 검증 기준은 아래 최신 구현을 따른다.

- `supabase/migrations/20260327_subscription_cancelling_state.sql`
  - 최신 `get_user_plan_info()`
- `supabase/migrations/20260227_feature_gating.sql`
  - `check_and_increment_user_quota()`
  - `decrement_user_favorites_count()`
- `supabase/migrations/20260310000000_update_sangjo_quota_limits.sql`
  - 최신 `sangjo_compare` 제한값

주의:

- `check_and_increment_user_quota()` 계열 함수는 실행할 때마다 카운터가 실제로 증가한다.
- `FREE`, `BASIC`, `PREMIUM` 검증은 같은 계정에서 섞지 말고 계정별로 따로 실행하는 것이 안전하다.
- `get_user_plan_info()`와 `check_and_increment_user_quota()`는 인증 컨텍스트 유무에 따라 동작이 다르다.
  - 최신 `get_user_plan_info()`는 인증이 없으면 예외를 던지지 않고 free-plan 형태의 기본값과 `limits = {}`를 반환한다.
  - `check_and_increment_user_quota()`와 `decrement_user_favorites_count()`는 인증이 없으면 `Not authenticated` 예외를 던진다.
- 따라서 SQL Editor에서 `get_user_plan_info()` 결과가 정상처럼 보여도, 실제 quota RPC 검증은 인증된 세션 또는 테스트 계정으로 따로 확인해야 한다.

## 1. 현재 플랜 정보 확인

먼저 현재 계정의 플랜과 한도값을 확인한다.

```sql
select get_user_plan_info();
```

확인 포인트:

- `plan_name`
- `limits.ai_consult_per_category`
- `limits.sangjo_compare`
- `limits.favorites`
- `limits.ending_note`
- `limits.family_sharing`

인증이 없는 SQL Editor에서 확인할 점:

- `plan_name`이 기본 free 형태로 보일 수 있다.
- `limits = {}`면 인증된 사용자 컨텍스트가 아니라는 의미로 해석해야 한다.

## 2. FREE 검증

FREE 계정에서는 아래 순서로 실행한다.

### 2.1 AI 상담

```sql
select check_and_increment_user_quota('ai_consult', 'funeral_home');
select check_and_increment_user_quota('ai_consult', 'funeral_home');
```

기대값:

- 1회째 `allowed: true`
- 2회째 `allowed: false`
- AI 상담 카테고리별 월 1회 제한 확인

### 2.2 상조 비교

최신 제한값은 FREE 월 10회다.

```sql
select check_and_increment_user_quota('sangjo_compare', null);
select check_and_increment_user_quota('sangjo_compare', null);
select check_and_increment_user_quota('sangjo_compare', null);
select check_and_increment_user_quota('sangjo_compare', null);
select check_and_increment_user_quota('sangjo_compare', null);
select check_and_increment_user_quota('sangjo_compare', null);
select check_and_increment_user_quota('sangjo_compare', null);
select check_and_increment_user_quota('sangjo_compare', null);
select check_and_increment_user_quota('sangjo_compare', null);
select check_and_increment_user_quota('sangjo_compare', null);
select check_and_increment_user_quota('sangjo_compare', null);
```

기대값:

- 1~10회째 `allowed: true`
- 11회째 `allowed: false`
- 상조 비교 상담 월 10회 제한 확인

### 2.3 즐겨찾기

```sql
select check_and_increment_user_quota('favorite', 'facility');
select check_and_increment_user_quota('favorite', 'facility');
select check_and_increment_user_quota('favorite', 'facility');
select check_and_increment_user_quota('favorite', 'facility');
select check_and_increment_user_quota('favorite', 'facility');
select check_and_increment_user_quota('favorite', 'facility');
```

기대값:

- 1~5회째 `allowed: true`
- 6회째 `allowed: false`
- 즐겨찾기 5개 제한 확인

### 2.4 플랜 정보 재확인

```sql
select get_user_plan_info();
```

확인 포인트:

- `limits.ending_note = 'basic'`

## 3. BASIC 검증

BASIC 계정에서는 아래 순서로 실행한다.

### 3.1 AI 상담

```sql
select check_and_increment_user_quota('ai_consult', 'funeral_home');
select check_and_increment_user_quota('ai_consult', 'funeral_home');
select check_and_increment_user_quota('ai_consult', 'funeral_home');
select check_and_increment_user_quota('ai_consult', 'funeral_home');
```

기대값:

- 1~3회째 `allowed: true`
- 4회째 `allowed: false`
- AI 상담 카테고리별 월 3회 제한 확인

### 3.2 상조 비교

최신 제한값은 BASIC 월 15회다.

```sql
select check_and_increment_user_quota('sangjo_compare', null);
select check_and_increment_user_quota('sangjo_compare', null);
select check_and_increment_user_quota('sangjo_compare', null);
select check_and_increment_user_quota('sangjo_compare', null);
select check_and_increment_user_quota('sangjo_compare', null);
select check_and_increment_user_quota('sangjo_compare', null);
select check_and_increment_user_quota('sangjo_compare', null);
select check_and_increment_user_quota('sangjo_compare', null);
select check_and_increment_user_quota('sangjo_compare', null);
select check_and_increment_user_quota('sangjo_compare', null);
select check_and_increment_user_quota('sangjo_compare', null);
select check_and_increment_user_quota('sangjo_compare', null);
select check_and_increment_user_quota('sangjo_compare', null);
select check_and_increment_user_quota('sangjo_compare', null);
select check_and_increment_user_quota('sangjo_compare', null);
select check_and_increment_user_quota('sangjo_compare', null);
```

기대값:

- 1~15회째 `allowed: true`
- 16회째 `allowed: false`
- 상조 비교 상담 월 15회 제한 확인

### 3.3 플랜 정보 재확인

```sql
select get_user_plan_info();
```

확인 포인트:

- `limits.favorites = 20`
- `limits.ending_note = 'full'`

## 4. PREMIUM 검증

PREMIUM 계정에서는 아래 순서로 실행한다.

```sql
select check_and_increment_user_quota('ai_consult', 'funeral_home');
select check_and_increment_user_quota('ai_consult', 'funeral_home');
select check_and_increment_user_quota('ai_consult', 'funeral_home');
select check_and_increment_user_quota('ai_consult', 'funeral_home');
select check_and_increment_user_quota('ai_consult', 'funeral_home');
```

```sql
select check_and_increment_user_quota('sangjo_compare', null);
select check_and_increment_user_quota('sangjo_compare', null);
select check_and_increment_user_quota('sangjo_compare', null);
select check_and_increment_user_quota('sangjo_compare', null);
select check_and_increment_user_quota('sangjo_compare', null);
```

```sql
select check_and_increment_user_quota('favorite', 'facility');
select check_and_increment_user_quota('favorite', 'facility');
select check_and_increment_user_quota('favorite', 'facility');
select check_and_increment_user_quota('favorite', 'facility');
select check_and_increment_user_quota('favorite', 'facility');
```

기대값:

- 모두 `allowed: true`
- PREMIUM은 무제한이라 `limit = -1` 확인

```sql
select get_user_plan_info();
```

확인 포인트:

- `limits.ending_note = 'full_pdf'`
- `limits.family_sharing = 3`

## 5. 즐겨찾기 롤백 확인

즐겨찾기 추가 실패 후 카운터가 원복되는지 확인할 때 사용한다.

```sql
select decrement_user_favorites_count(false);
select decrement_user_favorites_count(true);
```

확인 포인트:

- 일반 즐겨찾기와 상조 즐겨찾기가 각각 1 감소해야 한다.
- `0` 미만으로 내려가지 않는다.

## 6. 월간 리셋 확인

`last_reset_at`이 이번 달보다 과거일 때, `get_user_plan_info()` 호출 시 월간 카운터가 초기화되는지 확인한다.

```sql
update user_subscriptions
set last_reset_at = '2026-02-01',
    ai_consult_used = 2,
    sangjo_compare_used = 3,
    ai_consult_by_category = '{"funeral_home":2,"memorial_facility":1,"pet_funeral":0}'::jsonb
where user_id = '<대상_user_id>';

select get_user_plan_info();
```

기대값:

- `last_reset_at`이 이번 달 1일 기준으로 갱신
- `sangjo_compare_used = 0`
- `ai_consult_by_category`가 0으로 초기화

주의:

- 최신 `get_user_plan_info()` 반환값에는 `ai_consult_used` 필드가 없다.
- 따라서 이 블록에서 직접 확인 가능한 값은 `sangjo_compare_used`와 `ai_consult_by_category`다.
- `ai_consult_used` 자체를 확인하려면 `user_subscriptions` 테이블을 직접 조회해야 한다.

추가 확인 쿼리:

```sql
select user_id, last_reset_at, ai_consult_used, sangjo_compare_used, ai_consult_by_category
from user_subscriptions
where user_id = '<대상_user_id>';
```

## 7. 실행 순서 추천

1. `select get_user_plan_info();`
2. FREE/BASIC/PREMIUM 중 하나의 계정으로 해당 블록 실행
3. `select get_user_plan_info();`로 카운터 반영 확인
4. 월간 리셋 블록 실행
5. `select get_user_plan_info();`와 `user_subscriptions` 직접 조회로 초기화 확인

## 8. 정적 검증 메모

정적 검증 시 참고할 실제 코드 경로:

- AI 상담 게이트
  - `components/AI/ChatInterface.tsx`
  - `components/Consultation/ConsultationView.tsx`
- 상조 비교 게이트
  - `components/Consultation/SangjoConsultationModal.tsx`
- 즐겨찾기 게이트
  - `hooks/useFavorites.ts`
  - `stores/useSangjoFavoriteStore.ts`
- 엔딩노트 레벨 분기
  - `components/IntegratedJourneyView.tsx`

정확히 확인된 리스크:

- quota RPC 실패 시 일부 경로가 fail-open이다.
- AI 상담은 사용자 quota 증가 후 시설 quota 실패가 가능하다.
- 상담 row 생성 실패 시 `ai_consult` 롤백 경로가 없다.
