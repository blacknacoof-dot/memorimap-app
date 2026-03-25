# 2026-03-21 일일 작업 최종 통합 보고서

> 통합 대상: [`docs/daily_report_20260321.md`](/C:/Users/black/Desktop/memorimap/docs/daily_report_20260321.md), [`docs/daily_report_20260321_deep_analysis.md`](/C:/Users/black/Desktop/memorimap/docs/daily_report_20260321_deep_analysis.md)  
> 정밀 검증 기준: [`docs/precision_verification_targets_20260321.md`](/C:/Users/black/Desktop/memorimap/docs/precision_verification_targets_20260321.md), [`docs/high_risk_flow_verification_plan_20260321.md`](/C:/Users/black/Desktop/memorimap/docs/high_risk_flow_verification_plan_20260321.md), [`docs/high_risk_flow_verification_report_20260321.md`](/C:/Users/black/Desktop/memorimap/docs/high_risk_flow_verification_report_20260321.md), [`docs/worklog_high_risk_flow_resume_20260321.md`](/C:/Users/black/Desktop/memorimap/docs/worklog_high_risk_flow_resume_20260321.md)

## 1. 한 줄 결론

`2026-03-21` 작업은 단순 기능 추가가 아니라, 고위험 플로우의 정합성과 검증 기준을 동시에 정리한 날이다.

- E2E는 UUID, serial 실행, canonical `plan_id` 기준을 고정했다.
- Edge Function은 인증 경계와 렌더링 경계를 분리했다.
- DB 마이그레이션/RPC는 기존 진실성 복원 쪽에 가깝다.
- 요금제 맵핑은 표시명이 아니라 저장 키를 맞추는 작업이다.
- 서비스 레이어는 UI와 DB 사이의 경계를 분명하게 했다.

---

## 2. 일일 작업 요약

### 2-1. 커밋 내역

일일 보고서에 기록된 커밋은 다음 3건이다.

| 커밋 | 설명 |
|---|---|
| `bd87437` | `reservation.payment` UUID 오류 수정, `crypto.randomUUID()` 및 serial 실행 적용 |
| `8fbe76a` | `partner.approval` 워커 분산 실패 수정, `test.describe.serial` 적용 |
| `24db5b2` | 서비스 분리, E2E 6종, 요금제 매핑, 마이그레이션 수정 통합 |

### 2-2. 일일 작업 수치

| 항목 | 수치 |
|---|---|
| 커밋 수 | 3건 |
| 변경 파일 | 30개 |
| 추가 | +4,911줄 |
| 삭제 | -264줄 |
| E2E 테스트 | `46 passed / 0 failed / 3 skipped` |

### 2-3. 오늘의 실질 변화

- E2E 테스트의 실패 원인을 순차성/UUID/워커 분산 문제로 나눠서 고쳤다.
- `send-monthly-report` Edge Function을 진입점과 핵심 로직으로 분리했다.
- 요금제 canonical key 정규화를 확장했다.
- 승인 RPC와 시설/구독 관련 마이그레이션 정합성을 재점검했다.
- 즐겨찾기와 AI 연동을 서비스 레이어로 분리했다.

---

## 3. 정밀 검증 결과 요약

### 3-1. 5축 전수 검증

| 축 | 결과 | 핵심 |
|---|---|---|
| E2E 고위험 플로우 | 7파일 28테스트 전수 통과 | `serial`/UUID 적용 확인, `skip` 0건 |
| Edge Function | 완전 통과 | `index` 25줄, `core` 295줄, Bearer 엄격 검증, `any` 0건 |
| DB 마이그레이션 | 7개 전수 확인 | `::public.user_role` 캐스트, `FOR UPDATE` 락, 중복방지 |
| 요금제 맵핑 | 완전 통과 | 한글 canonical 4종 + 상조/개인 변형 전부 맵핑 |
| 서비스 레이어 | 2/3 + 1조건부 | `geminiService` 539줄, 300줄 초과로 P2 분리 대상 |

### 3-2. skipped 3건 해명

| 파일 | skip 수 | 사유 |
|---|---|---|
| `review-delete.spec.ts` | 1 | `@manual @quarantine`, 수동 검증 전용 |
| `superAdmin.joinChat.spec.ts` | 2 | `@quarantine`, 격리 대상 |

해석:

- `49 total = 46 passed + 0 failed + 3 skipped`는 수치상 정확하다.
- skipped 3건은 고위험 플로우와 무관한 의도적 격리로 해석한다.

---

## 4. 정밀 검증 대상

### 4-1. E2E 고위험 플로우

정밀 검증 대상 파일:

- [`tests/e2e/reservation.payment.spec.ts`](C:/Users/black/Desktop/memorimap/tests/e2e/reservation.payment.spec.ts)
- [`tests/e2e/partner.approval.spec.ts`](C:/Users/black/Desktop/memorimap/tests/e2e/partner.approval.spec.ts)
- [`tests/e2e/subscription.flow.spec.ts`](C:/Users/black/Desktop/memorimap/tests/e2e/subscription.flow.spec.ts)
- [`tests/e2e/ai.compare.spec.ts`](C:/Users/black/Desktop/memorimap/tests/e2e/ai.compare.spec.ts)
- [`tests/e2e/partner.revenue.spec.ts`](C:/Users/black/Desktop/memorimap/tests/e2e/partner.revenue.spec.ts)
- [`tests/e2e/report.smoke.spec.ts`](C:/Users/black/Desktop/memorimap/tests/e2e/report.smoke.spec.ts)
- [`tests/e2e/qa.execution.spec.ts`](C:/Users/black/Desktop/memorimap/tests/e2e/qa.execution.spec.ts)

검증 포인트:

- 예약-결제-검증 흐름의 UUID 및 상태 전이
- 승인 RPC와 워커 분산 안정성
- canonical `plan_id` 기준 유지
- AI 비교/상담 진입 경로
- 월간 리포트 발송 경계

### 4-2. Edge Function

정밀 검증 대상 파일:

- [`supabase/functions/send-monthly-report/index.ts`](C:/Users/black/Desktop/memorimap/supabase/functions/send-monthly-report/index.ts)
- [`supabase/functions/send-monthly-report/core.ts`](C:/Users/black/Desktop/memorimap/supabase/functions/send-monthly-report/core.ts)

검증 포인트:

- 인증
- 대상 사용자 판별
- 응답 포맷
- HTML 템플릿 렌더링
- 업그레이드 힌트와 subject 처리

### 4-3. DB 마이그레이션 / RPC

정밀 검증 대상 파일:

- [`supabase/migrations/20260215_fix_approve_partner_e2e.sql`](C:/Users/black/Desktop/memorimap/supabase/migrations/20260215_fix_approve_partner_e2e.sql)
- [`supabase/migrations/20260223_high_severity_fixes.sql`](C:/Users/black/Desktop/memorimap/supabase/migrations/20260223_high_severity_fixes.sql)
- [`supabase/migrations/20260226_partner_rpc_atomic.sql`](C:/Users/black/Desktop/memorimap/supabase/migrations/20260226_partner_rpc_atomic.sql)
- [`supabase/migrations/20260301_sangjo_facilities_sync.sql`](C:/Users/black/Desktop/memorimap/supabase/migrations/20260301_sangjo_facilities_sync.sql)
- [`supabase/migrations/20260320_assign_freedlife_sangjo_admin.sql`](C:/Users/black/Desktop/memorimap/supabase/migrations/20260320_assign_freedlife_sangjo_admin.sql)
- [`supabase/migrations/20260320_backfill_facility_subscription_plan_ids.sql`](C:/Users/black/Desktop/memorimap/supabase/migrations/20260320_backfill_facility_subscription_plan_ids.sql)

검증 포인트:

- `approve_partner_transaction`의 `public.user_role` 캐스트
- 승인 원자성
- 시설 동기화
- 상조 관리자 배정
- `plan_id` 백필

### 4-4. 요금제 맵핑

정밀 검증 대상 파일:

- [`lib/subscriptionPlanIds.ts`](C:/Users/black/Desktop/memorimap/lib/subscriptionPlanIds.ts)

검증 포인트:

- `free`, `basic`, `premium`, `enterprise` canonical 키 유지
- 상조/개인 요금제 변형의 매핑 일치

### 4-5. 서비스 레이어

정밀 검증 대상 파일:

- [`supabase/services/favoriteService.ts`](C:/Users/black/Desktop/memorimap/supabase/services/favoriteService.ts)
- [`supabase/services/geminiService.ts`](C:/Users/black/Desktop/memorimap/supabase/services/geminiService.ts)
- [`supabase/services/sangjoFavoriteService.ts`](C:/Users/black/Desktop/memorimap/supabase/services/sangjoFavoriteService.ts)

검증 포인트:

- CRUD 기본 동작
- AI 연동 실패 처리
- 사용자별 데이터 분리

---

## 5. 검증 제외 대상

아래 항목은 정밀 검증 대상에서 제외한다.
실행 증거나 작업 흔적으로는 참고할 수 있지만, 최종 판단 기준으로 삼지 않는다.

### 5-1. 로컬/임시 파일

- [`.claude/settings.local.json`](C:/Users/black/Desktop/memorimap/.claude/settings.local.json)
- [`.tsbuildinfo`](C:/Users/black/Desktop/memorimap/.tsbuildinfo)
- [`supabase/.temp/`](C:/Users/black/Desktop/memorimap/supabase/.temp)
- [`playwright-report/`](C:/Users/black/Desktop/memorimap/playwright-report)
- [`test-results/`](C:/Users/black/Desktop/memorimap/test-results)

### 5-2. 작업 메모 / 보고서

- [`docs/daily_report_20260321.md`](C:/Users/black/Desktop/memorimap/docs/daily_report_20260321.md)
- [`docs/daily_report_20260321_deep_analysis.md`](C:/Users/black/Desktop/memorimap/docs/daily_report_20260321_deep_analysis.md)
- [`docs/precision_verification_targets_20260321.md`](C:/Users/black/Desktop/memorimap/docs/precision_verification_targets_20260321.md)
- [`docs/high_risk_flow_verification_plan_20260321.md`](C:/Users/black/Desktop/memorimap/docs/high_risk_flow_verification_plan_20260321.md)
- [`docs/high_risk_flow_verification_report_20260321.md`](C:/Users/black/Desktop/memorimap/docs/high_risk_flow_verification_report_20260321.md)
- [`docs/worklog_high_risk_flow_resume_20260321.md`](C:/Users/black/Desktop/memorimap/docs/worklog_high_risk_flow_resume_20260321.md)

### 5-3. 기타 리소스

- `Phase 2.txt`
- `MyPageView 구조 개선.txt`
- `요금제.txt`
- `작업 이어서.txt`
- `자연장/`
- `장례식장 사진/`

---

## 6. 검증 기준

### 6-1. 커밋 기준

- `bd87437`
- `8fbe76a`
- `24db5b2`
- `6a42c76`

커밋 수보다 중요한 것은 각 커밋이 어떤 리스크를 분리했는가이다.

### 6-2. 실측 기준

- 전체 E2E 결과가 `46 passed / 0 failed / 3 skipped`인지 확인한다.
- skipped 3건은 의도적 격리인지 확인한다.

### 6-3. 데이터 정합성 기준

- canonical `plan_id`가 저장/조회/재조회에서 일치해야 한다.
- 승인 RPC는 role 캐스팅 문제 없이 동작해야 한다.
- 월간 리포트는 허용된 대상만 처리해야 한다.
- 서비스 레이어는 실패 시에도 응답 규격을 유지해야 한다.

### 6-4. 문서 해석 기준

1. 실행 결과를 먼저 본다.
2. 그 결과를 설명하는 문서를 본다.
3. 문서가 코드나 DB와 충돌하면 코드/DB를 우선한다.

---

## 7. 해석 가이드

### 7-1. E2E 결과 해석

- 예약 테스트는 UUID와 serial 실행 문제를 함께 본다.
- 승인 테스트는 병렬 워커 취약성을 본다.
- 구독/매출 테스트는 canonical `plan_id` 기준을 본다.
- 리포트 스모크는 인증 경계를 본다.

### 7-2. 서비스 레이어 해석

- `favoriteService.ts`와 `sangjoFavoriteService.ts`는 CRUD와 데이터 분리를 본다.
- `geminiService.ts`는 AI 연동 경계와 실패 처리를 본다.
- `geminiService.ts`는 300줄 초과이므로 P2 분리 후보로 남는다.

### 7-3. 마이그레이션 해석

- 이미 존재하는 마이그레이션을 다시 건드린 경우는 보수적으로 본다.
- 실제 운영 반영본과 문서상의 설명이 어긋나지 않는지 확인이 필요하다.

### 7-4. skipped 해석

- `Skipped: 3`은 정상일 수 있지만, 무엇이 왜 skipped 되었는지는 분리해서 봐야 한다.
- 여기서는 `manual/quarantine` 성격으로 분리된 것으로 해석한다.

---

## 8. 미해결 이슈

이전 보고서에서 계승한 이슈는 아래와 같다.

| 우선도 | ID | 내용 |
|---|---|---|
| HIGH | H1 | `UserSubscription` 인터페이스가 `types/db.ts`에 없음 |
| HIGH | H2 | `facility_subscriptions.plan_id` 데이터 타입 SQL 확인 필요 |
| MEDIUM | M1~M3 | `system_settings` 수수료, `sangjo_contracts.admin_memo`, RLS SQL Editor 수동 확인 필요 |

해석:

- 정밀 검증이 통과했더라도 타입 정의와 일부 스키마 실측은 별도 확인 대상이다.
- 특히 `H1`, `H2`는 코드와 DB 사이의 기준선 문제라서 계속 남겨두는 게 맞다.

---

## 9. 결론

`2026-03-21` 작업은 다음 5개 축을 정리한 작업으로 요약할 수 있다.

1. E2E 고위험 플로우
2. Edge Function
3. DB 마이그레이션 / RPC
4. 요금제 맵핑
5. 서비스 레이어

정밀 검증 결과는 수치상 일관되고, skipped 3건도 의도적 격리로 해석 가능하다.
다만 서비스 레이어의 `geminiService.ts`는 여전히 분리 후보이고, `UserSubscription` 타입과 `facility_subscriptions.plan_id` 타입 확인은 남아 있다.

따라서 오늘 작업의 최종 평가는 다음과 같다.

- 핵심 고위험 흐름은 기준에 맞게 정리됐다.
- 결과 수치는 신뢰 가능한 형태로 정리됐다.
- 남은 이슈는 구조 분리와 타입/스키마 수동 확인으로 명확히 분리된다.
