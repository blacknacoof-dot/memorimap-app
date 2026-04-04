# AI 상담 흐름 통합 테스트 점검 플랜

> 작성일: 2026-04-03
> 목적: 마음이 AI 상담 / 시설별 AI 상담 / 상조 AI 상담 3개 흐름의 기능·연동 정상 동작 검증

---

## 📌 테스트 대상 요약

| # | 흐름 | 진입점 | 저장 테이블 | 관리자 수신 |
|---|------|--------|------------|------------|
| A | 마음이 AI 상담 (일반) | `ChatInterface.tsx` | `consultations` | 시설 관리자 대시보드 |
| B | 시설별 AI 상담 | `ConsultationView.tsx` | `consultations` | 시설 관리자 대시보드 |
| C | 상조 AI 비교/상담 | `SangjoConsultationModal.tsx` → `BrandChatInterface.tsx` | `sangjo_contracts` | 상조 파트너 대시보드 |

---

## 🔍 테스트 전제 조건

| 항목 | 확인 방법 |
|------|----------|
| 로그인된 일반 유저 계정 | Supabase Auth 로그인 상태 |
| 시설 관리자 계정 (시설 1곳 이상 소유) | `facilities` + `facility_admins` 매핑 확인 |
| 상조 파트너 계정 (상조 1곳 이상 소유) | `sangjo_hq_admins` 매핑 확인 |
| 슈퍼관리자 계정 | `profiles.role = 'super_admin'` |
| Gemini API 키 유효 | `.env`의 `VITE_GEMINI_API_KEY` 확인 |
| Supabase Realtime 활성화 | Dashboard > Realtime > `consultations`, `sangjo_contracts` 활성 |

---

## A. 마음이 AI 상담 (일반 유저 → 시설)

### A-1. 진입 및 초기 화면
| # | 검증 항목 | 경로/컴포넌트 | 기대 결과 | Pass/Fail |
|---|----------|-------------|----------|-----------|
| 1 | 시설 상세에서 "AI 상담" 탭 진입 | `ChatInterface.tsx` | 마음이 인사 메시지 표시 |  |
| 2 | FAQ 칩 표시 | `getFacilityFaqs()` | 해당 시설 FAQ 칩 렌더링 |  |
| 3 | 시설 타입별 폼 분기 | `initialIntent` prop | funeral_home→`FuneralSearchForm`, memorial→`MemorialSearchForm`, pet→`PetSearchForm` |  |

### A-2. 메시지 전송 및 AI 응답
| # | 검증 항목 | 경로/컴포넌트 | 기대 결과 | Pass/Fail |
|---|----------|-------------|----------|-----------|
| 4 | 유저 메시지 전송 | 입력창 → 전송 | 메시지 표시 + 스트리밍 응답 시작 |  |
| 5 | Gemini 스트리밍 응답 | `sendMessageToGemini()` | 실시간 텍스트 스트리밍 정상 |  |
| 6 | 에러 시 사용자 메시지 | API 실패 시 | 기술적 오류 아닌 사용자 친화적 메시지 |  |

### A-3. 쿼터 게이팅
| # | 검증 항목 | 경로/컴포넌트 | 기대 결과 | Pass/Fail |
|---|----------|-------------|----------|-----------|
| 7 | 무료 유저 쿼터 체크 | `check_and_increment_user_quota('ai_consult')` | 허용 범위 내 → `allowed: true` |  |
| 8 | 쿼터 초과 시 UpgradePrompt | `UpgradePrompt` 렌더링 | 업그레이드 안내 모달 표시 |  |
| 9 | 프리미엄 유저 무제한 | quota limit = -1 | 제한 없이 사용 가능 |  |

### A-4. 상담 신청 (폼 제출 → DB 저장)
| # | 검증 항목 | 경로/컴포넌트 | 기대 결과 | Pass/Fail |
|---|----------|-------------|----------|-----------|
| 10 | REQUEST_CONSULTATION 액션 | AI 응답 내 액션 | `ConsultationForm` 모달 열림 |  |
| 11 | 폼 필드 입력 | 이름, 전화번호, 메모 | 필수값 미입력 시 에러 표시 |  |
| 12 | 제출 → DB 저장 | `createConsultation()` | `consultations` 테이블에 `status: 'pending'` 행 생성 |  |
| 13 | 메시지 이력 저장 | `updateConsultation()` | `messages` JSONB에 대화 이력 저장 |  |
| 14 | 중복 제출 방지 | `isSubmitting` 상태 | 버튼 비활성화 |  |

### A-5. 시설 관리자 수신 확인
| # | 검증 항목 | 경로/컴포넌트 | 기대 결과 | Pass/Fail |
|---|----------|-------------|----------|-----------|
| 15 | Realtime 알림 | `ConsultationList.tsx` postgres_changes | 새 상담 즉시 목록에 표시 |  |
| 16 | 상담 상세 보기 | 목록 항목 클릭 | 유저 정보 + 메시지 이력 확인 가능 |  |
| 17 | 접수 처리 | "접수하기" 버튼 | `status: 'pending' → 'accepted'` 변경 |  |
| 18 | 유저 측 상태 반영 | 유저 마이페이지 | 상담 상태 "접수됨" 표시 |  |

---

## B. 시설별 AI 상담

### B-1. 진입 및 토픽 선택
| # | 검증 항목 | 경로/컴포넌트 | 기대 결과 | Pass/Fail |
|---|----------|-------------|----------|-----------|
| 19 | 시설 상세 → AI 상담 버튼 | `ConsultationView.tsx` | 상담 화면 진입 |  |
| 20 | 토픽 선택 칩 | ConsultationTopic enum | 장묘 방식/이용 절차/가격 옵션/방문 예약 표시 |  |
| 21 | FAQ 로딩 | `getFacilityFaqs()` | 시설별 FAQ 데이터 로딩 |  |

### B-2. 첫 메시지 → 쿼터 + 상담 생성
| # | 검증 항목 | 경로/컴포넌트 | 기대 결과 | Pass/Fail |
|---|----------|-------------|----------|-----------|
| 22 | 첫 메시지 전송 시 쿼터 체크 | `checkQuota('ai_consult', category)` | 첫 메시지에서만 체크 (이후 체크 안 함) |  |
| 23 | 쿼터 통과 → 상담 생성 | `createConsultation()` | `consultations` 행 생성, `consultationId` 설정 |  |
| 24 | 스트리밍 응답 | `streamConsultationMessage()` | 시설 컨텍스트 포함 응답 스트리밍 |  |
| 25 | 후속 메시지 | 추가 질문 | 쿼터 재체크 없이 대화 계속 |  |

### B-3. 시설 쿼터 (시설 측 한도)
| # | 검증 항목 | 경로/컴포넌트 | 기대 결과 | Pass/Fail |
|---|----------|-------------|----------|-----------|
| 26 | 시설 쿼터 체크 | `check_and_increment_facility_quota('ai_chat')` | 시설 구독 등급별 한도 적용 |  |
| 27 | 시설 쿼터 초과 | 초과 시 | 시설 쿼터 소진 안내 (유저 쿼터와 별도) |  |

### B-4. 관리자 연동 (A-5와 동일 경로)
| # | 검증 항목 | 경로/컴포넌트 | 기대 결과 | Pass/Fail |
|---|----------|-------------|----------|-----------|
| 28 | Realtime 수신 | `ConsultationList.tsx` | 시설 관리자 대시보드에 즉시 표시 |  |
| 29 | 상태 변경 플로우 | pending → accepted → completed | 전체 상태 전환 정상 |  |

---

## C. 상조 AI 비교/상담

### C-1. 비교 모드 진입
| # | 검증 항목 | 경로/컴포넌트 | 기대 결과 | Pass/Fail |
|---|----------|-------------|----------|-----------|
| 30 | "상조 비교" 버튼 진입 | `SangjoConsultationModal.tsx` | 환영 메시지 + 선호도 칩 표시 |  |
| 31 | 선호도 칩 목록 | preference chips | 가성비/품질/안전/종교/급해요 표시 |  |

### C-2. 비교 쿼터 + 추천
| # | 검증 항목 | 경로/컴포넌트 | 기대 결과 | Pass/Fail |
|---|----------|-------------|----------|-----------|
| 32 | 첫 칩 클릭 → 쿼터 체크 | `check_and_increment_user_quota('sangjo_compare')` | 쿼터 확인 |  |
| 33 | 쿼터 초과 시 | UpgradePrompt | 업그레이드 안내 표시 |  |
| 34 | 필터링 로직 | 칩별 필터 | 가성비→랜덤, 품질→rating≥4.8, 안전→reviews>800, 종교→feature매칭, 급해요→후불제 |  |
| 35 | Top 3 추천 카드 | 추천 결과 | 3개 상조 회사 카드 렌더링 |  |

### C-3. 브랜드 채팅 전환
| # | 검증 항목 | 경로/컴포넌트 | 기대 결과 | Pass/Fail |
|---|----------|-------------|----------|-----------|
| 36 | "상담 연결" 클릭 | 추천 카드 버튼 | `BrandChatInterface` 로 전환 |  |
| 37 | 브랜드 컨피그 로딩 | `buildBrandConfig()` | 회사별 맞춤 시나리오 버튼 표시 |  |
| 38 | 시나리오 선택 | 시나리오 버튼 | AI 응답 생성 |  |

### C-4. 상담 신청 (상조 계약)
| # | 검증 항목 | 경로/컴포넌트 | 기대 결과 | Pass/Fail |
|---|----------|-------------|----------|-----------|
| 39 | RESERVE 액션 | AI 응답 | `ConsultationForm` (phone 모드) 열림 |  |
| 40 | URGENT_DISPATCH 액션 | 긴급 출동 | `ConsultationForm` (urgent 모드) 열림 |  |
| 41 | 상조 DB ID 매핑 | `resolveSangjoDbId()` | constants 가짜 ID → 실제 DB UUID 변환 |  |
| 42 | 계약 저장 | `saveSangjoContract()` | `sangjo_contracts` 테이블에 `status: '상담신청'` 행 생성 |  |
| 43 | 계약번호 생성 | contract_number | `REQ-2026-XXXXXX` 또는 `URG-2026-XXXXXX` 형식 |  |
| 44 | 중복 제출 방지 | `isSubmitting` | 버튼 비활성화 |  |

### C-5. 상조 관리자 수신 확인
| # | 검증 항목 | 경로/컴포넌트 | 기대 결과 | Pass/Fail |
|---|----------|-------------|----------|-----------|
| 45 | 파트너 대시보드 수신 | `PartnerConsultationsTab.tsx` | 새 상담 목록에 표시 |  |
| 46 | source 구분 | `source === 'sangjo_contract'` | 시설 상담과 상조 상담 구분 표시 |  |
| 47 | 상태 변경 | 상담신청 → 예약대기 → 계약진행 → 완료 | 전체 상태 전환 정상 |  |
| 48 | 타임라인 기록 | `sangjo_contract_timeline` | 상태 변경 이력 저장 |  |

### C-6. 슈퍼관리자 모니터링
| # | 검증 항목 | 경로/컴포넌트 | 기대 결과 | Pass/Fail |
|---|----------|-------------|----------|-----------|
| 49 | 전체 계약 모니터링 | `ContractMonitoring.tsx` | 모든 상조 계약 목록 표시 |  |
| 50 | 긴급도 필터 | critical/urgent/normal | 필터 정상 동작 |  |
| 51 | 계약 상세 드로어 | `ContractDetailDrawer` | 계약 상세 정보 표시 |  |

---

## D. 크로스 플로우 검증 (연동 테스트)

| # | 검증 항목 | 시나리오 | 기대 결과 | Pass/Fail |
|---|----------|---------|----------|-----------|
| 52 | 유저 쿼터 → 시설 쿼터 순서 | 유저 쿼터 통과 + 시설 쿼터 실패 | 유저 쿼터만 소진, 적절한 에러 표시 |  |
| 53 | 로그아웃 상태 진입 | 비로그인 → AI 상담 시도 | 로그인 유도 또는 graceful 차단 |  |
| 54 | 월간 쿼터 리셋 | 월 초 첫 사용 | `get_user_plan_info()` lazy reset 동작 |  |
| 55 | 구독 변경 후 쿼터 | FREE→PREMIUM 전환 직후 | 새 한도 즉시 적용 |  |
| 56 | 동시 다중 상담 | 같은 유저가 2개 시설 동시 상담 | 각각 독립 상담 생성, 혼선 없음 |  |
| 57 | Realtime 연결 끊김 후 재접속 | 네트워크 일시 중단 | 재접속 후 누락 데이터 복구 |  |

---

## E. 에러/엣지 케이스

| # | 검증 항목 | 시나리오 | 기대 결과 | Pass/Fail |
|---|----------|---------|----------|-----------|
| 58 | Gemini API 타임아웃 | 응답 지연 30초+ | 타임아웃 메시지 표시, 재시도 가능 |  |
| 59 | 상조 ID 매핑 실패 | constants ID가 DB에 없음 | 에러 처리, 상담 저장 실패 안내 |  |
| 60 | RPC 쿼터 함수 에러 | `check_and_increment_user_quota` 실패 | ⚠️ 현재 fail-open (알려진 리스크) — 통과됨 확인 |  |
| 61 | 빈 facility_faqs | FAQ 0건인 시설 | FAQ 칩 미표시, 채팅은 정상 |  |
| 62 | 긴 메시지 입력 | 5000자+ 메시지 | 적절한 길이 제한 또는 정상 처리 |  |

---

## 🚀 테스트 실행 순서

### Phase 1: 코드 레벨 정적 검증 (자동)
1. `npm run verify` (tsc + lint + build)
2. 상담 관련 import/export 의존성 체크
3. 쿼터 RPC 함수 존재 확인 (Supabase SQL Editor)

### Phase 2: 단일 흐름 검증 (수동, 브라우저)
1. **A 흐름**: 일반 유저로 시설 AI 상담 → 폼 제출 → DB 확인
2. **B 흐름**: 시설별 AI 상담 → 토픽 선택 → 대화 → DB 확인
3. **C 흐름**: 상조 비교 → 칩 선택 → 추천 → 브랜드 채팅 → 상담 신청 → DB 확인

### Phase 3: 관리자 수신 검증 (수동, 별도 브라우저/시크릿)
1. 시설 관리자 계정 로그인 → 대시보드에서 A/B 흐름 상담 확인
2. 상조 파트너 계정 로그인 → 대시보드에서 C 흐름 상담 확인
3. 슈퍼관리자 계정 → 계약 모니터링 확인

### Phase 4: 상태 전환 E2E
1. 관리자: 접수 → 유저 상태 반영 확인
2. 관리자: 완료 처리 → 유저 측 완료 표시 확인
3. 상조: 상담신청 → 예약대기 → 계약진행 → 완료 전체 흐름

### Phase 5: 크로스/엣지 검증
1. D 섹션 52~57번 항목
2. E 섹션 58~62번 항목

---

## 📊 DB 검증 쿼리 (Phase 1에서 실행)

```sql
-- 1. 쿼터 RPC 존재 확인
SELECT proname FROM pg_proc WHERE proname IN (
  'check_and_increment_user_quota',
  'check_and_increment_facility_quota',
  'decrement_user_favorites_count',
  'get_user_plan_info'
);

-- 2. consultations 테이블 구조
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'consultations' ORDER BY ordinal_position;

-- 3. sangjo_contracts 테이블 구조
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'sangjo_contracts' ORDER BY ordinal_position;

-- 4. Realtime 활성화 확인
SELECT * FROM supabase_realtime.subscription;

-- 5. 최근 상담 데이터 샘플
SELECT id, facility_id, status, created_at
FROM consultations ORDER BY created_at DESC LIMIT 5;

-- 6. 최근 상조 계약 샘플
SELECT id, sangjo_id, status, application_type, created_at
FROM sangjo_contracts ORDER BY created_at DESC LIMIT 5;
```

---

## ⚠️ 알려진 리스크 (테스트 시 특별 주의)

| 리스크 | 위치 | 영향 | 우선도 |
|--------|------|------|--------|
| Fail-open 쿼터 | `useQuotaGate.ts`, `ChatInterface.tsx`, `SangjoConsultationModal.tsx` | RPC 에러 시 쿼터 무시하고 통과 | HIGH |
| 유저 쿼터 → 시설 쿼터 순서 | `ChatInterface.tsx:322→345` | 시설 쿼터 실패해도 유저 쿼터 이미 소진 | MEDIUM |
| 상담 생성 실패 시 쿼터 미롤백 | `ConsultationView.tsx:80→95` | 쿼터만 소진되고 상담은 미생성 | MEDIUM |
| 대소문자 plan_name 불일치 | `PERSONAL_FREE` vs `personal_free` | 무료 플랜 감지 실패 가능 | LOW |
| 상조 즐겨찾기 UpgradePrompt 미연결 | `SangjoCompanyList.tsx` | quotaExceeded 상태만 있고 UI 없음 | LOW |
