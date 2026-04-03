# AI 상담 흐름 업데이트 보고서

> 작성일: 2026-04-03  
> 기준 커밋: `89bfaa1124575afc648b3781ea8fffc4c0bf7220`

## 개요

이번 작업은 AI 상담 3개 흐름의 정밀 검증 결과를 반영해 실제 결함을 수정하고, DB 정책과 테스트까지 맞추는 데 목적이 있었다.

- Flow A: 마음이 AI 상담
- Flow B: 시설별 AI 상담
- Flow C: 상조 AI 비교/상담

핵심 결과는 다음과 같다.

- `B-1` 시설 쿼터 미체크 해결
- `B-2` 유저 측 상태 반영 해결
- `C-1` 상조 타임라인 미연동 해결
- `C-2` mock/real 경계 정리
- 저심각도 `B-3`, `B-4`, `C-3` 반영 완료

---

## 최종 상태

| ID | 항목 | 상태 | 비고 |
|---|---|---|---|
| B-1 | 시설별 AI 상담에서 시설 쿼터 미체크 | 해결 | atomic quota RPC + DB 함수 정합성 수정 |
| B-2 | 유저 측 상담 상태 실시간 반영 없음 | 해결 | Realtime + fallback sync 보강 |
| C-1 | 상조 계약 생성 후 타임라인 미기록 | 해결 | 프런트 호출 + timeline RLS 수정 |
| C-2 | `geminiService.ts`가 사실상 mock 전용 | 정리 완료 | mock/real 경계 명시, real 경로 연동 |
| B-3 | 토픽이 AI 프롬프트에 미전달 | 해결 | system prompt에 현재 topic 반영 |
| B-4 | 토픽이 DB에 미저장 | 해결 | `consultations.topic` 컬럼 및 저장 반영 |
| C-3 | 계약번호 생성 로직 중복 | 해결 | 공용 유틸 추출 |

---

## 반영 내용

### 1. Flow B 시설 쿼터 및 상태 반영

수정 파일:

- [ConsultationView.tsx](/C:/Users/black/Desktop/memorimap/components/Consultation/ConsultationView.tsx)
- [queries.ts](/C:/Users/black/Desktop/memorimap/lib/queries.ts)
- [gemini.ts](/C:/Users/black/Desktop/memorimap/lib/gemini.ts)
- [consultation.ts](/C:/Users/black/Desktop/memorimap/types/consultation.ts)

적용 사항:

- UUID 시설이면 `check_and_increment_ai_consult_quotas`로 user + facility quota를 atomic 체크
- legacy 경로는 기존 user quota RPC 유지
- 시설 quota 초과 시 별도 안내 UI 표시
- 기존 상담 재진입 시 상태 초기화/복원 정리
- `consultations` Realtime 구독 추가
- 실환경 누락 보강을 위해 상태 fetch fallback + polling 추가
- 새 상담 생성 시 `topic`을 DB에 함께 저장
- AI system prompt에 현재 상담 topic 포함

### 2. Flow C 상조 계약 및 타임라인

수정 파일:

- [BrandChat/index.tsx](/C:/Users/black/Desktop/memorimap/components/sangjo/BrandChat/index.tsx)
- [BrandScenario/index.tsx](/C:/Users/black/Desktop/memorimap/components/sangjo/BrandScenario/index.tsx)
- [ModalContainer.tsx](/C:/Users/black/Desktop/memorimap/components/ModalContainer.tsx)
- [contractNumber.ts](/C:/Users/black/Desktop/memorimap/lib/sangjo/contractNumber.ts)
- [SangjoConsultationModal.tsx](/C:/Users/black/Desktop/memorimap/components/Consultation/SangjoConsultationModal.tsx)

적용 사항:

- 계약 저장 후 `addTimelineEvent()` 호출 연동
- 초기 검증에서 `sangjo_contract_timeline` RLS로 insert가 막히는 실제 결함 확인
- timeline insert/select/update/delete 정책 정리 후 실DB 검증 통과
- 중복된 계약번호 생성 코드를 공용 유틸로 추출
- 오해를 부르던 fail-open 주석 제거

### 3. Gemini 경계 정리

수정 파일:

- [geminiService.ts](/C:/Users/black/Desktop/memorimap/services/geminiService.ts)

적용 사항:

- `VITE_GEMINI_SERVICE_MODE` 기반 mock/real 경계 명시
- real 모드에서는 `lib/gemini.ts` 경유
- 실패 시 mock fallback 유지

---

## DB 반영 사항

적용 마이그레이션:

- [20260403170000_fix_ai_consult_quota_plan_normalization.sql](/C:/Users/black/Desktop/memorimap/supabase/migrations/20260403170000_fix_ai_consult_quota_plan_normalization.sql)
- [20260403183000_fix_sangjo_contract_timeline_rls.sql](/C:/Users/black/Desktop/memorimap/supabase/migrations/20260403183000_fix_sangjo_contract_timeline_rls.sql)
- [20260403190000_add_topic_to_consultations.sql](/C:/Users/black/Desktop/memorimap/supabase/migrations/20260403190000_add_topic_to_consultations.sql)

실제 반영된 내용:

- `check_and_increment_ai_consult_quotas()`가 `PERSONAL_FREE` 기준으로 동작하도록 정규화
- 시설 플랜 조회가 live DB의 `name_en` 값과 맞도록 보정
- `sangjo_contract_timeline`에 상조 관리자 insert 허용
- `consultations.topic` 컬럼 추가

---

## 검증 결과

통과:

- `npm run typecheck`
- `npx vitest run tests/lib/aiConsultationFlowContracts.spec.ts`
- `npx vitest run tests/lib/aiConsultationLowSeverity.spec.ts`
- `npx playwright test tests/e2e/ai.consultationFlows.spec.ts --reporter=line --workers=1`
- `npx playwright test tests/e2e/sangjo.timeline.spec.ts --reporter=line --workers=1`

검증 파일:

- [ai.consultationFlows.spec.ts](/C:/Users/black/Desktop/memorimap/tests/e2e/ai.consultationFlows.spec.ts)
- [sangjo.timeline.spec.ts](/C:/Users/black/Desktop/memorimap/tests/e2e/sangjo.timeline.spec.ts)
- [aiConsultationFlowContracts.spec.ts](/C:/Users/black/Desktop/memorimap/tests/lib/aiConsultationFlowContracts.spec.ts)
- [aiConsultationLowSeverity.spec.ts](/C:/Users/black/Desktop/memorimap/tests/lib/aiConsultationLowSeverity.spec.ts)

---

## 정리

이번 수정으로 AI 상담 흐름의 실제 결함은 핵심 경로 기준으로 해소됐다.

- 시설별 AI 상담은 quota와 상태 반영이 실제 DB 기준으로 닫혔다.
- 상조 AI 상담은 계약 저장과 타임라인 기록이 실제 DB 정책까지 맞춰졌다.
- 토픽 저장, 프롬프트 반영, 계약번호 유틸화까지 정리됐다.

현재 남은 것은 기능 결함이 아니라 운영 품질 점검 성격에 가깝다.

- real Gemini 응답 품질 검토
- 운영 환경에서의 로그/메트릭 점검
- 필요 시 Flow A까지 포함한 추가 UX 회귀 점검
