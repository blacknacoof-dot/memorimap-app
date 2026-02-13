# 스마트 검색창 구축 작업 계획 (Implementation Plan)

기존 지도의 지역 검색창을 고도화하여 사용자 의도(지역, 긴급도)를 파악하고 맞춤형 액션을 제안하는 '스마트 검색창'을 구축합니다.

## Proposed Changes

### 1. [NEW] `src/components/AI/SmartSearchInput.tsx`
- **기능**:
    - 사용자 입력 실시간 감시 및 키워드 추출 (Regex/단어 매칭).
    - '지역' (예: 분당, 서울) + '급해요/긴급' 키워드 동시 감지.
    - **드롭다운 UI 구현**: 입력창 하단에 부유(Floating)하는 3가지 제안 옵션 표시.
- **키워드 탐지 로직**:
    - `region`: 입력 문자열에서 행정 구역명 패턴 추출.
    - `isUrgent`: "급해요", "긴급", "빨리", "도와주세요" 등 키워드 매칭.
- **드롭다운 액션**:
    - **🚨 긴급**: `urgency=immediate` 플래그와 함께 상담 페이지 또는 모달 연결.
    - **🏥 검색**: 해당 지역의 '장례식장' 카테고리 필터링된 목록 뷰.
    - **🗺️ 지도**: 해당 지역 주변의 '추모시설' 카테고리 필터링된 지도 뷰.

### 2. [MODIFY] `src/components/FilterBar.tsx`
- `onAction` prop을 추가로 정의하고 `<SmartSearchInput>`에 전달합니다.

### 3. [MODIFY] `src/components/TopBar.tsx`
- `FilterBar`에 전달할 `onAction` prop을 `App.tsx`로부터 전달받도록 수정합니다.

### 4. [MODIFY] `src/App.tsx`
- `handleSmartSearchAction` 함수를 구현하여 `TopBar`에 전달합니다.
- **로직**:
    - `urgent`: '마음이 AI' 통합 상담 모달을 열고 `urgency='immediate'` 컨텍스트를 주입합니다.
    - `search`: 검색어 필터를 적용하고 '장례식장' 목록 뷰(`ViewState.LIST`)로 전환합니다.
    - `map`: 검색어 필터를 적용하고 지도 뷰(`ViewState.MAP`)로 전환합니다.

## Verification Plan

### Automated Tests
- **New Playwright Test**: `tests/e2e/smartSearch.spec.ts`를 생성하여 다음 시나리오 검증:
    - `await page.goto('/')`
    - `await page.fill('#search-input', '분당 장례식장 급해요')`
    - `await expect(page.locator('text=🚨 긴급')).toBeVisible()`
    - `await expect(page.locator('text=🏥 검색')).toBeVisible()`
    - `await expect(page.locator('text=🗺️ 지도')).toBeVisible()`
- **명령어**: `npx playwright test tests/e2e/smartSearch.spec.ts`

### Manual Verification
1.  **입력 테스트**: 검색창에 "강남" 입력.
    - 드롭다운에 "[🏥 검색] '강남' 장례식장 목록 보기"가 나타나는지 확인.
2.  **긴급 키워드**: "강남 급해요" 입력.
    - 드롭다운 최상단에 "[🚨 긴급] 강남 지역 장례 상담"이 나타나는지 확인.
3.  **UI 클릭**: "목록 보기" 클릭 시 실제 리스트 화면으로 전환되는지 확인.
4.  **반응형**: 모바일 화면(390px 너비)에서 드롭다운이 잘리지 않고 표시되는지 확인.
