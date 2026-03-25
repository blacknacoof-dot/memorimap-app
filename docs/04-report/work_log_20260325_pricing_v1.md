# 2026-03-25 요금제 v1 작업 내역

## 커밋 4건

| 커밋 | 메시지 | 파일 |
|------|--------|------|
| `bd38a2a` | chore(pricing): finalize v1 validation follow-ups | types/db.ts, PersonalSubscriptionManager.tsx, 마이그레이션, 문서 2건 |
| `f29e39f` | docs(pricing): add NHN KCP test corrections | 문서 3건 |
| `5c3c30a` | docs(pricing): hold old INSERT policy — facility auth client vs service_role mismatch | 문서 3건 |
| `c3e491f` | fix(rls): add facility INSERT policy + drop legacy payments_insert_service_or_owner | 마이그레이션 1건 |

## 코드 변경

- `types/db.ts`: `CanonicalUserSubscriptionPlan` / `LegacyUserSubscriptionPlan` 분리, `BillingCycle`, `PaymentContext` 타입 추가
- `components/SuperAdmin/PersonalSubscriptionManager.tsx`: PERSONAL_BASIC → `베이직 (단종)` 표시
- `supabase/migrations/20260325_pricing_v1_schema.sql`: RLS `::text` 캐스팅 + `f.user_id` 컬럼명 수정
- `supabase/migrations/20260325_facility_payments_insert_policy.sql`: facility INSERT 정책 신규 + 구정책 DROP

## DB 운영 (Supabase SQL Editor 실행)

| 작업 | 결과 |
|------|------|
| `20260325_pricing_v1_schema.sql` 적용 | 성공 (에러 3건 수정 후) |
| `user_subscriptions_plan_id_check` 제약 조건 업데이트 | 성공 |
| `personal_free` → `PERSONAL_FREE` 백필 (29건) | 성공 |
| `subscription_payments_insert_facility` 정책 추가 | 성공 |
| `payments_insert_service_or_owner` 구정책 DROP | 성공 |

## 인프라 설정

| 항목 | 상태 |
|------|------|
| `.env.local` PortOne 키 3종 | 완료 |
| Vercel 환경변수 동기화 + Redeploy | 완료 |
| Edge Function 배포 (verify-payment, approve-partner) | 완료 |
| Supabase PORTONE_API_SECRET | 완료 |

## 문서 업데이트 (사용자 작성 + Claude 검증)

- `claude_pricing_execution_handoff_20260325.md`: 섹션 7~9 추가 (상태 확인, 테스트 메모, facility RLS 주의)
- `pricing_v1_claude_review_20260325.md`: 후속 확인 메모 + NHN KCP 보정 + facility RLS 재검토
- `portone_nhn_kcp_direction_20260325.md`: 섹션 10 추가 (fallback/plan_id/secret/facility 정책 보정)

## 검증 결과

| 항목 | 결과 |
|------|------|
| tsc --noEmit | 에러 0건 |
| npm run build | 성공 |
| subscription_plans v1 가격 | 정상 반영 |
| plan_id 백필 | PERSONAL_FREE 29건 완료 |
| INSERT RLS 3정책 | service + personal + facility 정상 |

## 미해결: 테스트 결제 DB 반영 0건

- 개인/시설/상조 3종 결제 테스트 실행
- 결제 성공 toast는 표시됨
- 그러나 DB 반영 0건 (user_subscriptions, facility_subscriptions, subscription_payments 모두 오늘 날짜 row 없음)
- 원인 미확인 상태

### 다음 세션 확인 사항

1. 브라우저 F12 콘솔에서 결제 시 에러 로그 확인
2. PortOne 결제창이 실제로 열렸는지 (카드 선택 화면 등) 확인
3. verify-payment Edge Function이 실제로 호출되었는지 확인
4. PortOne 콘솔에서 테스트 결제 내역 존재 여부 확인
5. `.env.local` PortOne 키 중복 항목 정리 (STORE_ID, CHANNEL_KEY 각 2건 중복)
