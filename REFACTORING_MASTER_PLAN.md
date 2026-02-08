# 종합 리팩토링 및 안정화 계획 (Comprehensive Refactoring Plan)

## 📌 개요
**"전체 다 고치기"**를 위한 마스터 플랜입니다. 현재 발견된 **8개의 치명적(Critical)** 이슈와 **16개의 중요(Major)** 이슈를 체계적으로 해결하여, **엔터프라이즈급 안정성**을 확보하는 것을 목표로 합니다.

## 🥅 목표 (Goal)
1. **Runtime Stability**: 타입 불일치로 인한 앱 크래시 원청 봉쇄 (Type Safety 100%)
2. **Security Hardening**: SQL Injection, XSS, Mock 데이터 노출 등 보안 구멍 제거
3. **Data Integrity**: DB와 UI 간 데이터 불일치 및 중복 정의 제거

## 🚧 작업 단계 (Phases)

### Phase 1: 기반 다지기 (치명적 오류 해결) - 🚨 최우선
**목표**: 앱이 "절대 죽지 않는" 상태 만들기

1. **타입 정의 통합 (Type Unification)**
   - `types/index.ts`와 `types/db.ts`의 `Reservation`, `Favorite`, `User` 타입 충돌 해결.
   - 단일 진실 공급원(Single Source of Truth) 원칙 적용.
   - *대상 파일*: `types/index.ts`, `types/db.ts`, `types/favorites.ts`

2. **데이터 정합성 복구 (Dashboard Fixes)**
   - 슈퍼관리자: 존재하지 않는 `consultation_leads` 테이블 참조 로직을 `consultations`로 정상화.
   - 시설관리자: `Reservation` 타입 매핑 오류 수정.

3. **보안 구멍 막기 (Security Hardening)**
   - **RLS 정책 강화 (Security Hardening Plan 반영)**
     - `profiles`: Clerk ID와 Supabase Auth ID(sub/uid) 호환 정책 적용.
     - `partner_conversations`, `partner_inquiries`: 본인 데이터만 INSERT 가능하도록 통제.
     - `subscription_payments`: Service Role 또는 소유자만 INSERT 가능.
     - `public` 스키마 내 PostGIS 시스템 테이블(spatial_ref_sys) RLS 예외 처리 또는 활성화.
     - `backup` 스키마 권한 박탈 (Lockdown).
   - **Mock Logic 제거**: `userId.startsWith('mock-')` 로직을 환경 변수(`VITE_USE_MOCK`) 기반으로 분리.
   - **SQL Injection 방지**: `ilike` 검색 쿼리 검증 로직 추가.
   - **XSS 방지**: 채팅 및 공지사항 입력값에 `DOMPurify` 적용.

### Phase 2: 로직 강화 (중요 오류 해결)
**목표**: 사용자 경험(UX)을 해치는 버그 및 예외 상황 처리

1. **에러 핸들링 표준화 (Error Handling)**
   - 모든 비동기 요청(Async/Await)에 `try-catch` 적용.
   - 사용자에게 `alert()` 대신 `toast`로 부드러운 피드백 제공.
   - *대상*: `MyPageView.tsx`, `FacilityAdminView.tsx`, `favoriteService.ts`

2. **Supabase Client 최적화**
   - `createAuthenticatedClient` 중복 생성 방지 (싱글톤 패턴 확립).
   - Realtime Subscription 메모리 누수 방지 (Cleanup 함수 검증).

3. **데이터 병합 로직 개선 (Consultations)**
   - Legacy 상담 내역과 AI 상담 내역 병합 시 `any` 타입 제거 및 명시적 매퍼 함수(`mapAiToLegacy`) 구현.

### Phase 3: 코드 품질 향상 (마이너 이슈)
**목표**: 유지보수하기 좋은 깔끔한 코드

1. **Any 타입 제거**: `noImplicitAny` 준수를 목표로 주요 컴포넌트의 `any` 제거.
2. **코드 정리**: 사용하지 않는 import, 주석, `console.log` 정리.
3. **컴포넌트 분리**: `MyPageView` 등 거대 컴포넌트를 기능별로 분할.

---

## 📅 예상 일정 (Timeline)
- **Phase 1 (Critical)**: 1~2일 (즉시 시작 권장)
- **Phase 2 (Major)**: 2~3일
- **Phase 3 (Minor)**: 1~2일 / 출시 후 진행 가능
