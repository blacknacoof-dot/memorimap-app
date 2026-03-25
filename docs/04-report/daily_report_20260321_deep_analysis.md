# 2026-03-21 일일 작업 보고서 심층 정리

> 기준 문서: [`docs/daily_report_20260321.md`](/C:/Users/black/Desktop/memorimap/docs/daily_report_20260321.md)  
> 보조 문서: [`docs/precision_verification_targets_20260321.md`](/C:/Users/black/Desktop/memorimap/docs/precision_verification_targets_20260321.md), [`docs/high_risk_flow_verification_plan_20260321.md`](/C:/Users/black/Desktop/memorimap/docs/high_risk_flow_verification_plan_20260321.md), [`docs/high_risk_flow_verification_report_20260321.md`](/C:/Users/black/Desktop/memorimap/docs/high_risk_flow_verification_report_20260321.md), [`docs/worklog_high_risk_flow_resume_20260321.md`](/C:/Users/black/Desktop/memorimap/docs/worklog_high_risk_flow_resume_20260321.md)

## 1. 목적

이 문서는 `2026-03-21` 일일 작업 보고서의 내용을 단순 요약이 아니라, 실제 검증 관점에서 다시 분해한 정리본이다.

핵심 목적은 다음 두 가지다.

- 오늘 작업이 실제로 무엇을 바꿨는지 기능 축으로 다시 이해한다.
- 무엇을 정밀 검증 대상으로 봐야 하고, 무엇은 산출물 참고용으로만 봐야 하는지 분리한다.

즉, 이 문서는 "무엇을 했는가"보다 "어떤 근거로 믿을 수 있는가"에 초점을 둔다.

---

## 2. 정밀 검증 대상

`2026-03-21` 작업은 크게 5개 축으로 나뉜다. 이 다섯 축이 실제로 오늘의 핵심 변경 범위다.

### 2-1. E2E 고위험 플로우

오늘 가장 중요한 변화는 E2E 안정화와 신규 고위험 시나리오 정리다.

근거가 되는 파일:

- [`tests/e2e/reservation.payment.spec.ts`](C:/Users/black/Desktop/memorimap/tests/e2e/reservation.payment.spec.ts)
- [`tests/e2e/partner.approval.spec.ts`](C:/Users/black/Desktop/memorimap/tests/e2e/partner.approval.spec.ts)
- [`tests/e2e/subscription.flow.spec.ts`](C:/Users/black/Desktop/memorimap/tests/e2e/subscription.flow.spec.ts)
- [`tests/e2e/ai.compare.spec.ts`](C:/Users/black/Desktop/memorimap/tests/e2e/ai.compare.spec.ts)
- [`tests/e2e/partner.revenue.spec.ts`](C:/Users/black/Desktop/memorimap/tests/e2e/partner.revenue.spec.ts)
- [`tests/e2e/report.smoke.spec.ts`](C:/Users/black/Desktop/memorimap/tests/e2e/report.smoke.spec.ts)
- [`tests/e2e/qa.execution.spec.ts`](C:/Users/black/Desktop/memorimap/tests/e2e/qa.execution.spec.ts)

왜 정밀 검증 대상인가:

- 예약-결제-검증, 파트너 승인, 구독 전환, AI 비교 진입, 리포트 발송은 모두 사용자 상태나 DB 상태를 직접 바꾸는 흐름이다.
- 한 번의 성공 여부보다, 재조회 후 동일 상태가 유지되는지가 더 중요하다.
- 오늘 작업의 E2E 수정은 단순한 테스트 추가가 아니라, 순차 의존성과 데이터 정합성을 고정하는 작업이다.

오늘 확인된 핵심 해석:

- `reservation.payment.spec.ts`는 UUID와 워커 분산 문제를 함께 정리했다.
- `partner.approval.spec.ts`는 병렬 워커 환경에서 순차성 보장이 필요하다는 점을 드러냈다.
- `subscription.flow.spec.ts`와 `partner.revenue.spec.ts`는 canonical `plan_id` 기준이 실제로 살아 있어야 통과한다.
- `report.smoke.spec.ts`는 Edge Function과 인증 경계를 함께 점검해야 한다.

### 2-2. Edge Function

오늘의 Edge Function 변경은 월간 리포트 발송 경로를 분리해서 읽어야 한다.

근거가 되는 파일:

- [`supabase/functions/send-monthly-report/index.ts`](C:/Users/black/Desktop/memorimap/supabase/functions/send-monthly-report/index.ts)
- [`supabase/functions/send-monthly-report/core.ts`](C:/Users/black/Desktop/memorimap/supabase/functions/send-monthly-report/core.ts)

왜 정밀 검증 대상인가:

- `index.ts`는 진입점이므로 인증, 허용 대상, 응답 형식이 여기서 결정된다.
- `core.ts`는 실제 렌더링과 발송 판단 로직이 들어가는 곳이므로, 템플릿과 분기 조건이 맞지 않으면 결과가 틀어진다.

오늘 작업의 의미:

- 진입점과 핵심 로직을 분리해, smoke 테스트가 인증 실패/성공/no-op를 구분할 수 있는 구조로 만들었다.
- 이것은 단순 리팩토링이 아니라, 월간 리포트가 "누구에게 왜 발송되는가"를 명시적으로 검증할 수 있게 만든 것이다.

### 2-3. DB 마이그레이션 / RPC

오늘 작업에서 가장 민감한 축은 DB 마이그레이션과 RPC 정합성이다.

근거가 되는 파일:

- [`supabase/migrations/20260215_fix_approve_partner_e2e.sql`](C:/Users/black/Desktop/memorimap/supabase/migrations/20260215_fix_approve_partner_e2e.sql)
- [`supabase/migrations/20260223_high_severity_fixes.sql`](C:/Users/black/Desktop/memorimap/supabase/migrations/20260223_high_severity_fixes.sql)
- [`supabase/migrations/20260226_partner_rpc_atomic.sql`](C:/Users/black/Desktop/memorimap/supabase/migrations/20260226_partner_rpc_atomic.sql)
- [`supabase/migrations/20260301_sangjo_facilities_sync.sql`](C:/Users/black/Desktop/memorimap/supabase/migrations/20260301_sangjo_facilities_sync.sql)
- [`supabase/migrations/20260320_assign_freedlife_sangjo_admin.sql`](C:/Users/black/Desktop/memorimap/supabase/migrations/20260320_assign_freedlife_sangjo_admin.sql)
- [`supabase/migrations/20260320_backfill_facility_subscription_plan_ids.sql`](C:/Users/black/Desktop/memorimap/supabase/migrations/20260320_backfill_facility_subscription_plan_ids.sql)

왜 정밀 검증 대상인가:

- 승인 RPC는 role 캐스팅 오류가 나면 테스트는 물론 운영도 즉시 흔들린다.
- 상조 시설 동기화와 plan_id 백필은 기존 데이터의 의미를 다시 정렬하는 작업이다.
- 이미 적용된 마이그레이션을 수정한 흔적이 있으므로, 실제 프로덕션 반영본이 무엇인지 추적이 필요하다.

핵심 해석:

- `approve_partner_transaction`는 `public.user_role` 캐스트가 없으면 타입 충돌 위험이 있다.
- `20260320` 계열 마이그레이션은 신규 기능 추가가 아니라 기존 데이터 정렬이다.
- 따라서 이 축은 "새 기능"보다 "기존 진실성 복원"으로 봐야 한다.

### 2-4. 요금제 맵핑

근거가 되는 파일:

- [`lib/subscriptionPlanIds.ts`](C:/Users/black/Desktop/memorimap/lib/subscriptionPlanIds.ts)

왜 정밀 검증 대상인가:

- `free`, `basic`, `premium`, `enterprise` 같은 canonical 키는 UI 문구와 별개로 저장/조회 기준이 된다.
- 요금제 맵핑이 흔들리면 구독, 결제, 리포트, 파트너 매출 모두 동시에 틀어진다.

핵심 해석:

- 오늘의 요금제 맵핑 작업은 번역 문제가 아니라 데이터 키 정규화 문제다.
- 즉, 문자열을 예쁘게 바꾸는 게 아니라 DB와 UI가 같은 키를 공유하도록 만드는 작업이다.

### 2-5. 서비스 레이어

근거가 되는 파일:

- [`supabase/services/favoriteService.ts`](C:/Users/black/Desktop/memorimap/supabase/services/favoriteService.ts)
- [`supabase/services/geminiService.ts`](C:/Users/black/Desktop/memorimap/supabase/services/geminiService.ts)
- [`supabase/services/sangjoFavoriteService.ts`](C:/Users/black/Desktop/memorimap/supabase/services/sangjoFavoriteService.ts)

왜 정밀 검증 대상인가:

- 서비스 레이어는 UI와 DB 사이의 경계다.
- 여기서 실패 처리, 응답 규격, 사용자별 데이터 분리가 맞지 않으면 화면이 맞아 보여도 실제 데이터는 틀릴 수 있다.

핵심 해석:

- `favoriteService.ts`와 `sangjoFavoriteService.ts`는 CRUD 안정성을 본다.
- `geminiService.ts`는 AI 연동의 실패 경계와 응답 일관성을 본다.
- 특히 `geminiService.ts`는 길이가 큰 편이므로, 이후 분리 검토 대상이라는 점도 같이 봐야 한다.

---

## 3. 검증 제외 대상

정밀 검증 대상에 포함하지 않는 항목은 다음과 같다.
이들은 참고 자료나 작업 흔적일 수는 있지만, "오늘 작업의 진실성"을 판단하는 기준에는 넣지 않는다.

### 3-1. 로컬/임시 파일

- [`.claude/settings.local.json`](C:/Users/black/Desktop/memorimap/.claude/settings.local.json)
- [`.tsbuildinfo`](C:/Users/black/Desktop/memorimap/.tsbuildinfo)
- [`supabase/.temp/`](C:/Users/black/Desktop/memorimap/supabase/.temp)
- [`playwright-report/`](C:/Users/black/Desktop/memorimap/playwright-report)
- [`test-results/`](C:/Users/black/Desktop/memorimap/test-results)

### 3-2. 작업 메모 / 보고서 / 해설 문서

- [`docs/daily_report_20260321.md`](C:/Users/black/Desktop/memorimap/docs/daily_report_20260321.md)
- [`docs/precision_verification_targets_20260321.md`](C:/Users/black/Desktop/memorimap/docs/precision_verification_targets_20260321.md)
- [`docs/high_risk_flow_verification_plan_20260321.md`](C:/Users/black/Desktop/memorimap/docs/high_risk_flow_verification_plan_20260321.md)
- [`docs/high_risk_flow_verification_report_20260321.md`](C:/Users/black/Desktop/memorimap/docs/high_risk_flow_verification_report_20260321.md)
- [`docs/worklog_high_risk_flow_resume_20260321.md`](C:/Users/black/Desktop/memorimap/docs/worklog_high_risk_flow_resume_20260321.md)

### 3-3. 기타 산출물/리소스

- `Phase 2.txt`
- `MyPageView 구조 개선.txt`
- `요금제.txt`
- `작업 이어서.txt`
- `자연장/`
- `장례식장 사진/`

해석 포인트:

- 이 파일들은 작업 과정에서 생긴 기록이지만, 정밀 검증의 증거 자체는 아니다.
- 특히 보고서류는 "무엇을 봤는가"를 설명할 뿐, 실제 통과 여부를 대체하지 못한다.

---

## 4. 검증 기준

오늘 작업을 평가할 때는 아래 기준으로 보는 것이 맞다.

### 4-1. 커밋 단위 기준

일일 보고서에 기록된 커밋은 다음 세 개다.

- `bd87437`
- `8fbe76a`
- `24db5b2`

여기서 중요한 점은 "커밋 수"가 아니라 "커밋이 문제를 정확히 분리했는가"다.

- `bd87437`은 예약 결제 테스트의 UUID 문제를 직접 다뤘다.
- `8fbe76a`는 파트너 승인 테스트의 워커 분산 문제를 분리했다.
- `24db5b2`는 하루치 핵심 변경을 통합했지만, 그 안에 E2E, 서비스, 마이그레이션, 맵핑이 모두 포함된다.

### 4-2. 실측 테스트 기준

일일 보고서의 E2E 결과는 다음이다.

```text
Total: 49 tests
Passed: 46
Failed: 0
Skipped: 3
```

이 수치에서 중요한 것은 실패 0건이다. 다만 skipped 3건은 그대로 해석하면 안 되고, 의도적 skip인지 추가 확인이 필요하다.

### 4-3. 데이터 정합성 기준

오늘 작업의 핵심 검증 포인트는 결국 데이터 정합성이다.

- canonical `plan_id`가 저장/조회/재조회에서 일치하는가
- 승인 RPC가 role 캐스팅 문제 없이 동작하는가
- 월간 리포트가 실제 허용된 대상만 처리하는가
- 서비스 레이어가 실패 시에도 규격을 유지하는가

### 4-4. 문서 해석 기준

문서류는 다음 순서로 읽는다.

1. 실행 결과를 먼저 본다.
2. 그 결과를 설명하는 문서를 본다.
3. 문서가 실제 코드나 DB와 충돌하면 코드/DB를 우선한다.

즉, 문서의 설명이 현실을 대체하지 못한다.

---

## 5. 해석 가이드

### 5-1. 숫자는 결과이고, 문맥은 원인이다

`46 passed / 0 failed / 3 skipped`는 결과다.
그러나 왜 그런 결과가 나왔는지 보려면 다음을 함께 읽어야 한다.

- 예약 테스트가 UUID와 serial 실행 문제를 동시에 가졌는지
- 승인 테스트가 병렬 워커에 취약했는지
- 월간 리포트가 인증 경계를 제대로 강제하는지

### 5-2. 서비스 분리는 구조 개선이 아니라 경계 정의다

`favoriteService.ts`, `geminiService.ts`, `sangjoFavoriteService.ts` 분리는 단순 정리로 보면 안 된다.

- 실패 처리 위치가 명확해진다.
- 호출 규격이 좁아진다.
- 테스트가 어느 레이어를 검증하는지 분리된다.

### 5-3. 마이그레이션 수정은 특히 보수적으로 읽어야 한다

이미 존재하는 마이그레이션을 다시 건드린 경우는 두 가지 가능성을 가진다.

- 실제 운영 반영본을 정리한 것
- 과거의 수정 흔적이 문서와 코드 사이에 남아 있는 것

그래서 이 부분은 "변경했다"보다 "어느 버전이 실제 기준인지"를 확인하는 쪽이 중요하다.

### 5-4. 요금제 맵핑은 표시명보다 키가 중요하다

한글 요금제명은 UI 친화적이지만, 실제 정합성 기준은 canonical 키다.

- 표시명: 사용자에게 보여주는 값
- canonical key: DB와 로직이 공유하는 값

오늘 작업은 이 둘을 같은 상태로 유지하게 만드는 방향이다.

### 5-5. skipped는 무조건 성공으로 읽지 않는다

`Skipped: 3`은 상황에 따라 정상일 수 있지만, 의도와 조건이 분명해야 한다.

- 환경 부족으로 skip된 경우
- 조건부 시나리오라서 skip된 경우
- 임시 진단용으로 제외된 경우

이 구분이 없으면, 결과 숫자만 보고 과대평가할 수 있다.

---

## 6. 결론

`2026-03-21`의 작업은 단순히 파일을 많이 바꾼 날이 아니라, 고위험 흐름의 기준을 다시 맞춘 날로 봐야 한다.

핵심 결론은 다음과 같다.

1. E2E는 단순 통과가 아니라, 순차성/UUID/canonical key 문제를 함께 고정하는 방향으로 정리됐다.
2. Edge Function은 진입점과 핵심 로직을 분리해 검증 경계를 명확히 했다.
3. DB 마이그레이션/RPC는 기능 추가보다 정합성 복원에 가깝다.
4. 요금제 맵핑은 표시 문자열 정리가 아니라 canonical 저장 기준 정리다.
5. 서비스 레이어 분리는 UI와 DB 사이의 경계를 더 명확하게 만든다.

따라서 오늘 작업의 실질적 성과는 "기능 추가"만이 아니라, 다음과 같은 기준을 명확히 한 데 있다.

- 무엇을 정밀 검증해야 하는가
- 무엇을 제외해야 하는가
- 어떤 결과를 성공으로 읽어야 하는가
- 어떤 문서는 참고용이고 어떤 결과가 기준인가

이 기준으로 보면, 오늘의 작업은 다음 단계로 넘어가기 위한 기반 정리로 충분히 의미가 있다.
