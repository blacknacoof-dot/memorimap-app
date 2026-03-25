# 2026-03-21 정밀 검증 대상 분리 문서

## 목적

이 문서는 `2026-03-21` 작업 전체를 다시 확인할 때,
무엇을 **정밀 검증 대상**으로 보고 무엇을 **제외 대상**으로 볼지 분리하기 위한 기준 문서다.

핵심 원칙은 다음과 같다.

- 코드는 변경하지 않는다.
- 검증 대상은 기능/DB/E2E/배포 산출물로 나눈다.
- 테스트 산출물, 로컬 설정, 캐시 파일은 검증 증거로만 참고하고 대상에는 넣지 않는다.

---

## 1. 정밀 검증 대상

### 1-1. E2E 고위험 플로우

아래 항목은 실제 사용자 흐름과 직결되므로 우선 검증 대상이다.

| 대상 파일 | 검증 포인트 | 기대 결과 |
|---|---|---|
| `tests/e2e/report.smoke.spec.ts` | 월간 리포트 생성/응답 | `46 passed / 0 failed / 3 skipped` 기준 유지 |
| `tests/e2e/partner.revenue.spec.ts` | 파트너 요금제/업그레이드 동작 | starter/enterprise 전환과 UI 반영 일치 |
| `tests/e2e/partner.approval.spec.ts` | 파트너 승인 RPC와 워커 분산 안정성 | `test.describe.serial` 기반으로 안정 실행 |
| `tests/e2e/reservation.payment.spec.ts` | 예약-결제-검증 흐름 | UUID 기반 예약 생성과 결제 상태 전이 정상 |
| `tests/e2e/subscription.flow.spec.ts` | 요금제 선택/전환 | plan_id canonical representation 유지 |
| `tests/e2e/ai.compare.spec.ts` | AI 비교/상담 진입 흐름 | 비교 모달 및 상담 진입 경로 정상 |
| `tests/e2e/qa.execution.spec.ts` | QA 실행 기준 시나리오 | 보안/예약/마이페이지 흐름 정상 |

### 1-2. Edge Function

| 대상 파일 | 검증 포인트 | 기대 결과 |
|---|---|---|
| `supabase/functions/send-monthly-report/index.ts` | 인증, 대상 사용자 판별, 응답 포맷 | 승인된 호출만 처리 |
| `supabase/functions/send-monthly-report/core.ts` | HTML 템플릿, 업그레이드 힌트, subject | 월간 리포트 템플릿 정상 렌더링 |

### 1-3. DB 마이그레이션 / RPC

| 대상 파일 | 검증 포인트 | 기대 결과 |
|---|---|---|
| `supabase/migrations/20260215_fix_approve_partner_e2e.sql` | `approve_partner_transaction` role cast | `public.user_role` 캐스트 정상 |
| `supabase/migrations/20260223_high_severity_fixes.sql` | 고위험 수정 반영 여부 | 이전 버전과 충돌 없음 |
| `supabase/migrations/20260226_partner_rpc_atomic.sql` | RPC 원자성 | 중복 승인 방지 |
| `supabase/migrations/20260301_sangjo_facilities_sync.sql` | 시설 동기화 | 승인 후 시설 생성/갱신 일관성 |
| `supabase/migrations/20260320_assign_freedlife_sangjo_admin.sql` | 관리자 배정 | 대상 계정에 적절한 권한 부여 |
| `supabase/migrations/20260320_backfill_facility_subscription_plan_ids.sql` | plan_id 백필 | 기존 시설 데이터의 plan_id 정합성 |

### 1-4. 요금제 맵핑

| 대상 파일 | 검증 포인트 | 기대 결과 |
|---|---|---|
| `lib/subscriptionPlanIds.ts` | 플랜 ID 정규화 | `free`, `basic`, `premium`, `enterprise` 매핑 일치 |

### 1-5. 서비스 레이어

| 대상 파일 | 검증 포인트 | 기대 결과 |
|---|---|---|
| `supabase/services/favoriteService.ts` | CRUD 기본 동작 | 즐겨찾기 생성/조회/삭제 정상 |
| `supabase/services/geminiService.ts` | AI 연동 경계 | 실패 시 처리와 응답 규격 유지 |
| `supabase/services/sangjoFavoriteService.ts` | 상조 즐겨찾기 동작 | 사용자별 데이터 분리 유지 |

---

## 2. 검증 제외 대상

아래 항목은 정밀 검증 대상에 포함하지 않는다.
다만 실행 증거 또는 작업 흔적으로는 참고 가능하다.

### 2-1. 로컬/임시 파일

- [`.claude/settings.local.json`](C:/Users/black/Desktop/memorimap/.claude/settings.local.json)
- [`.tsbuildinfo`](C:/Users/black/Desktop/memorimap/.tsbuildinfo)
- `supabase/.temp/*`
- `playwright-report/`
- `test-results/`

### 2-2. 작업 메모 / 보고서 / 산출 문서

- `Phase 2.txt`
- `MyPageView 구조 개선.txt`
- `요금제.txt`
- `작업 이어서.txt`
- `docs/daily_report_20260321.md`
- `docs/high_risk_flow_verification_plan_20260321.md`
- `docs/high_risk_flow_verification_report_20260321.md`
- `docs/worklog_high_risk_flow_resume_20260321.md`

### 2-3. 이미지/미디어/자료 파일

- `자연장/`
- `장례식장 사진/`
- 기타 로컬 업로드 이미지

---

## 3. 검증 기준

정밀 검증은 아래 순서로 판단한다.

1. 커밋 단위 확인
   - `bd87437`
   - `8fbe76a`
   - `24db5b2`
   - `6a42c76`
2. E2E 실측 결과 확인
   - 전체 결과가 `46 passed / 0 failed / 3 skipped`인지 확인
3. DB/RPC 정합성 확인
   - 승인, 결제, 요금제 백필, 월간 리포트 대상 조회가 서로 충돌하지 않는지 확인
4. 산출물 분리 확인
   - 테스트 리포트와 실데이터 변경을 분리해서 해석

---

## 4. 해석 가이드

- `실측 결과`는 테스트 실행 로그를 기준으로 본다.
- `문서 기록`은 보조 증거로 본다.
- `워킹트리 상태`는 커밋 여부를 판단할 때만 사용한다.
- 코드 변경 없이 문서만 정리할 때는 검증 범위 정의와 결과 해석을 분리해서 기록한다.

---

## 5. 결론

오늘 작업의 정밀 검증은 다음 네 축으로 나누는 것이 가장 안전하다.

1. E2E 고위험 플로우
2. Edge Function
3. DB 마이그레이션 / RPC
4. 요금제 맵핑 및 서비스 레이어

이 기준으로 보면, 테스트 산출물이나 로컬 임시 파일은 검증 대상이 아니고,
실제 판단은 위 4개 축의 실측 결과와 커밋 이력으로만 내리는 것이 맞다.
