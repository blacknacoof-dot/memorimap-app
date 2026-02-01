# Plan: Integrated Governance (통합 거버넌스)

## 목적
파편화된 AI 상담 데이터와 관리 시스템을 하나로 통합하여 출시 가능한 수준의 데이터 정합성과 운영 안정성을 확보함.

## 목표 (KPI)
- 모든 신규 AI 상담 데이터를 `ai_consultations` 테이블로 100% 통합.
- AI 상담 상태 관리 로직의 서비스 레이어 단일화.
- 어드민 대시보드 내 실시간 AI 관제 기능(이벤트 기반) 구현.

## 주요 마일스톤
1.  **AI 상담 데이터 쓰기 단일화:** `ScenarioBot` 수정 및 `aiConsultationService` 구축.
2.  **스키마 및 Enum 동결:** `ConsultationStatus` 적용 및 `upsert` 로직을 통한 세션 복구 강화.
3.  **실시간 모니터링 구축:** Supabase Realtime 이벤트를 이용한 어드민 알림 연동.

## 리스크 관리
- 기존 `partner_conversations` 데이터와의 호환성 (Read-only로 유지하며 전환).
- AI 응답 지연 및 세션 유실 방지.
