# AI 상담 → 예약/문의 → 시설 전달 흐름 검증 보고서

**작성일**: 2026-03-28
**검증 대상**: 개인 사용자 → 시설 카테고리별 AI 상담 → 예약/문의 연결 → AI마음이 전달

---

## 1. 아키텍처 요약

### 1.1 AI 상담 진입 경로 (2개)

| # | 경로 | 컴포넌트 | 진입 트리거 | DB 테이블 |
|---|------|----------|------------|-----------|
| A | **시설 AI 상담** (주경로) | `ChatInterface.tsx` | FacilitySheet "AI 상담" 버튼 → ModalContainer | `leads`, `reservations`, `consultations` |
| B | **통합 마음이** (글로벌) | `ChatInterface.tsx` (id='maum-i') | TopBar 긴급 버튼 → useChatStore → ModalContainer | `leads`, `reservations` |
| C | **시설 시나리오봇** | `ScenarioBot.tsx` | ⚠️ **현재 미사용** (import만 존재, 렌더링 없음) | `ai_consultations` |
| D | **직접 상담** | `ConsultationView.tsx` | ContentRouter (ViewState.CONSULTING) | `consultations` |

### 1.2 DB 테이블 역할

| 테이블 | 역할 | 생성 경로 |
|--------|------|-----------|
| `leads` | AI 추천 후 리드 저장 / 긴급 폼 제출 | ChatInterface (RECOMMEND, URGENT_FORM) |
| `consultations` | 직접 상담 (비-AI) | ConsultationView, createConsultation, createFuneralConsultation |
| `ai_consultations` | AI 대화 세션 + 실시간 인계 | ScenarioBot → aiConsultationService (**현재 미사용**) |
| `reservations` | 예약 | createUrgentReservation (ChatInterface), useReservations hook |
| `partner_inquiries` | 파트너 문의/신청 | InquiryModal, PartnerInquiryView |

---

## 2. 카테고리별 흐름 분석

### 2.1 카테고리 매핑

```
ChatInterface.getAiCategory():
  funeral_home | 장례식장          → 'funeral_home'
  pet_funeral | 동물장례 | pet     → 'pet_funeral'
  나머지 (columbarium, cemetery,   → 'memorial_facility'
   natural_burial, sea_burial 등)
```

**쿼터 시스템**: `ai_consult_by_category` JSONB에 3개 카테고리별 독립 카운트
- `{ "funeral_home": 0, "memorial_facility": 0, "pet_funeral": 0 }`

### 2.2 카테고리별 테스트 시나리오

| # | 시나리오 | 카테고리 | 플랜 | 예상 결과 | 검증 포인트 |
|---|----------|----------|------|-----------|-------------|
| T1 | 장례식장 첫 상담 | funeral_home | FREE | ✅ 성공 | quota 1→1/1 |
| T2 | 장례식장 2회차 | funeral_home | FREE | ❌ 차단 | UpgradePrompt 표시 |
| T3 | 추모시설 첫 상담 | memorial_facility | FREE | ✅ 성공 | 별도 카운트 (T1과 무관) |
| T4 | 동물장례 첫 상담 | pet_funeral | FREE | ✅ 성공 | 별도 카운트 |
| T5 | 자연장 첫 상담 | memorial_facility | FREE | ⚠️ 조건부 | T3와 같은 버킷, T3 후 차단 |
| T6 | 장례식장 반복 | funeral_home | PREMIUM | ✅ 성공 | limit=-1 (무제한) |
| T7 | 추모시설 반복 | memorial_facility | PREMIUM | ✅ 성공 | limit=-1 |
| T8 | 상담 후 예약 전환 | any | any | ✅ 성공 | leads row 생성 확인 |
| T9 | 긴급 예약 | any | any | ✅ 성공 | leads + reservations 동시 생성 |
| T10 | AI마음이 전달 | any | any | ⚠️ 검증 필요 | 아래 이슈 참조 |

---

## 3. 프론트 흐름 (축 A) 검증

### 3.1 시설 상세 → AI 상담 진입

| 단계 | 코드 위치 | 동작 | 상태 |
|------|-----------|------|------|
| 시설 상세 오픈 | `FacilitySheet/index.tsx:231` | "AI 상담" 버튼 표시 | ✅ |
| 버튼 클릭 | `onOpenAiChat()` → ModalContainer | `setAiChatFacility(facility)` | ✅ |
| ChatInterface 렌더 | `ModalContainer.tsx:396` | facility, initialIntent 전달 | ✅ |
| 카테고리 매핑 | `ChatInterface.tsx:299-307` | getAiCategory() 호출 | ✅ |
| 웰컴 메시지 | `ChatInterface.tsx:179-249` | 카테고리별 폼(A/B/C) 자동 트리거 | ✅ |

### 3.2 카테고리별 웰컴 폼 매핑

| facility.type | initialIntent | 폼 타입 | 설명 |
|---------------|---------------|---------|------|
| funeral_home, 장례식장 | funeral_home | SHOW_FORM_A | 장례 상담 폼 |
| columbarium, cemetery, natural_burial 등 | memorial_facility | SHOW_FORM_B | 추모시설 상담 폼 |
| pet_funeral, 동물장례 | pet_funeral | SHOW_FORM_C | 동물장례 상담 폼 |

### 3.3 쿼터 체크 타이밍

| 순서 | 코드 위치 | 동작 | 실패 시 |
|------|-----------|------|---------|
| 1 | `ChatInterface.tsx:319-342` | 첫 메시지 전 `check_and_increment_user_quota('ai_consult', category)` | toast + return (전송 중단) |
| 2 | `ChatInterface.tsx:345-368` | 첫 메시지 전 `check_and_increment_facility_quota(facility.id, 'ai_chat')` | toast + return |
| 3 | 메시지 전송 | Gemini API 호출 + 응답 | - |

### 3.4 예약/문의 전환 CTA

| 경로 | 코드 위치 | 동작 | DB |
|------|-----------|------|----|
| RECOMMEND → 예약 | `ChatInterface.tsx:633-646` | `createConsultationFromLead(leadId, facilityId)` → RPC | leads → consultations |
| 긴급 예약 확정 | `ChatInterface.tsx:547-557` | `createUrgentReservation()` | leads + reservations |
| 폼 제출 (상담/긴급) | `ChatInterface.tsx:685-725` | `createLead()` | leads |
| 직접 상담 | `ConsultationView.tsx:94-103` | `createConsultation()` | consultations |

---

## 4. DB 저장 (축 B) 검증

### 4.1 저장 경로 매트릭스

| 사용자 액션 | 저장 테이블 | 핵심 필드 | auth 필수 |
|-------------|------------|-----------|-----------|
| 첫 메시지 전송 | (쿼터 증가만) | user_subscriptions.ai_consult_by_category | ✅ strict |
| AI 추천 결과 | `leads` | user_id, facility_id, category, urgency, context_data | ✅ strict |
| 추천 시설 예약 | `leads` → RPC → `consultations` | lead_id → facility_id 연결 | ✅ strict |
| 긴급 예약 | `leads` + `reservations` | 동시 2건 생성, status='confirmed' | ✅ strict |
| 상담 폼 제출 | `leads` | facility_id, category, source='ConsultationForm' | ✅ strict |
| 직접 상담 (ConsultationView) | `consultations` | facility_id, user_id, notes, status='pending' | ✅ strict |

### 4.2 category 필드값 차이 (⚠️ 불일치)

| 위치 | funeral_home → | memorial → | pet_funeral → |
|------|---------------|------------|---------------|
| 쿼터 RPC (p_category) | `'funeral_home'` | `'memorial_facility'` | `'pet_funeral'` |
| leads.category (ChatInterface:496) | `'funeral'` | `'memorial'` | `'funeral'` (⚠️) |
| leads.category (폼:690) | `'funeral'` | `'memorial'` | `'pet'` |

**⚠️ 이슈 F1**: `ChatInterface.tsx:496`에서 leads.category는 `searchData.category`에서 가져오는데, 이 값은 Gemini 응답의 파싱 결과. 쿼터의 `AiConsultCategory`와 leads의 category 값이 다른 네이밍 체계 사용.

### 4.3 검증 SQL

```sql
-- 1. 특정 유저의 쿼터 상태 확인
SELECT user_id, plan_name, ai_consult_by_category, ai_consult_used,
       sangjo_compare_used, last_reset_at, status
FROM user_subscriptions
WHERE user_id = '<clerk_user_id>';

-- 2. 특정 유저의 리드 확인
SELECT id, user_id, facility_id, category, urgency, status, created_at
FROM leads
WHERE user_id = '<clerk_user_id>'
ORDER BY created_at DESC;

-- 3. 특정 유저의 상담 확인
SELECT id, facility_id, user_id, status, notes, created_at
FROM consultations
WHERE user_id = '<clerk_user_id>'
ORDER BY created_at DESC;

-- 4. 특정 시설의 AI 상담 확인
SELECT id, conversation_id, user_id, facility_id, category, status, created_at
FROM ai_consultations
WHERE facility_id = '<facility_uuid>'
ORDER BY created_at DESC;

-- 5. 특정 시설의 예약 확인
SELECT id, facility_id, user_id, visitor_name, visit_date, status, created_at
FROM reservations
WHERE facility_id = '<facility_uuid>'
ORDER BY created_at DESC;

-- 6. 쿼터 한도 확인 (플랜별)
SELECT id, name_en, price,
       features->>'ai_consult_per_category' as ai_per_cat,
       features->>'sangjo_compare' as sangjo,
       features->>'favorites' as favs
FROM subscription_plans
WHERE name_en IN ('PERSONAL_FREE', 'PERSONAL_PREMIUM');
```

---

## 5. 시설측 연결 (축 C) 검증

### 5.1 시설 관리자 조회 경로

| 소스 | 컴포넌트 | 테이블 | 코드 위치 |
|------|----------|--------|-----------|
| 전통 상담 | `useFacilityAdmin.ts:65-66` | `consultations` | `.from('consultations').eq('facility_id', id)` |
| AI 상담 | `useFacilityAdmin.ts:73-77` | `ai_consultations` | `.from('ai_consultations').eq('facility_id', id)` |
| 예약 | Realtime `useFacilityAdmin.ts:132-164` | `reservations` | `.table: 'reservations', filter: facility_id=eq.${id}` |

### 5.2 실시간 전달 채널 (3개)

| 채널 | 테이블 | 이벤트 | 코드 위치 |
|------|--------|--------|-----------|
| `facility-cons-${id}` | consultations | INSERT, UPDATE | `useFacilityAdmin.ts:122-130` |
| `facility-res-${id}` | reservations | INSERT, UPDATE | `useFacilityAdmin.ts:132-164` |
| `facility-ai-cons-${id}` | ai_consultations | INSERT only | `useFacilityAdmin.ts:166-184` |

### 5.3 전달 누락 분석

| 사용자 액션 | DB 저장 | 시설측 조회 | ⚠️ 갭 |
|-------------|---------|------------|--------|
| AI 추천 리드 생성 | `leads` | ❌ **조회 안 됨** | leads 테이블을 시설 대시보드에서 직접 쿼리하지 않음 |
| RECOMMEND → 예약 전환 | `leads` → `consultations` (RPC) | ✅ consultations Realtime | RPC 성공 시 OK |
| 긴급 예약 | `leads` + `reservations` | ✅ reservations Realtime | OK |
| 상담 폼 제출 | `leads` | ❌ **조회 안 됨** | 폼 제출 결과가 시설에 직접 전달되지 않음 |
| 직접 상담 | `consultations` | ✅ consultations Realtime | OK |
| ScenarioBot AI | `ai_consultations` | ✅ ai_consultations Realtime | OK (단, ScenarioBot 미사용) |

**🔴 이슈 C1: `leads` 테이블 → 시설 대시보드 전달 갭**
- `createLead()`로 저장된 리드는 시설 관리자 대시보드에서 직접 조회하지 않음
- `FacilityAdminDashboard`는 `consultations`와 `ai_consultations`만 조회
- 리드가 `createConsultationFromLead` RPC로 전환되어야만 시설측에 보임
- 그러나 **폼 제출(line 685-725)은 리드만 생성하고 RPC 전환을 하지 않음**
- 결과: "접수 완료" 메시지는 보이지만, 시설측에서 해당 리드를 볼 수 없음

**🔴 이슈 C2: ScenarioBot 미사용으로 `ai_consultations` 실질적 미활용**
- `ScenarioBot.tsx`는 어디에서도 렌더링되지 않음 (import만 존재하는 파일 0개)
- `aiConsultationService`가 실제로 호출되는 경로 없음
- `ai_consultations` 테이블에 데이터가 쌓이지 않을 가능성 높음
- 시설 대시보드의 ai_consultations Realtime 구독은 사실상 빈 채널

---

## 6. Gating / Quota (축 D) 검증

### 6.1 쿼터 체크 흐름

```
ChatInterface.handleSend() [line 319]
  ↓ messages.length === 0 && !sessionQuotaCheckedRef.current
  ↓ getAuthClient(session, { strict: true })
  ↓ client.rpc('check_and_increment_user_quota', { p_quota_type: 'ai_consult', p_category: getAiCategory() })
  ↓ result.allowed === false → setQuotaExceeded(result) → UpgradePrompt 렌더
  ↓ result.allowed === true → sessionQuotaCheckedRef.current = true → 메시지 전송 진행
```

### 6.2 플랜별 한도

| 플랜 | ai_consult_per_category | 카테고리별 의미 |
|------|------------------------|----------------|
| PERSONAL_FREE | 1 | 장례식장 1회 + 추모시설 1회 + 동물장례 1회 = 총 3회/월 |
| PERSONAL_BASIC | 3 | 각 3회 = 총 9회/월 |
| PERSONAL_PREMIUM | -1 | 무제한 |

### 6.3 쿼터 관련 이슈

**⚠️ 이슈 D1: 시설 쿼터가 개인 상담을 막을 수 있음**
- `ChatInterface.tsx:345-368`: 사용자 쿼터 통과 후 **시설 쿼터도 체크**
- 시설이 FREE 플랜이거나 ai_chat 한도 초과 시, 개인 PREMIUM이라도 상담 불가
- 그러나 `check_and_increment_facility_quota`에서 facility_subscriptions 미존재 시 `{allowed: true}` 반환하므로, 대부분 시설에서는 통과

**⚠️ 이슈 D2: 사용자 쿼터 소모 후 시설 쿼터 실패 시 롤백 없음**
- Line 319-342: 사용자 쿼터 `increment` (소모됨)
- Line 345-368: 시설 쿼터 체크 실패 → return
- 사용자 쿼터는 이미 증가됨, 롤백 없음
- FREE 사용자(카테고리당 1회)에게 치명적: 쿼터만 소모되고 상담 불가

**✅ 이슈 D3 (CLAUDE.md 기록): Fail-open 동작 수정 완료**
- `useQuotaGate.ts:28-30`: RPC 에러 시 `throw error` (차단)
- `ChatInterface.tsx:326-329`: 에러 시 toast + return (차단)
- ✅ 현재 코드는 fail-close (에러 시 차단). CLAUDE.md의 "fail-open" 기록은 구버전 해당

**⚠️ 이슈 D4: 비로그인 사용자 처리**
- `ChatInterface.tsx:319`: `currentUser` 없으면 쿼터 체크 **스킵**
- 비로그인 사용자는 쿼터 체크 없이 AI 상담 가능
- 단, 메시지 전송은 가능하나 DB 저장(leads 등)은 실패할 수 있음

### 6.4 자연장/수목장/해양장 카테고리 처리

| facility.type | 쿼터 카테고리 | 이슈 |
|---------------|--------------|------|
| natural_burial | memorial_facility | 추모시설과 같은 버킷 |
| sea_burial | memorial_facility | 추모시설과 같은 버킷 |
| cemetery | memorial_facility | 추모시설과 같은 버킷 |
| columbarium | memorial_facility | 추모시설과 같은 버킷 |

→ FREE 사용자가 추모시설(columbarium)에서 1회 사용 후, 자연장(natural_burial) 시설에서 **같은 카테고리로 차단됨**. UX적으로 "다른 시설 유형인데 왜 막히지?"라는 혼란 가능.

---

## 7. 이슈 종합 및 판정

### 🔴 CRITICAL (시설 전달 누락)

| ID | 이슈 | 영향 | 수정 필요도 |
|----|------|------|------------|
| **C1** | `leads` 테이블 데이터가 시설 대시보드에 전달되지 않음 | 상담 폼 제출 후 시설이 리드를 볼 수 없음. "10분 내 연락" 약속 이행 불가 | **HIGH** |
| **C2** | ScenarioBot 미사용 → ai_consultations 미활용 | ai_consultations Realtime 채널 빈 가동. 시설측 AI 상담 인계 불가 | **MEDIUM** (현재 ChatInterface가 대체) |

### 🟡 HIGH (쿼터/데이터 정합성)

| ID | 이슈 | 영향 | 수정 필요도 |
|----|------|------|------------|
| **D2** | 사용자 쿼터 소모 후 시설 쿼터 실패 시 롤백 없음 | FREE 사용자 1회 기회 유실 | **HIGH** |
| **F1** | leads.category와 쿼터 category 네이밍 불일치 | 분석/통계 시 혼란 (기능에는 무영향) | **LOW** |

### 🟢 MEDIUM (UX/설계)

| ID | 이슈 | 영향 | 수정 필요도 |
|----|------|------|------------|
| **D1** | 시설 쿼터가 개인 상담을 차단 가능 | 시설 구독 없는 경우 자동 통과하므로 현실적 영향 낮음 | **LOW** |
| **D4** | 비로그인 사용자 쿼터 미체크 | 로그인 없이 AI 응답 가능하나, 리드 저장 시 인증 필요 | **MEDIUM** |
| **D5** | memorial_facility 버킷에 4개 시설 유형 합산 | FREE 사용자 혼란 가능 | **LOW** (설계 의도일 수 있음) |

---

## 8. 카테고리별 검증 표 (최종)

| 카테고리 | 시작 가능 | 응답 정상 | 저장 테이블 | 전달 테이블 | 예약 전환 | quota 동작 |
|----------|----------|----------|------------|------------|----------|-----------|
| 장례식장 (funeral_home) | ✅ | ✅ (Gemini) | leads | ⚠️ leads만 (consultations 전환 필요) | ✅ (RECOMMEND→RPC, 긴급→reservations) | ✅ per-category 1/FREE |
| 추모시설 (columbarium) | ✅ | ✅ | leads | ⚠️ 동일 | ✅ | ✅ memorial_facility 1/FREE |
| 동물장례 (pet_funeral) | ✅ | ✅ | leads | ⚠️ 동일 | ✅ | ✅ pet_funeral 1/FREE |
| 자연장 (natural_burial) | ✅ | ✅ | leads | ⚠️ 동일 | ✅ | ⚠️ memorial_facility와 합산 |
| 해양장 (sea_burial) | ✅ | ✅ | leads | ⚠️ 동일 | ✅ | ⚠️ memorial_facility와 합산 |
| 공원묘지 (cemetery) | ✅ | ✅ | leads | ⚠️ 동일 | ✅ | ⚠️ memorial_facility와 합산 |

### 전달 경로 상세

| 사용자 액션 | leads 생성 | consultations 전환 | 시설 Realtime | 시설 조회 |
|-------------|-----------|-------------------|--------------|----------|
| AI 추천 확인 | ✅ | ❌ (자동 전환 없음) | ❌ | ❌ |
| 추천 시설 "예약" 클릭 | (기존 lead 사용) | ✅ RPC | ✅ | ✅ |
| 긴급 예약 확정 | ✅ | ❌ | ✅ (reservations) | ✅ (reservations) |
| 상담 폼 제출 | ✅ | ❌ | ✅ (`leads` Realtime) | ✅ (`leads` 직접 조회) |
| 직접 상담 (ConsultationView) | ❌ | ✅ 직접 생성 | ✅ | ✅ |

---

## 9. 수정 우선순위 권장

### 2026-03-29 업데이트
- `C1` 1차 수정 완료: 시설 관리자 대시보드가 `leads`를 직접 조회하고, `source='lead'` 항목을 읽기 전용으로 표시하도록 반영
- `D2` 1차 완화 완료: `check_facility_quota_availability` RPC로 시설 가용성을 먼저 확인한 뒤 사용자 쿼터를 차감하도록 순서 조정
- 마이그레이션 배포 완료: `20260329_check_facility_quota_availability.sql`
- 검증 완료: `tsc --noEmit`, `npm run lint:errors`, `npm run build`
- 코드 커밋: `edb704c`

### P1: 비로그인 사용자 상담 시작 제한 (D4)
- `ChatInterface.tsx`에서 첫 메시지 전 `!currentUser` 시 로그인 모달 또는 인증 유도 흐름으로 차단

### P2: ScenarioBot / ai_consultations 실제 활용 정리 (C2)
- `ScenarioBot.tsx` 사용 여부를 확정하고, 유지 시 `ai_consultations` 쓰기 경로를 실제 운영 플로우에 연결
- 미사용 유지라면 시설 대시보드의 관련 표시/구독 정책도 함께 정리

### P2: memorial_facility 하위 카테고리 구분 (D5)
- 현재 설계로도 동작하나, UX 안내 강화 또는 카테고리 세분화 검토

### 후속 과제
- `D2` 최종 해결: 사용자/시설 쿼터를 단일 RPC 트랜잭션으로 통합해 원자성 보장

---

## 10. 판정 기준 대조

| 기준 | 판정 | 근거 |
|------|------|------|
| 개인이 각 카테고리 시설에서 AI 상담 시작 가능 | ✅ PASS | 3개 카테고리 모두 ChatInterface 진입 확인 |
| 상담 row 저장됨 | ⚠️ PARTIAL | leads 저장 O, consultations 자동 전환 조건부 |
| facility_id / category / user_id 정확 | ⚠️ PARTIAL | leads.category 네이밍 불일치 (F1), 기능은 정상 |
| 예약/문의 전환 시 후속 row 생성됨 | ✅ PASS | RECOMMEND→RPC, 긴급→reservations 확인 |
| 시설측 조회 경로에서 확인 가능 | ✅ PASS | 시설 대시보드에서 `leads` 직접 조회 및 Realtime 반영 |
| FREE 카테고리별 1회 제한 | ✅ PASS | per-category JSONB, 독립 카운트 확인 |
| PREMIUM 반복 가능 | ✅ PASS | limit=-1 (무제한) 확인 |

### 종합 판정: ✅ **조건부 통과 유지**
- AI 상담 시작 ~ 시설 가용성 확인 ~ 사용자 쿼터 차감 ~ 응답 ~ 리드 저장까지는 정상
- `C1`은 해결됨. 시설 대시보드에서 `leads`를 직접 확인 가능
- `D2`는 1차 완화됨. 사용자 선소모는 방지했지만, 최종적으로는 단일 RPC 트랜잭션 통합이 필요
- 잔여 주요 이슈는 `D4`, `C2`, `D5`
