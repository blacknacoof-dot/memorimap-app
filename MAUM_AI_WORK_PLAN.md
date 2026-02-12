# 마음이 AI 검색 간소화 - 작업 계획

> 작성일: 2026-02-12 | 기반: MAUM_AI_SEARCH_SIMPLIFICATION_PLAN.md (Final Refined v2)

## 완료된 작업 (현재 커밋)

### FuneralSearchForm 리팩토링
- [x] Step 7(부대시설) 제거 → Step 6에서 바로 Step 8
- [x] 추천 시설 카드: 이미지/주소/전화 표시
- [x] 인라인 상담접수 폼 (성함/연락처/메모 → consultations 저장)
- [x] 접수완료 상태 표시 + "상담내역 보기" → MyPage 이동
- [x] 중복 요약화면 제거 (Step 8 하나로 통합)

### 추천 알고리즘 개선 (queries.ts)
- [x] 좌표 기반 반경 확장 (5km→10km→20km fallback)
- [x] regionText 없으면 전체 지역 fallback
- [x] consultation status waiting→pending 통일

### Prop 체인 & 타입
- [x] onGoToMyPage prop (App→ChatInterface→FuneralSearchForm/MemorialSearchForm)
- [x] GO_MY_PAGE ActionType 추가

---

## 남은 작업

### Phase 1: Critical (P0)
- [ ] **P0-001** GPS 권한 거부 시 fallback 지역 선택 모달
  - 파일: SmartSearchInput.tsx (또는 FuneralSearchForm 내 위치 관련)
  - 해결: geolocation 에러 핸들링 → 지역 수동 선택 유도

### Phase 2: High Priority (P1)
- [ ] **P1-001** ChatInterface로 조건 자동 전달 (handoverContext 점검)
- [ ] **P1-002** 한글 조합 이벤트 처리 (compositionstart/end)
- [ ] **P1-003** 모바일 드롭다운 z-index 잘림
- [ ] **P1-004** 반려동물 무게 음수값 validation (min:0.1, max:100)

### Phase 3: 성능/UX (P2)
- [ ] **P2-001** 추천 카드 이미지 lazy loading
- [ ] **P2-002** 검색 기록 localStorage 저장 (최대 10개)
- [ ] **P2-003** 접근성 aria-label 추가

### Phase 4: 동물장례 흐름 점검
- [ ] PetFuneral 예약 폼 → Supabase 저장 확인
- [ ] MemorialSearchForm 상담접수 동일 패턴 적용

---

## 작업 순서

1. P0-001 → GPS fallback
2. P1-001 → 조건 전달 점검
3. P1-002~004 → 소규모 수정 (병렬 처리)
4. P2-001~003 → 성능/접근성 (병렬 처리)
5. 동물장례/추모시설 흐름 통합 점검
6. 최종 빌드 검증 & 커밋
