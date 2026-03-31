# Beta Premium Override Update

Date: 2026-03-31
Branch: `dev`
Related commits:
- `6f4f73f` `Add beta premium admin controls and revenue warning guard`
- `35cbedb` `Unify personal subscription view with premium override`

## Summary

`premium_grants` 기반 베타 프리미엄 운영 레이어를 추가했고, 슈퍼관리자 운영 화면과 일반 유저 개인 구독 화면이 같은 권한 판정 기준을 보도록 정리했다.

핵심 원칙:
- 기존 `user_subscriptions` 결제 로직은 유지
- 베타 프리미엄은 `premium_grants` override 레이어로만 동작
- 권한 판정은 `get_user_plan_info()`를 진실 소스로 사용
- 롤백 시 `premium_grants` override만 비활성화하면 기존 구조로 복귀 가능

## Implemented

### 1. Premium Grants Layer

- `supabase/migrations/20260331_add_premium_grants_override_layer.sql`
- `premium_grants` 테이블 추가
- RLS, index, trigger, active grant 1개 제약 추가
- `get_active_premium_grant(...)`
- `process_expired_premium_grants()`
- `get_premium_expiring_targets(...)`
- `get_user_plan_info()`에 베타 프리미엄 override 분기 추가

### 2. Super Admin Controls

- `components/SuperAdmin/PersonalSubscriptionManager.tsx`
- 유저 row 클릭 선택 추가
- 선택 유저 기준 active grant + history 조회
- 상세 패널에서 아래 운영 가능
  - 현재 상태 확인
  - 30일 부여
  - +7일 연장
  - +30일 연장
  - 회수
  - 이력 조회

### 3. User-Facing Plan Consistency

- `components/MyPageView/SubscriptionCard.tsx`
  - `useUserPlan()` 기준으로 베타 프리미엄 표시
- `components/PersonalSubscriptionPlans.tsx`
  - `user_subscriptions` 직접 조회 대신 `useUserPlan()` 기준으로 현재 플랜 표시
  - 베타 프리미엄이면 `PERSONAL_PREMIUM`처럼 보이도록 통일
  - 화면 내 `베타 프리미엄 사용 중` 배지 추가

### 4. Revenue Warning Guard

- `lib/api/superAdmin.ts`
- `hooks/useFinancials.ts`

매출분석의 `시설명 조회 실패` 경고는 현재 운영상 의미 있는 `active` 시설 구독 기준으로만 보이도록 조정했다.
과거 취소된 결제 이력의 시설 정보 유실 때문에 매번 경고가 뜨는 문제를 완화했다.

## Verified

- 슈퍼관리자에서 베타 프리미엄 grant 생성 확인
- `premium_grants` active row 생성 확인
- 일반 유저 카드에서 `베타 프리미엄 사용 중` 표시 확인
- 개인 구독 화면도 override 기준으로 일치하도록 수정
- `npm run typecheck` 통과
- `git push origin dev` 완료
- production deploy 완료
- `curl -I https://memorimap.kr` 200 OK 확인

## Operational Notes

- 슈퍼관리자 Edge Function은 이번 범위에 필요하지 않다
- 현재 관리자 액션은 테이블/RPC/RLS 조합으로 운영 가능하다
- 이후 아래 확장은 별도 단계로 진행
  - coupon
  - invite
  - payment-driven auto grant
  - expiry notification automation

## Rollback

빠른 롤백 순서:
1. 슈퍼관리자 운영 UI 숨김
2. `get_user_plan_info()`의 `premium_grants` override 분기 비활성화
3. 필요 시 migration rollback

가장 안전한 롤백 방식은 테이블 삭제보다 override off 이다.
