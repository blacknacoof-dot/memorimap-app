# Phase 4: App.tsx 구조 개선 계획

> 작성일: 2026-02-10  
> 현재 상태: App.tsx **1,962줄** → 목표: **~400줄 이하**

---

## 1. 현재 문제 분석

### App.tsx 구조 맵 (1,962줄)

| 구간 | 줄 범위 | 줄 수 | 내용 | 분류 |
|------|---------|-------|------|------|
| Imports | 1–60 | 60 | 52개 import, 17개 lazy load | 과도함 |
| Constants | 61–80 | 20 | `REGION_COORDINATES` | 추출 가능 |
| State 선언 | 92–175 | 83 | **~40개 useState** | 분산 필요 |
| Effects & Auth | 190–325 | 135 | Session sync, role fetch | Hook 추출 |
| fetchFacilities | 328–540 | **213** | 시설 데이터 로드, 이미지 로직, 타입 정규화 | 🔴 최우선 추출 |
| filteredFacilities | 550–583 | 33 | 필터 + 검색 + bounds | Hook 추출 |
| Handlers | 585–1000 | 415 | 로그인, 리뷰, 시설 선택, 상조 등 | 분산 필요 |
| handleMapBoundsChange | 1005–1071 | **66** | 서버 뷰포트 fetch, 타입 정규화 **중복** | 🔴 추출 |
| renderContent | 1073–1405 | **332** | view별 렌더링 switch | 컴포넌트 분리 |
| JSX (Main Layout) | 1406–1959 | **554** | 모달, 라우팅, 네비게이션 바 | 컴포넌트 분리 |

### 핵심 문제 3가지

1. **타입 정규화 로직 3벌 중복** — `fetchFacilities`, `fetchFacilityDetails`, `handleMapBoundsChange`에 동일한 category 변환 코드가 각각 존재
2. **이미지 기본값 로직 2벌 중복** — `fetchFacilities`와 `fetchFacilityDetails`에 동일한 `defaultImageMap` + `isBadUrl` 로직
3. **God Component** — 40개 state, 13개 handler, 6개 effect가 하나의 컴포넌트에 집중

---

## 2. 리팩토링 전략

### 원칙

> [!IMPORTANT]
> **"한 번에 하나씩, 테스트하며 진행"** — 대규모 리팩토링이 아닌 점진적 추출 방식

```
Phase 4-1: 유틸리티 & 상수 추출 (안전, 기능 변경 없음)
Phase 4-2: 데이터 Hook 추출 (fetchFacilities → useFacilityData)
Phase 4-3: 핸들러 Hook 추출 (reviews, company select)
Phase 4-4: 컴포넌트 분리 (renderContent → 개별 뷰)
Phase 4-5: 레이아웃 분리 (모달, 네비게이션 바)
```

---

## 3. Phase 4-1: 유틸리티 & 상수 추출

> 예상 시간: 30분 | 위험도: ⭐ (매우 낮음)

### 3-1. 타입 정규화 유틸리티

**생성할 파일:** `utils/facilityNormalizer.ts`

```typescript
// 중복 3벌 → 단일 함수로 통합
export function normalizeCategory(rawType: string): { type: string; category: string } { ... }
export function isBadUrl(url: string): boolean { ... }
export function getDefaultImage(type: string, id: string): string { ... }
export const DEFAULT_IMAGE_MAP: Record<string, string[]> = { ... };
```

**적용 대상:** 
- `App.tsx L328-540` (fetchFacilities)
- `App.tsx L602-768` (fetchFacilityDetails)  
- `App.tsx L1028-1066` (handleMapBoundsChange)

### 3-2. 상수 추출

**생성할 파일:** `constants/regions.ts`

```typescript
export const REGION_COORDINATES: Record<string, { center: [number, number], zoom: number }> = {
  '서울': { center: [37.5665, 126.9780], zoom: 11 },
  // ... App.tsx L62-80에서 이동
};
```

### 3-3. 체크리스트

- [ ] `utils/facilityNormalizer.ts` 생성
- [ ] `constants/regions.ts` 생성
- [ ] App.tsx에서 import 교체 및 중복 코드 제거
- [ ] `npx tsc --noEmit` 빌드 검증
- [ ] 개발 서버 동작 확인

---

## 4. Phase 4-2: 데이터 Hook 추출

> 예상 시간: 1시간 | 위험도: ⭐⭐⭐ (중간)

### 4-2a. `useFacilityData` Hook

**생성할 파일:** `hooks/useFacilityData.ts`

| 추출 대상 | 현재 위치 | 줄 수 |
|-----------|-----------|-------|
| `facilities` state | L98 | 1 |
| `selectedFacility` state | L99 | 1 |
| `isDataLoading` state | L107 | 1 |
| `fetchFacilities` effect | L328–540 | 213 |
| `fetchFacilityDetails` | L602–768 | 166 |
| `filteredFacilities` useMemo | L550–583 | 33 |
| `handleFacilitySelect` | L770–778 | 8 |

**반환값:**
```typescript
{
  facilities, setFacilities,
  selectedFacility, setSelectedFacility,
  filteredFacilities,
  isDataLoading,
  fetchFacilityDetails,
  handleFacilitySelect
}
```

### 4-2b. `useMapViewport` Hook

**생성할 파일:** `hooks/useMapViewport.ts`

| 추출 대상 | 현재 위치 | 줄 수 |
|-----------|-----------|-------|
| `mapBounds`, `currentBounds` state | L101, L153 | 2 |
| `targetMapCenter`, `targetMapZoom` state | L154-155 | 2 |
| `handleBoundsChange` | L585-587 | 3 |
| `handleMapBoundsChange` | L1005-1071 | 66 |
| `handleViewOnMap` | L780-788 | 8 |
| `mapDebounceRef` | L1003 | 1 |

**반환값:**
```typescript
{
  mapBounds, currentBounds,
  targetMapCenter, targetMapZoom,
  handleBoundsChange,
  handleMapBoundsChange,
  handleViewOnMap
}
```

### 체크리스트

- [ ] `hooks/useFacilityData.ts` 생성
- [ ] `hooks/useMapViewport.ts` 생성
- [ ] App.tsx에서 호출 교체
- [ ] 빌드 검증 + 기능 테스트

---

## 5. Phase 4-3: 핸들러 Hook 추출

> 예상 시간: 45분 | 위험도: ⭐⭐ (낮음)

### 5-1. `useReviews` Hook

**생성할 파일:** `hooks/useReviews.ts`

| 추출 대상 | 줄 수 |
|-----------|-------|
| `handleAddReview` (L791-822) | 31 |
| `handleReviewDeleted` (L824-857) | 33 |

### 5-2. `useCompanySelect` Hook

**생성할 파일:** `hooks/useCompanySelect.ts`

| 추출 대상 | 줄 수 |
|-----------|-------|
| `handleCompanySelect` (L860~) | ~100 |
| `selectedFuneralCompany` state | 1 |
| `showSangjoAIConsult`, `showSangjoContract` state | 2 |

### 5-3. `useUserRole` Hook

**생성할 파일:** `hooks/useUserRole.ts`

| 추출 대상 | 줄 수 |
|-----------|-------|
| `userRole`, `roleError`, `isLoadingRole` state | 3 |
| `fetchUserRole` (L277-322) | 45 |
| `adminFacilityId`, `adminSangjoId`, `sangjoOrgType` state | 3 |

### 체크리스트

- [ ] `hooks/useReviews.ts` 생성
- [ ] `hooks/useCompanySelect.ts` 생성
- [ ] `hooks/useUserRole.ts` 생성
- [ ] App.tsx에서 호출 교체
- [ ] 빌드 검증

---

## 6. Phase 4-4: 컴포넌트 분리

> 예상 시간: 1시간 | 위험도: ⭐⭐⭐ (중간)

### 6-1. `renderContent` 분리 (332줄)

현재 `renderContent()`의 switch-case를 개별 컴포넌트로 분리:

| ViewState | 분리할 컴포넌트 | 예상 줄 수 |
|-----------|----------------|-----------|
| `MAP` | `views/MapView.tsx` | ~60 |
| `LIST` | `views/ListView.tsx` | ~30 |
| `ADMIN` | `views/AdminViewWrapper.tsx` | ~40 |
| `MY_PAGE` | `views/MyPageViewWrapper.tsx` | ~50 |
| `FACILITY_ADMIN` | `views/FacilityAdminWrapper.tsx` | ~30 |
| 기타 | `views/ContentRouter.tsx` | ~50 |

### 체크리스트

- [ ] `views/` 디렉토리 생성
- [ ] ViewState별 컴포넌트 분리
- [ ] App.tsx의 `renderContent()` → `<ContentRouter>` 교체
- [ ] 빌드 검증

---

## 7. Phase 4-5: 레이아웃 분리

> 예상 시간: 45분 | 위험도: ⭐⭐ (낮음)

### 분리 대상

| 컴포넌트 | 현재 위치 | 내용 |
|----------|-----------|------|
| `AppShell.tsx` | L1406-1959 JSX | 상단 헤더, 하단 네비게이션, 모달 컨테이너 |
| `BottomNav.tsx` | JSX 하단 | 하단 탭 네비게이션 바 |
| `ModalContainer.tsx` | JSX 전체 | 로그인, 예약, 비교, 시트 등 모달 모음 |

### 최종 App.tsx 목표 구조

```tsx
const App: React.FC = () => {
  useAuthSync();
  
  const { facilities, selectedFacility, ... } = useFacilityData();
  const { handleMapBoundsChange, ... } = useMapViewport();
  const { userRole, ... } = useUserRole();
  const { handleAddReview, handleReviewDeleted } = useReviews();
  // ... 기존 hooks: useToast, useComparison, useReservations

  return (
    <AppShell>
      <ContentRouter viewState={viewState} ... />
      <BottomNav viewState={viewState} onChange={setViewState} />
      <ModalContainer ... />
    </AppShell>
  );
};
```

---

## 8. 실행 순서 & 예상 일정

| 단계 | 예상 시간 | 위험도 | 의존성 |
|------|----------|--------|--------|
| **4-1** 유틸리티 추출 | 30분 | ⭐ | 없음 |
| **4-2** 데이터 Hook | 1시간 | ⭐⭐⭐ | 4-1 필요 |
| **4-3** 핸들러 Hook | 45분 | ⭐⭐ | 4-2 필요 |
| **4-4** 컴포넌트 분리 | 1시간 | ⭐⭐⭐ | 4-2, 4-3 필요 |
| **4-5** 레이아웃 분리 | 45분 | ⭐⭐ | 4-4 필요 |
| **총 합계** | **~4시간** | | |

---

## 9. 검증 계획

각 단계별:

1. **`npx tsc --noEmit`** — TypeScript 빌드 에러 0건
2. **개발 서버 확인** — `npm run dev`로 기존 기능 정상 동작
3. **브라우저 테스트** — 지도, 시설 선택, 상담 플로우 확인
4. **줄 수 측정** — App.tsx 줄 수 감소 확인

### 최종 목표 지표

| 지표 | Before | After |
|------|--------|-------|
| App.tsx 줄 수 | 1,962 | < 400 |
| state 변수 수 | ~40 | < 10 |
| 중복 정규화 로직 | 3벌 | 1벌 |
| 중복 이미지 로직 | 2벌 | 1벌 |
| 새 파일 수 | 0 | ~10 |

---

## 10. 롤백 계획

> [!WARNING]
> 각 단계 시작 전 반드시 Git 커밋으로 체크포인트 생성

```bash
git add -A && git commit -m "Phase 4-X 시작 전 체크포인트"
```

문제 발생 시:
```bash
git reset --hard HEAD~1
```

---

## 11. 새로 생성할 파일 목록

```
hooks/
  ├── useFacilityData.ts    [NEW]
  ├── useMapViewport.ts     [NEW]
  ├── useReviews.ts         [NEW]
  ├── useCompanySelect.ts   [NEW]
  └── useUserRole.ts        [NEW]

utils/
  └── facilityNormalizer.ts [NEW]

constants/
  └── regions.ts            [NEW]

views/                      [NEW DIR]
  ├── ContentRouter.tsx     [NEW]
  └── MapView.tsx           [NEW]

components/
  ├── AppShell.tsx          [NEW]
  ├── BottomNav.tsx         [NEW]
  └── ModalContainer.tsx    [NEW]
```
