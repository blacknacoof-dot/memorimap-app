# Design: Integrated Governance (통합 거버넌스)

## 데이터 모델 (Schema)

### `ai_consultations` 테이블 고도화
| 필드명 | 타입 | 설명 |
|--------|------|------|
| id | uuid | Primary Key |
| conversation_id | text | 세션 복구용 식별자 (Clerk ID + Facility ID 조합 등) |
| facility_id | uuid | 상담 대상 시설 (FK: facilities.id) |
| status | text | ConsultationStatus Enum |
| category | text | funeral, pet, memorial, general |
| messages | jsonb | 상담 메시지 리스트 |
| metadata | jsonb | 카테고리별 특화 데이터 |
| created_at | timestamptz | 생성일 |
| updated_at | timestamptz | 수정일 |

## 비즈니스 로직 (Service Layer)

### `aiConsultationService.ts`
- `startConsultation(params)`: 세션 복구 또는 신규 생성 (`upsert` 로직 포함)
- `updateStatus(id, status)`: 상태 변경 및 `STATUS_CHANGED` 이벤트 발송
- `appendMessage(id, message)`: 메시지 추가 (`MESSAGE_APPENDED` 이벤트 발송)
- `requestAgent(id)`: 전문가 인계 요청 (`AGENT_REQUESTED` 이벤트 발송)

## 실시간 이벤트 (Realtime Events)
- 채널: `realtime:public:ai_consultations`
- 이벤트명:
  - `STATUS_CHANGED`: 상태 변화 시 발송
  - `AGENT_REQUESTED`: 긴급 인계 요청 시 발송

## UI/UX 설계
- **ScenarioBot:** 서비스 레이어를 통해 데이터 입출력 수행.
- **Admin Dashboard:** Realtime 이벤트를 구독하여 AI 관제 실시간 반영.
