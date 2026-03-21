# High Risk Flow Resume Note

작성 시점: 2026-03-21

기준 문서:
- `docs/high_risk_flow_verification_plan_20260321.md`

이번 작업 목적:
- UI/UX를 건드리지 않고, 고위험 흐름의 데이터 정합성, 권한 무결성, 재조회 일관성을 Playwright로 고정한다.

## 현재 상태

### 완료된 것

- `tests/e2e/subscription.flow.spec.ts`
  - 실행 확인 완료
  - 무료 -> 유료 -> 무료 흐름과 재조회 일치 확인
  - canonical `plan_id` 기준 검증 유지

- `tests/e2e/ai.compare.spec.ts`
  - 실행 확인 완료
  - AI 상담, 비교 tray, 상조 비교 흐름 검증 완료

- `tests/e2e/partner.revenue.spec.ts`
  - 테스트 작성 완료
  - 상조 플랜은 현재 live DB에서 `sj_starter`가 아니라 `SJ_STARTER` / `SJ_PROFESSIONAL` / `SJ_ENTERPRISE` canonical 키를 넣어야 `facility_subscriptions.plan_id_fkey`를 통과한다는 점을 확인함
  - `subscription_plans`는 테스트에서 시드 가능
  - 대시보드 진입 경로는 `상조 대시보드` -> `요금제 관리`로 맞춰야 함

### 아직 남은 것

- `tests/e2e/partner.revenue.spec.ts`
  - 최종 통과 확인 필요
  - 현재는 UI 진입 경로를 실제 화면에 맞게 수정한 상태
  - 재실행 시 오래 걸릴 수 있음

- `tests/e2e/report.smoke.spec.ts`
  - 파일 작성 완료
  - `send-monthly-report` smoke 검증은 아직 최종 실행 확인이 필요

## 핵심 확인 사항

- `facility_subscriptions.plan_id`는 live DB에서 canonical 문자열 상조 플랜 키를 기대한다.
- probe 결과:
  - `sj_starter` -> FK 실패
  - `SJ_STARTER` -> 성공
  - `free` -> 성공
- 상조 플랜 시드가 코드베이스상 존재하더라도, 테스트 시점에는 `subscription_plans`가 보장되어야 한다.
- `send-monthly-report` Edge Function은 현재도 `sj_starter` 계열 문자열로 필터링하는 코드가 남아 있어, DB와 함수 기준이 어긋날 가능성이 있다.

## 다음 세션에서 바로 이어갈 순서

1. `tests/e2e/partner.revenue.spec.ts` 다시 실행
   - 명령:
     - `npx playwright test tests/e2e/partner.revenue.spec.ts --reporter=line --workers=1`
   - 확인 포인트:
     - revenue 탭 진입
     - starter 상태 UI 노출
     - enterprise 업그레이드 후 DB `plan_id` 재조회 일치
     - payment row 1개 생성 여부
     - reload 후 enterprise 상태 유지

2. `tests/e2e/report.smoke.spec.ts` 실행
   - 명령:
     - `npx playwright test tests/e2e/report.smoke.spec.ts --reporter=line --workers=1`
   - 확인 포인트:
     - unauthorized 401
     - no-op 응답
     - active subscription 성공/필터 경로

3. 필요 시 Edge Function과 테스트 기준 정합성 재점검
   - `supabase/functions/send-monthly-report/index.ts`
   - `facility_subscriptions.plan_id` 필터가 canonical 키와 일치하는지 확인

## 실행 중 주의

- UI 수정 금지
- 앱 로직 변경 금지
- canonical `plan_id`만 사용
- DB 값과 재조회 값 일치 우선
- 테스트 편의를 위한 구조 변경 금지

## 참고

- `tests/e2e/__tmp_plan_probe.spec.ts`는 진단에만 사용되는 임시 파일이었고, 정리 대상이다.
