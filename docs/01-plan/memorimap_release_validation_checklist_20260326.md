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
- [ ] 테스트 결제 후 DB 반영 확인
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

- [ ] `user_subscriptions`
- [ ] `facility_subscriptions`
- [ ] `subscription_payments`

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
