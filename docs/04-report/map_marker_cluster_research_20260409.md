# Map Marker / Cluster Research Report

Date: 2026-04-09
Scope: Naver map marker rendering, cluster behavior, viewport refetch flow, selected marker persistence
Constraint: Research only. No code changes performed.

## 1. 핵심 Findings

- 지도 이동 후 이전 마커가 남아 있는 현상
  - 원인 후보: selected 마커 삭제 예외
  - 코드 근거: `components/MapContainer.tsx:331`
  - 상세: marker diff 제거 루프에서 `!newIds.has(id) && id !== selectedFacilityId` 조건을 사용하고 있어, 현재 viewport 결과에 없는 마커라도 선택된 마커는 제거되지 않음.

- 마커 클릭 후 숫자로 바뀐 것처럼 보이는 현상
  - 원인 후보: 개별 마커 숫자화가 아니라 cluster count 표기
  - 코드 근거: `utils/naverMapHelper.ts:30`, `components/MapContainer.tsx:439`
  - 상세: `getMarkerHtml`은 색상, 아이콘, 스케일만 바꾸며 숫자를 렌더하지 않음. 숫자는 cluster `stylingFunction`에서 `count`를 DOM 텍스트로 넣음.

- 특정 줌 레벨에서 마커가 안 보이는 현상
  - 원인 후보: 개별 마커 삭제보다 cluster 흡수 가능성 높음
  - 코드 근거: `components/MapContainer.tsx:425`
  - 상세: cluster 옵션에 `maxZoom: 14`가 지정되어 있어 줌 14 이하에서는 개별 마커 대신 cluster 표현이 유지될 수 있음.

- 줌/이동 후 새 마커가 늦게 보이거나 안 바뀌는 현상
  - 원인 후보: `idle -> debounce -> viewport fetch -> marker diff` 구조
  - 코드 근거: `components/MapContainer.tsx:209`, `hooks/useMapViewport.ts:122`, `hooks/useMapViewport.ts:145`
  - 상세: 지도 조작 직후 즉시 마커를 재계산하는 구조가 아니라, `idle` 이후 300ms debounce 뒤 서버 조회 후 반영하는 구조임.

- fetch 실패 후 화면이 이전 상태처럼 보이는 현상
  - 원인 후보: null fallback 기반 stale UI 유지
  - 코드 근거: `lib/queries.ts:2212`, `hooks/useMapViewport.ts:151`
  - 상세: viewport 조회 실패 시 `[]`가 아니라 `null`을 반환하고, 프론트는 `if (fetchedData)`일 때만 갱신하므로 실패 시 기존 마커 집합이 유지됨.

- 백엔드가 특정 줌에서 일부 결과를 줄이는 가능성
  - 원인 후보: 운영 DB migration 미반영 시 zoom cap 잔존
  - 코드 근거: `supabase/migrations/20260405093000_stabilize_search_facilities_in_view.sql:38`, `supabase/migrations/20260406160000_align_viewport_verified_filter.sql:28`
  - 상세: 최신 레포 기준 함수는 zoom cap이 제거되어 있으나, 과거 migration에는 `zoom_level`별 row limit이 존재함.

## 2. 지도/클러스터 동작 구조

### 2.1 사용자 마커 클릭

1. `components/MapContainer.tsx`에서 각 마커에 click listener 등록
2. 클릭 시 `facility.id` 기준으로 최신 시설 데이터를 찾아 `onFacilitySelect` 호출
3. 상위에서는 `hooks/useFacilityData.ts`의 `handleFacilitySelect`가 실행됨
4. `setSelectedFacility(facility)`가 즉시 실행됨
5. 필요 조건일 때만 상세 조회 추가 실행

관련 근거:
- `components/MapContainer.tsx:365`
- `hooks/useFacilityData.ts:395`

### 2.2 선택 상태 반영

1. `selectedFacilityId`가 `App.tsx`에서 `ContentRouter`를 거쳐 `MapComponent`로 전달됨
2. `components/MapContainer.tsx`의 별도 effect가 전체 마커를 순회
3. 선택된 마커는 `getMarkerHtml(category, true)`와 높은 z-index를 적용

관련 근거:
- `App.tsx:319`
- `components/ContentRouter.tsx:122`
- `components/MapContainer.tsx:486`

### 2.3 지도 이동/줌 후 viewport 반영

1. 지도 조작 후 `idle` 이벤트 발생
2. 현재 bounds와 zoom을 `LeafletCompatibleBounds`로 감싸 상위로 전달
3. `hooks/useMapViewport.ts`에서 debounce 300ms 대기
4. 이전 요청 abort 후 `fetchFacilitiesInView(bounds, token, signal, { zoomLevel })` 호출
5. 성공 시 `facilities`를 새 viewport 응답으로 교체
6. 실패 시 `null` fallback으로 기존 시설 상태 유지

관련 근거:
- `components/MapContainer.tsx:209`
- `hooks/useMapViewport.ts:122`
- `hooks/useMapViewport.ts:145`
- `lib/queries.ts:2212`

### 2.4 marker diff 및 cluster 재구성

1. `MapContainer`가 새 `facilities`로 유효 좌표만 남김
2. 기존 marker map과 비교하여 제거/생성/위치 수정/아이콘 수정 수행
3. 제거 단계에서 selected marker는 예외 처리
4. cluster 사용 시 cluster 인스턴스 생성 또는 setMarkers/redraw
5. cluster 미사용 시 개별 마커를 지도에 직접 부착

관련 근거:
- `components/MapContainer.tsx:323`
- `components/MapContainer.tsx:331`
- `components/MapContainer.tsx:423`
- `components/MapContainer.tsx:476`

## 3. 증상별 해석

### 3.1 이전 마커가 계속 남아 있음

프론트 기준 설명:
- selected marker는 marker 제거 루프에서 예외 처리됨
- viewport fetch 실패 시 기존 마커 집합을 유지함

백엔드가 개입한다면:
- 새 viewport 결과를 반환하는 역할까지만 직접 관여
- 잔존 표시 자체는 프론트 표시 정책 영향이 더 큼

가장 가능성 높은 원인:
- `components/MapContainer.tsx:331`의 selected 예외 분기

### 3.2 클릭 후 숫자로 바뀜

프론트 기준 설명:
- 개별 마커 HTML은 숫자를 그리지 않음
- cluster count만 숫자를 표시함

백엔드가 개입한다면:
- 직접적으로는 거의 무관

가장 가능성 높은 원인:
- `components/MapContainer.tsx:439`의 cluster count 표시

### 3.3 특정 줌에서 안 보임

프론트 기준 설명:
- 현재 코드상 개별 마커를 줌 기준으로 숨기는 별도 분기는 확인되지 않음
- 대신 `maxZoom: 14` 경계에서 개별 마커와 cluster 표현이 전환됨
- 사용자 체감상 “사라짐”은 cluster 흡수와 혼동될 수 있음

백엔드가 개입한다면:
- 운영 DB가 과거 migration 상태면 `zoom_level`별 결과 수 제한 가능

가장 가능성 높은 원인:
- 프론트의 cluster 전환 경계

### 3.4 이동 후 새 마커가 늦게 보이거나 안 바뀜

프론트 기준 설명:
- `idle` 이후에만 재조회 시작
- debounce 300ms 존재
- fetch 실패 시 기존 UI 유지

백엔드가 개입한다면:
- 응답 지연 또는 실패

가장 가능성 높은 원인:
- viewport fetch 반영 타이밍 + stale 유지 정책

## 4. 원인 가설 우선순위

### P0

- selected marker 삭제 예외
  - 이유: 코드상 직접 분기가 존재하고 “이전 마커가 남는다”는 현상과 1:1로 연결됨

- cluster count를 숫자화로 체감하는 문제
  - 이유: 개별 마커 숫자 렌더는 없고 숫자 렌더는 cluster에만 존재함

### P1

- `maxZoom: 14` 경계에서 cluster와 개별 마커 표현 전환
  - 이유: 특정 줌 레벨 체감과 직접 연결되지만, 실제 완전 미표시인지 cluster 흡수인지는 화면 관찰 필요

- `idle + debounce + abort + stale 유지`로 인한 이동 후 늦은 반영
  - 이유: 코드 흐름상 충분히 가능한 사용자 체감

### P2

- 운영 DB의 과거 `search_facilities_in_view` 함수 상태
  - 이유: 레포 최신 migration은 zoom cap 제거 상태이나, 운영 반영 여부는 현재 미확인

## 5. 프론트/백엔드 책임 경계

### 프론트 책임

- 선택 상태 유지
- 선택 아이콘 및 z-index 반영
- cluster 숫자 렌더링
- marker diff 생성/업데이트/제거
- selected marker 예외 유지
- `idle` 이후 debounce 기반 viewport fetch 트리거
- fetch 실패 시 stale UI 유지

관련 근거:
- `hooks/useFacilityData.ts:404`
- `utils/naverMapHelper.ts:30`
- `components/MapContainer.tsx:331`
- `components/MapContainer.tsx:439`
- `hooks/useMapViewport.ts:122`
- `lib/queries.ts:2212`

### 백엔드 책임

- viewport 내 시설 데이터 반환
- zoom level 제한 존재 여부
- verified 필터 등 반환 조건

관련 근거:
- `lib/queries.ts:2200`
- `supabase/migrations/20260406160000_align_viewport_verified_filter.sql:40`
- `supabase/migrations/20260405093000_stabilize_search_facilities_in_view.sql:38`

### 현재 증상 기준 판단

- 현재 증상은 프론트 쪽 가능성이 더 큼
- 이유: selected 예외, cluster count, `maxZoom: 14`, stale 유지 정책 모두 프론트 코드에서 직접 설명 가능
- 백엔드는 운영 DB migration 상태가 과거일 때 우선순위가 올라감

## 6. 검증 포인트

- 클릭 후 멀리 이동했을 때 selected marker가 bounds 밖에서도 남는지 확인
- 같은 위치에서 줌 14와 15를 비교해 cluster와 개별 마커 전환이 일어나는지 확인
- 숫자가 보이는 순간 그것이 cluster count인지 화면에서 확인
- 이동 직후와 300ms 이후 화면을 비교해 debounce 반영 체감 확인
- viewport 요청 실패 시 기존 마커가 유지되는지 네트워크 탭으로 확인
- 운영 DB의 `search_facilities_in_view` 함수에 zoom cap이 남아 있는지 확인

## 7. 불확실한 부분

- 운영 DB migration 반영 여부는 현재 직접 확인하지 못함
- 외부 `MarkerClustering.js` 내부 구현 동작은 직접 분석하지 않음
- “숫자로 바뀐다”는 사용자 표현이 cluster count인지 다른 UI 숫자인지 화면 증거 없이 100% 확정할 수 없음
- 지도 SDK의 `idle` 발생 체감 타이밍은 런타임 환경 관찰이 추가로 필요함

## 결론

현재 코드 기준으로 가장 직접적인 구조적 원인은 다음 네 가지임.

1. selected marker 삭제 예외
2. cluster count 숫자 렌더링
3. `maxZoom: 14` 경계의 cluster 전환
4. `idle -> debounce -> viewport fetch -> stale 유지` 흐름

즉, 사용자가 느끼는 “남아 있음”, “숫자로 바뀜”, “특정 레벨에서 안 보임”, “움직이면 다시 나타남”은 하나의 원인보다 위 네 가지가 조합되어 나타나는 현상으로 보는 것이 현재 코드와 가장 잘 맞음.
