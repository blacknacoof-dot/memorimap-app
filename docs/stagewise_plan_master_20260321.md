# 단계별 플랜 마스터

> 작성일: 2026-03-21  
> 목적: 흩어져 있는 단계별 계획 문서를 하나의 실행 순서로 통합하고, 실제 구현 우선순위와 의존성을 명확히 정리한다.

## 1. 읽은 문서 범위

이 문서는 다음 계획/분석 문서를 기준으로 재구성했다.

- [`plan_superadmin_work.md`](/C:/Users/black/Desktop/memorimap/plan_superadmin_work.md)
- [`plan_superadmin_fixes.md`](/C:/Users/black/Desktop/memorimap/plan_superadmin_fixes.md)
- [`plan_pending_features.md`](/C:/Users/black/Desktop/memorimap/plan_pending_features.md)
- [`plan_contract_detail_drawer.md`](/C:/Users/black/Desktop/memorimap/plan_contract_detail_drawer.md)
- [`uxui_improvement_plan.md`](/C:/Users/black/Desktop/memorimap/uxui_improvement_plan.md)
- [`docs/implementation_plan_phase_2.md`](/C:/Users/black/Desktop/memorimap/docs/implementation_plan_phase_2.md)
- [`docs/01-plan/features/integrated_governance.plan.md`](/C:/Users/black/Desktop/memorimap/docs/01-plan/features/integrated_governance.plan.md)
- [`docs/01-plan/features/mypage_v2.plan.md`](/C:/Users/black/Desktop/memorimap/docs/01-plan/features/mypage_v2.plan.md)
- [`docs/01-plan/features/sangjo_chat_buttons.plan.md`](/C:/Users/black/Desktop/memorimap/docs/01-plan/features/sangjo_chat_buttons.plan.md)
- [`docs/sangjo_dashboard_improvement_report.md`](/C:/Users/black/Desktop/memorimap/docs/sangjo_dashboard_improvement_report.md)
- [`research_20260307_verification.md`](/C:/Users/black/Desktop/memorimap/research_20260307_verification.md)

## 2. 핵심 이해

이 코드베이스의 단계별 플랜은 단순한 기능 추가 순서가 아니다.
실제로는 아래 4개의 축이 서로 맞물려 있다.

1. 데이터 진실성
2. 권한과 보안
3. 화면/흐름 구현
4. 검증과 문서화

이 4개 축을 분리하지 않으면, UI는 먼저 보이지만 DB와 상태가 어긋나는 문제가 계속 발생한다.
따라서 모든 플랜은 "보이는 기능"보다 "근거 데이터가 먼저 맞는가"를 기준으로 읽어야 한다.

## 3. 전체 단계 구조

### Phase 0. 기준선 정리

목표:
- 어떤 문서를 실행 기준으로 볼지 정한다.
- 이미 해결된 이슈와 아직 유효한 이슈를 분리한다.
- 스키마와 문서의 불일치를 먼저 제거한다.

핵심 작업:
- `audit_logs`, `plan_id`, `route_logs` 같은 문서-스키마 불일치 정리
- 중복 문서 정리
- "이미 수정됨"과 "실제 미해결" 구분

판단 기준:
- QA 문서가 실제 스키마를 잘못 가리키면 그 문서는 검증용으로만 남기고, 실행 SQL은 제거한다.
- 리뷰 문서는 이전 커밋 반영이 누락되면 그대로 신뢰하지 않는다.

### Phase 1. 데이터와 권한의 진실성

목표:
- 저장되는 값의 기준을 하나로 맞춘다.
- 인증, RLS, 관리자 권한을 먼저 안정화한다.

핵심 대상:
- `facility_subscriptions.plan_id`
- `subscription_plans.id`
- `audit_logs`
- `sangjo_contracts`
- `system_settings`
- `send-monthly-report`, `approve-partner`

왜 먼저인가:
- 이 단계가 틀리면 UI는 정상처럼 보여도 DB가 틀리고, 이후 단계의 모든 화면이 잘못된 데이터를 기반으로 움직인다.
- 특히 `plan_id`와 `audit_logs`는 여러 문서에서 반복 등장하는 공통 기준점이다.

판단 기준:
- `plan_id`는 canonical id 기준으로만 저장/조회한다.
- `audit_logs`는 문서별로 컬럼명을 추측하지 말고 실제 스키마에 맞춘다.
- 관리용 Edge Function은 UI가 아니라 서버 인증 기준으로 보호한다.

### Phase 2. 핵심 운영 플로우 구현

목표:
- 예약, 상담, 구독, 승인, 리포트 같은 운영 플로우를 실제 데이터 흐름과 연결한다.

핵심 플로우:
- 예약 생성/취소
- AI 상담 시작/종료
- 구독 전환 및 무료 플랜 저장
- 파트너 승인/거절
- 월간 리포트 발송

이 단계의 포인트:
- 화면만 먼저 만드는 것이 아니라, 화면의 버튼이 어떤 DB 행을 바꾸는지 먼저 확정한다.
- "성공 메시지"보다 "재조회했을 때 같은 상태가 보이는지"가 더 중요하다.

대표 연결:
- [`docs/01-plan/features/mypage_v2.plan.md`](/C:/Users/black/Desktop/memorimap/docs/01-plan/features/mypage_v2.plan.md): 예약/즐겨찾기/이력 통합
- [`docs/01-plan/features/sangjo_chat_buttons.plan.md`](/C:/Users/black/Desktop/memorimap/docs/01-plan/features/sangjo_chat_buttons.plan.md): 채팅 액션 로그화
- [`plan_contract_detail_drawer.md`](/C:/Users/black/Desktop/memorimap/plan_contract_detail_drawer.md): 계약 상세 Drawer와 메모 저장

### Phase 3. 관리자/슈퍼관리자 운영 도구

목표:
- 관리자 화면을 단순 조회가 아니라 실제 운영 도구로 만든다.

핵심 대상:
- `SuperAdminDashboard`
- `AdminCommunication`
- `PartnerAdmissions`
- `ContractMonitoring`
- `RevenueManagement`
- `AdminSettings`
- `FacilityManagement`

중요한 이해:
- 관리자 화면은 "예쁘게 보이는 대시보드"가 아니라, 이미 정의된 DB 상태를 정확히 읽고 조작하는 곳이다.
- 따라서 이 단계에서는 UI 분리보다도 실제 데이터 소스가 맞는지 먼저 본다.

대표 이슈:
- `notices`와 `platform_notices` 같은 중복 의미 테이블 분리
- `Lead` 같은 로컬 타입을 공용 타입으로 승격
- `ContractDetailDrawer`에서 메모를 저장하고 Realtime으로 반영

### Phase 4. UX/UI 개선

목표:
- 기능이 맞는 상태에서만 시각/상호작용을 다듬는다.

핵심 문서:
- [`uxui_improvement_plan.md`](/C:/Users/black/Desktop/memorimap/uxui_improvement_plan.md)

이 단계의 원칙:
- 접근성, 간격, 라벨, z-index, 빈 상태, 오류 메시지를 정돈한다.
- 하지만 이 작업은 데이터 흐름이 맞아야 효과가 있다.

우선순위:
- 폼, 예약, 결제, 관리자 접근성
- 모달/드로어 z-index 충돌
- 빈 상태와 에러 상태의 UX 표준화

### Phase 5. 검증과 마무리

목표:
- 구현이 아니라 검증 가능한 상태로 남긴다.

핵심 산출물:
- QA executable 문서
- 구조 요약/시나리오 문서
- 수동 검증 체크리스트
- 릴리스 readiness report

이 단계의 원칙:
- 문서가 현실보다 앞서면 안 된다.
- 실제 스키마와 다른 SQL은 삭제하거나 주석 처리한다.
- 이미 해결된 이슈는 리스크로 계속 남기지 않는다.

## 4. 작업 우선순위 해석

### P0

즉시 처리해야 하는 항목.
- 인증 우회 가능성
- RLS/권한 불일치
- canonical `plan_id` 불일치
- 관리자 Edge Function 보안
- 저장 성공 후 조회 실패

### P1

이번 사이클에서 반드시 정리해야 하는 항목.
- 관리자 화면의 상태/props 정합성
- Realtime cleanup
- console/error 정책 정리
- 문서와 실제 스키마 정렬

### P2

기능 성숙도를 높이는 항목.
- 공용 타입 정리
- 관리자 대시보드 컴포넌트 분리
- 큰 컴포넌트 분해
- 알림/패널/드로어 구조 개선

### P3

리팩터링과 구조 정리.
- `queries.ts` 분할
- API layer 중복 제거
- 재사용 컴포넌트 추출

## 5. 문서 간 연결 해석

### `plan_superadmin_work.md`

- 슈퍼관리자 기능을 단계별로 쪼갠 작업 계획이다.
- 큰 범위의 "무엇을 먼저 만들지"를 보여준다.
- 실제 구현에서는 P0/P1의 보안과 권한부터 봐야 한다.

### `plan_superadmin_fixes.md`

- 이미 발견된 문제를 패치 단위로 고치는 보수 계획이다.
- 단순 기능 추가가 아니라, 실제 오진단과 스키마 불일치까지 포함한다.

### `plan_pending_features.md`

- 아직 하지 않은 기능을 나열한 백로그에 가깝다.
- 구현 순서보다 범위 확인에 더 유용하다.

### `plan_contract_detail_drawer.md`

- 하나의 기능을 끝까지 구현하는 구체 플랜이다.
- `types -> DB migration -> hook -> UI -> wiring` 순서가 명확하다.

### `docs/implementation_plan_phase_2.md`

- 오류 처리, 클라이언트 싱글톤, realtime cleanup 같은 기반 정비 플랜이다.
- 기능보다 먼저 안정성을 잡는 단계로 읽어야 한다.

### `docs/01-plan/features/*`

- 개별 기능을 제품 단위로 묶은 설계서다.
- `mypage_v2`는 사용자 중심 SSOT,
- `sangjo_chat_buttons`는 이벤트 수집,
- `integrated_governance`는 AI 상담 데이터 통합을 다룬다.

## 6. 실행 순서 제안

1. 문서 정합성 정리
2. DB/RLS/권한 기준 확정
3. canonical id와 저장 구조 통일
4. 관리자 플로우 안정화
5. 사용자 플로우 정합성 보강
6. UX/UI polish
7. QA 문서와 검증 시나리오 갱신

이 순서를 어기면 흔히 다음 문제가 생긴다.
- UI는 완성됐는데 재조회가 틀림
- QA 문서는 통과인데 실제 스키마와 불일치
- 관리자 기능은 보이지만 권한이 불안정
- 리포트/로그가 데이터 기준과 어긋남

## 7. 이번 코드베이스에서 특히 중요한 기준

1. `plan_id`는 의미값이 아니라 canonical key로 취급한다.
2. 관리자 기능은 UI가 아니라 서버 권한이 기준이다.
3. 문서의 SQL은 실제 스키마와 일치해야 한다.
4. 큰 기능은 `type -> db -> hook -> ui -> verification` 순서로 간다.
5. "동작처럼 보임"보다 "재조회 후도 동일함"을 우선한다.

## 8. 결론

이 프로젝트의 단계별 플랜은 기능 목록이 아니라, 데이터 진실성 -> 권한 -> 운영 플로우 -> UI -> 검증의 순서로 읽어야 한다.

즉, 먼저 맞춰야 하는 것은 예쁜 화면이 아니라:
- 저장 기준
- 권한 기준
- 스키마 기준
- 재조회 기준

그 위에 관리자 화면과 사용자 화면을 얹고, 마지막에 UX와 문서를 다듬는 구조가 맞다.
