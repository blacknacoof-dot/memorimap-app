# 구현 계획: 마이페이지 V2 & 찜 목록 (My Page V2)

> **날짜**: 2026-02-02
> **기능**: 마이페이지 V2 (찜 목록 + 여정 기록 + 엔딩 노트 + AI 인사이트)
> **상태**: 📝 계획 수립 (Planning)

## 목표
찜 목록, 여정 기록, 엔딩 노트 기능을 통합하고, 사용자의 활동을 분석하여 맞춤형 메시지를 제공하는 "마이페이지 V2"를 구현합니다.

## 사용자 검토 필요 (중요)
> [!IMPORTANT]
> **데이터베이스 스키마 및 RPC**: Supabase CLI 접근 권한 문제로 인해, 아래 SQL 스크립트를 **Supabase SQL Editor에서 직접 실행**해야 합니다.
> 스크립트는 `migrations/` 폴더에 준비되어 있습니다.

## 변경 제안 내용

### 데이터베이스 (수동 실행 필요)
#### [NEW] `migrations/20260202_add_favorites_and_ending_note.sql`
- **테이블**: `user_favorites` (찜 목록), `user_ending_note` (엔딩 노트)
- **트리거**: 찜 추가 시 `user_journey_events` (여정 기록) 테이블에 자동 이벤트 생성

#### [NEW] `migrations/20260202_add_favorites_rpc.sql`
- **RPC 함수**:
  - `get_my_favorites`: 찜 목록 조회 (시설 정보 포함)
  - `toggle_favorite`: 찜 추가/수정 (메모 포함)
  - `upsert_ending_note`: 엔딩 노트 저장/수정
  - `analyze_favorite_patterns`: 찜 패턴 분석 (통계 데이터 반환)

### 프론트엔드 로직
#### [NEW] [favorites.ts](file:///c:/Users/black/Desktop/memorimap/types/favorites.ts)
- **인터페이스**: `UserFavorite`, `EndingNote`, `FavoriteAnalysis`

#### [NEW] [useFavorites.ts](file:///c:/Users/black/Desktop/memorimap/hooks/useFavorites.ts)
- **훅 (Hooks)**: `useMyFavorites`, `useToggleFavorite`, `useMyEndingNote`, `useFavoriteAnalysis`
- `tanstack-query`와 `supabase-js`를 사용하여 데이터 연동

#### [NEW] [generateJourneyInsight.ts](file:///c:/Users/black/Desktop/memorimap/lib/generateJourneyInsight.ts)
- **함수**: `generateRuleBasedInsight`
- **목적**: DB에서 가져온 통계 데이터를 기반으로 **규칙 기반(Rule-based)**의 "AI 분석 스타일" 메시지 생성 (실제 AI 호출 아님, 비용 절감 및 속도 향상)
  - 예: "자연친화적인 수목장을 선호하시네요."

### 프론트엔드 UI
#### [NEW] [MyPageV2.tsx](file:///c:/Users/black/Desktop/memorimap/components/MyPageV2.tsx)
- **섹션 구성**:
  1. **AI 인사이트 카드**: 상단 배너
  2. **여정 기록 (Timeline)**: 수직 타임라인 (진행률 게이지 포함)
  3. **찜한 목록**: 격자/리스트 뷰
  4. **엔딩 노트**: 요약 보기 및 편집 모달
- **특징**: 탭 네비게이션, 반응형 디자인

#### [NEW] [AdminUserDetailPage.tsx](file:///c:/Users/black/Desktop/memorimap/components/AdminUserDetailPage.tsx)
- **관리자 기능**: 특정 사용자의 찜 목록 및 엔딩 노트 조회

## 검증 계획

### 수동 검증 절차
1.  **데이터베이스 설정**:
    - `migrations/20260202_add_favorites_and_ending_note.sql` 실행 (테이블 생성)
    - `migrations/20260202_add_favorites_rpc.sql` 실행 (함수 생성)
2.  **프론트엔드 확인**:
    - `/mypage` 경로 접속
    - **찜 기능**: 시설 목록에서 '하트' 클릭 -> 마이페이지 리스트 및 DB 확인
    - **여정 기록**: 찜 추가 시 타임라인에 "XX을(를) 찜했습니다" 로그 자동 생성 확인
    - **엔딩 노트**: 내용 작성 -> 저장 -> 새로고침 후 유지 확인
    - **AI 인사이트**: 찜한 시설 카테고리에 맞춰 "XX을 선호하시네요" 메시지 표시 확인
