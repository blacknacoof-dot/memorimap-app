# Memorimap 출시 검증 체크리스트

작성일: 2026-03-26
목적: 추모맵 출시 전 실제 운영 경로를 기준으로 최종 검증 순서를 고정한다.
원칙: 결제는 "결제 성공"이 아니라 "결제 성공 + DB 반영 + 후속 플로우 정상"까지 확인해야 통과로 본다.

## 0. 검증 진행 현황

- [x] `verify-payment` 최신 배포 확인
  - ACTIVE
  - deployed at `2026-03-26 10:10:51 UTC`
- [x] 구독 paid/free 흐름 `verify-payment` 경유 확인
- [x] `ContentRouter.tsx` 중복 client write 제거 확인
- [x] `lib/portone.ts` debug 로그 제거 확인
- [x] `windowType` 제거 확인
- [x] `npm run typecheck` 통과
- [x] `npm run build` 통과
- [x] 테스트 결제 후 DB 반영 확인
- [ ] 실결제 payload 최종 확인

## 1. 현재 기준 상태

- `verify-payment` Edge Function은 최신 배포본 기준으로 유료 구독 영속화, 무료 전환, 결제이력 저장 실패 시 롤백 로직을 포함한다.
- 구독 paid/free 흐름은 `verify-payment` 경유 구조로 정리되었다.
- `ContentRouter.tsx`의 중복 client write는 제거되었다.
- `lib/portone.ts`의 임시 debug 로그는 제거되었다.
- `windowType`은 KCP prepare 400 원인 후보로 제거되었다.
- 현재 최우선 검증 항목은 "실제 결제 성공 후 DB 반영이 끝까지 되는지"다.

## 2. 출시 전 최우선 검증

### 2.1 테스트 결제 후 DB 반영 확인

가장 먼저 아래 3개 테이블을 확인한다.

- [x] `user_subscriptions`
- [x] `facility_subscriptions`
- [x] `subscription_payments`

- `user_subscriptions`
- `facility_subscriptions`
- `subscription_payments`

통과 기준:

- 개인 유료 구독 결제 후 `user_subscriptions` 활성 row 생성 또는 갱신
- 시설 유료 구독 결제 후 `facility_subscriptions` 활성 row 생성 또는 갱신
- 각 결제에 대응하는 `subscription_payments` row 생성
- `verify-payment` 응답 기준 `verified: true`, `persisted: true`

실패 기준:

- 결제 성공 UI가 떴는데 위 3개 테이블에 오늘 row가 없음
- `verified: true`인데 `persisted: false`
- 결제는 되었지만 subscription 상태가 기대값과 다름

### 2.2 실결제 요청값 최종 확인

결제 Network 로그 기준으로 아래를 확인한다.

- [ ] `storeId`
- [ ] `channelKey`
- [ ] `paymentId`
- [ ] `orderName`
- [ ] `totalAmount`
- [ ] `currency`
- [ ] `payMethod`
- [ ] `customer.fullName`
- [ ] 필요 시 `customer.phoneNumber`

- `storeId`
- `channelKey`
- `paymentId`
- `orderName`
- `totalAmount`
- `currency`
- `payMethod`
- `customer.fullName`
- 필요 시 `customer.phoneNumber`

체크 포인트:

- 더미 fallback 값이 실제 요청에 남아 있지 않은지 확인
- KCP/PortOne이 요구하는 실제 사용자 정보가 누락되지 않는지 확인
- `site_name` 최종 표기가 운영 기준과 맞는지 확인

### 2.3 DB 확인용 SQL

Supabase SQL Editor에서 아래 쿼리를 그대로 실행한다.

```sql
-- 1) 최근 결제 이력 확인
select
  id,
  subscription_id,
  user_id,
  payment_context,
  portone_payment_id,
  amount,
  final_amount,
  status,
  paid_at,
  billing_period_start,
  billing_period_end
from public.subscription_payments
order by paid_at desc
limit 20;
```

```sql
-- 2) 최근 개인 구독 상태 확인
select
  id,
  user_id,
  plan_id,
  plan_name,
  status,
  started_at,
  expires_at,
  billing_cycle
from public.user_subscriptions
order by started_at desc nulls last, updated_at desc nulls last
limit 20;
```

```sql
-- 3) 최근 시설/상조 구독 상태 확인
select
  id,
  facility_id,
  facility_id_uuid,
  facility_id_bigint,
  plan_id,
  status,
  billing_cycle,
  next_billing_date,
  updated_at
from public.facility_subscriptions
order by updated_at desc nulls last
limit 20;
```

```sql
-- 4) 특정 PortOne paymentId로 결제 1건 추적
-- 아래 값만 실제 paymentId로 바꿔서 사용
select
  id,
  subscription_id,
  user_id,
  payment_context,
  portone_payment_id,
  amount,
  status,
  paid_at
from public.subscription_payments
where portone_payment_id = 'REPLACE_WITH_PAYMENT_ID';
```

```sql
-- 5) 특정 시설 UUID 기준 구독 상태 추적
-- 아래 값만 실제 facilityId로 바꿔서 사용
select
  id,
  facility_id_uuid,
  plan_id,
  status,
  billing_cycle,
  next_billing_date,
  updated_at
from public.facility_subscriptions
where facility_id_uuid = 'REPLACE_WITH_FACILITY_UUID'
order by updated_at desc nulls last;
```

```sql
-- 6) 특정 user_id 기준 개인 구독 상태 추적
-- 아래 값만 실제 user_id로 바꿔서 사용
select
  id,
  user_id,
  plan_id,
  plan_name,
  status,
  started_at,
  expires_at,
  billing_cycle
from public.user_subscriptions
where user_id = 'REPLACE_WITH_USER_ID'
order by started_at desc nulls last, updated_at desc nulls last;
```

### 2.4 결제 직후 확인 순서

1. 브라우저 Network에서 `paymentId`를 복사한다.
2. `subscription_payments`에서 `portone_payment_id`로 결제 row를 찾는다.
3. `payment_context`가 `personal`인지 `facility`인지 확인한다.
4. 개인 결제면 `user_subscriptions`, 시설/상조 결제면 `facility_subscriptions`를 확인한다.
5. `plan_id`, `status`, `billing_cycle`, 결제 기간 컬럼이 기대값과 맞는지 본다.
6. 결제 성공 UI가 떴는데 row가 없으면 실패로 기록한다.

## 3. 결제 검증 시나리오

### 3.1 개인 유료 구독

행동:

- 개인 프리미엄 결제 실행

확인:

- 결제창 정상 오픈
- 결제 승인 완료
- `verify-payment` 성공 응답
- `user_subscriptions.plan_id = 'PERSONAL_PREMIUM'`
- `user_subscriptions.status = 'active'`
- `subscription_payments.payment_context = 'personal'`
- `subscription_payments.status = 'completed'`

검증 결과:

- [x] 확인 완료
- `PERSONAL_PREMIUM`
- `status = active`
- `payment_context = personal`
- `billing_period_start/end` 저장 확인

### 3.2 시설 유료 구독

행동:

- 시설 플랜 결제 실행

확인:

- 결제창 정상 오픈
- 결제 승인 완료
- `verify-payment` 성공 응답
- `facility_subscriptions.status = 'active'`
- 기대 `plan_id` 저장값 반영
- `subscription_payments.payment_context = 'facility'`
- `subscription_payments.status = 'completed'`

검증 결과:

- [x] 확인 완료
- 시설 일반 구독 1건 저장 확인
- 상조 구독 `SJ_STARTER` 1건 저장 확인
- `payment_context = facility`
- `billing_period_start/end` 저장 확인

### 3.3 시설 무료 전환

행동:

- 시설 무료 플랜 선택

확인:

- `verify-payment` free downgrade 경유
- `facility_subscriptions.plan_id = 'free'`
- `facility_subscriptions.status = 'active'`
- 새로운 `subscription_payments` row 없음

### 3.4 개인 무료 전환

행동:

- 개인 무료 플랜 선택

확인:

- `verify-payment` free downgrade 경유
- `user_subscriptions.plan_id = 'PERSONAL_FREE'`
- `user_subscriptions.status = 'active'`
- 새로운 `subscription_payments` row 없음

### 3.5 결제 취소

행동:

- 결제창을 열고 승인 전에 취소

확인:

- 최종 성공 토스트 없음
- 관련 subscription/payment 테이블 변경 없음

## 4. Phase B~D 남은 작업

### Phase B

- 일반결제/정기결제 UI 문구 분리
- 개인 시그니처 `9,900원` 플랜 추가

### Phase C

- 빌링키 발급 UI 연결

### Phase D

- 서버 자동결제 Edge Function
- 해지 플로우
- `pg_cron` 연동

## 5. 운영 확인 항목

- KCP 빌링키 사전 계약 여부
  - Phase C 전 필수
- `site_name` 최종 표기 확정
  - `추모맵` 또는 `(주)아톰케어`
- `PORTONE_API_SECRET`
  - Supabase Edge Function 배포본에서 실제 정상 동작 확인
- PortOne 콘솔
  - `storeId` / `channelKey` 소속 일치
  - PG가 `NHN KCP (v2)`인지 확인
  - 채널 활성 상태 확인
  - `CARD` 허용 여부 확인

## 6. 출시 전 수동 검증

### 일반 사용자

- 회원가입 / 로그인
- 시설 검색
- 시설 상세 보기
- 상담 요청
- 예약 생성
- 리뷰 작성 / 조회

### 업체 관리자

- 관리자 대시보드 접근
- 구독 상태 확인
- 결제 후 플랜 반영 확인

### 슈퍼관리자

- 파트너 승인 / 거절
- 주요 운영 화면 접근
- `approve-partner` 최신 배포본 동작 확인

### 모바일 실기기

- iPhone Safari
- Android Chrome
- Safe Area
- 결제창 동작
- 레이아웃 깨짐 여부

## 7. 배포 전 체크

- [x] `npm run typecheck`
- [x] `npm run build`
- [ ] Vercel 최신 배포 확인
- [x] Supabase Edge Function 최신 배포 확인
  - [x] `verify-payment`
  - [ ] 필요 시 `approve-partner`

## 8. 출시 직후 스모크 테스트

- 실제 도메인 접속
- 로그인
- 검색
- 결제 또는 무료 전환
- 관리자 접근
- 브라우저 콘솔 / 네트워크 오류 확인

## 9. 최종 통과 기준

출시는 아래가 모두 충족될 때만 진행한다.

- `typecheck` 통과
- `build` 통과
- 개인/시설 결제 후 DB 반영 정상
- 개인/시설 무료 전환 정상
- 주요 수동 플로우 치명 오류 없음
- 모바일 실기기 치명 이슈 없음
- 운영 설정 누락 없음

## 10. 지금 바로 다음 액션

1. 테스트 결제 1회 실행
2. `user_subscriptions`, `facility_subscriptions`, `subscription_payments` 확인
3. 결제 요청 payload 최종 확인
4. DB 반영이 확인되면 Phase B 시작

## 11. 2026-03-27 실측 결과

- `subscription_payments`
  - personal 1건 저장 확인
  - facility 2건 저장 확인
  - 최신 row 기준 `status = completed`
  - `billing_period_start`, `billing_period_end` 저장 확인

- `user_subscriptions`
  - `PERSONAL_PREMIUM` active 반영 확인

- `facility_subscriptions`
  - 시설 일반 구독 active 반영 확인
  - 상조 구독 `SJ_STARTER` active 반영 확인

- 아직 미확인
  - free downgrade 실측
  - 결제 취소 실측
  - 실결제 payload 최종 확인

### 11.1 실측 요약

- [x] 개인 유료 결제 성공
- [x] 시설 유료 결제 성공
- [x] 상조 유료 결제 성공
- [x] 결제 후 DB 3개 테이블 반영 확인
- [x] billing period 컬럼 저장 확인

### 11.2 확인된 최신 row 기준

- 개인 결제
  - `payment_context = personal`
  - `portone_payment_id = psub_mn7jih05_r54s0g`
  - `amount = 4900`
  - `status = completed`
  - `user_subscriptions.plan_id = PERSONAL_PREMIUM`

- 상조 결제
  - `payment_context = facility`
  - `portone_payment_id = sub_mn7kvsz8_p4l343`
  - `amount = 1500000`
  - `status = completed`
  - `facility_subscriptions.plan_id = SJ_STARTER`

- 시설 일반 결제
  - `payment_context = facility`
  - `portone_payment_id = sub_mn7k6k23_wi65s3`
  - `amount = 199000`
  - `status = completed`
  - `facility_subscriptions.plan_id = premium`

## 12. 2026-03-27 해지 예약 검증

### 12.1 개인 구독 해지 예약

- 검증 계정
  - `user_id = 2f3c8a86-07d7-42e5-99b5-c4389b1b31ed`

- 사전 복구 상태
  - `plan_id = PERSONAL_PREMIUM`
  - `plan_name = PERSONAL_PREMIUM`
  - `status = active`
  - `auto_renew = true`
  - `expires_at = 2026-04-26 14:01:55.921`

- UI 확인
  - 개인 구독 화면에서 `무료로 변경하기` 클릭
  - confirm 문구:
    `구독을 해지하시겠습니까? 현재 이용기간 만료 후 자동으로 무료 플랜으로 전환됩니다.`

- API 응답
  - `{"verified":true,"persisted":true}`

- DB 결과
  - `plan_id = PERSONAL_PREMIUM`
  - `plan_name = PERSONAL_PREMIUM`
  - `status = cancelling`
  - `auto_renew = false`
  - `expires_at = 2026-04-26 14:01:55.921`

- 판정
  - [x] 해지 직후 `cancelling` 전환 정상
  - [x] 유료 플랜 유지 정상
  - [x] `auto_renew=false` 반영 정상

### 12.2 cron / 배치 상태

- [x] `pg_cron` extension 활성화 확인
- [x] `process_expired_subscriptions()` 함수 생성 확인
- [x] cron job 등록 확인
  - `jobname = process-expired-subscriptions`
  - `schedule = 0 18 * * *`
  - `command = select public.process_expired_subscriptions()`

### 12.3 다음 검증

- [ ] 만료 전 개인 유료 기능 접근 유지 확인
- [ ] `expires_at` 과거 조정 후 `select public.process_expired_subscriptions();`
- [ ] `PERSONAL_FREE` 전환 확인
- [ ] 시설/상조 `cancelling -> FREE` 전환 확인
## 13. 2026-03-27 배포 전 상태

### 13.1 완료 항목

- [x] `tsc --noEmit` 통과
- [x] `npm run build` 통과
- [x] `verify-payment` Edge Function 재배포 실행
- [x] `facility_subscriptions` RLS 마이그레이션 반영
- [x] `cancelling` 상태머신 반영
- [x] 개인 구독 `cancelling -> 유료 유지` 실측
- [x] 개인 구독 `만료 -> PERSONAL_FREE` 전환 로직 검증
- [x] 상조 구독 `cancelling -> 유료 유지` 실측
- [x] 상조 구독 `만료 -> FREE` 전환 로직 검증
- [x] 시설 구독 `만료 -> FREE` 수동 전환 검증
- [x] `pg_cron` 활성화 및 `process-expired-subscriptions` 등록

### 13.2 P0 배포 작업

- [ ] Vercel 프로덕션 배포
- [ ] 배포 직후 운영 URL 스모크 테스트
- [ ] 개인 구독 화면 `해지 예정` 표시 확인
- [ ] 상조/시설 구독 화면 상태 표시 확인
- [ ] `verify-payment` 최신 배포본으로 동작 확인

### 13.3 종합 QA 범위

#### 일반 유저
- [ ] 회원가입 / 로그인
- [ ] 장례식장 / 추모시설 / 상조 검색 및 상세 진입
- [ ] 마음이 상담 진입
- [ ] 장례식장 / 추모시설 AI 상담
- [ ] 상조 AI 비교 / 상담
- [ ] 찜 추가 / 해제
- [ ] 상담 신청 / 예약 신청
- [ ] 개인 구독 결제
- [ ] 개인 구독 해지 예약
- [ ] 마이페이지 구독 상태 확인

#### 시설 파트너
- [ ] 파트너 신청
- [ ] 승인 전 / 후 권한 차이 확인
- [ ] 대시보드 진입
- [ ] 시설 구독 결제
- [ ] 시설 구독 해지 예약
- [ ] 예약 / 상담 수신 확인
- [ ] KPI / 리뷰 / 문의 / 매출 카드 확인

#### 상조 파트너
- [ ] 상조 파트너 신청
- [ ] 승인 후 상조 대시보드 진입
- [ ] 상조 구독 결제
- [ ] 상조 구독 해지 예약
- [ ] 상조 AI 비교 / 상담 연결 확인
- [ ] 리드 / 문의 / 상담 데이터 반영 확인

#### 슈퍼관리자
- [ ] 파트너 신청 목록 확인
- [ ] 시설 파트너 승인 / 반려
- [ ] 상조 파트너 승인 / 반려
- [ ] 승인 후 실제 권한 반영 확인
- [ ] 운영 화면 진입 에러 확인

### 13.4 잔여 점검 항목

- [ ] 슈퍼관리자 파트너 승인 E2E
- [ ] 모바일 UI 실기기 점검
- [ ] `admin_memo` 확인
- [ ] `system_settings` RLS 확인
- [ ] `sangjo_contracts` RLS 확인
