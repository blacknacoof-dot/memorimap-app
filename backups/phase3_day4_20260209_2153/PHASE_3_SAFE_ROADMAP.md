# Phase 3 후속 작업 계획 (안정적 접근)

**문서 생성일**: 2026-02-09  
**목표**: 안정적으로 App.tsx 개선 및 성능 최적화  
**총 예상 기간**: 2주 (점진적 진행)  
**위험도**: 🟢 낮음 (단계별 롤백 가능)

---

## 1. 작업 철학

### 핵심 원칙
1. **점진적 마이그레이션**: 한 번에 하나의 기능만 이동
2. **롤백 가능성**: 각 단계마다 Git 커밋 + 롤백 지점 확보
3. **테스트 우선**: 이동 후 반드시 기능 테스트
4. **백업 유지**: 원본 App.tsx 복사본 유지

### 작업 흐름
```
준비 단계 → 마이그레이션 단계 → 검증 단계 → 최적화 단계
(1주)      → (1-2주)            → (지속적)   → (1주)
```

---

## 2. 준비 단계 (Day 1-2)

### Day 1: 백업 및 테스트 환경 구축

**작업 내용**:
```bash
# 1. 현재 상태 백업
cp App.tsx App.tsx.backup.original
cp -r hooks hooks.backup.original

# 2. 테스트 환경 확인
npm run test        # 테스트 실행
npm run build       # 빌드 확인
npx tsc --noEmit    # TS 오류 확인
```

**산출물**:
- [ ] App.tsx.backup.original 생성
- [ ] 기존 테스트 통과 확인
- [ ] Baseline 성능 측정 (Lighthouse)

---

### Day 2: 개발 환경 분리

**작업 내용**:
```bash
# 1. feature 브랜치 생성
git checkout -b feature/phase3-refactoring

# 2. 개발 모드 플래그 설정
# .env.local에 추가:
VITE_ENABLE_NEW_HOOKS=false
```

**산출물**:
- [ ] 독립적인 개발 브랜치
- [ ] 기능 토글 설정

---

## 3. 마이그레이션 단계 (Week 1-2)

### Week 1: 안전한 기능 이동

#### Task 1: 토스트/알림 로직 이동 (Day 3) - 🟢 안전
**대상**: `showToast` 함수 및 관련 state

**절차**:
```typescript
// 1. 새 hook 생성: hooks/useToast.ts
export const useToast = () => {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  }, []);
  
  return { toast, showToast };
};

// 2. App.tsx에서 교체
// Before: const [toast, setToast] = useState(...)
// After: const { toast, showToast } = useToast();
```

**검증**:
- [ ] 토스트 정상 표시
- [ ] 자동 사라짐 동작
- [ ] 에러/성공/정보 타입별 테스트

**롤백**: 문제 발생 시 App.tsx에서 원래 코드 복원

---

#### Task 2: 비교함 로직 이동 (Day 4) - 🟢 안전
**대상**: `compareList`, `toggleCompare`, `toggleSangjoCompare`

**절차**:
```typescript
// 1. 새 hook 생성: hooks/useComparison.ts
export const useComparison = () => {
  const [compareList, setCompareList] = useState<Facility[]>([]);
  const [sangjoCompareList, setSangjoCompareList] = useState<FuneralCompany[]>([]);
  
  const toggleCompare = useCallback((facility: Facility) => {
    // 기존 로직 유지
  }, []);
  
  return { compareList, toggleCompare, sangjoCompareList, toggleSangjoCompare };
};
```

**검증**:
- [ ] 비교함 추가/제거
- [ ] 최대 3개 제한
- [ ] 비교 모달 표시

---

#### Task 3: 예약 로직 이동 (Day 5) - 🟡 주의
**대상**: `reservations`, `handleBookingConfirm`, `handleUpdateReservation`

**주의사항**: 데이터베이스 연동 포함

**절차**:
```typescript
// 1. 새 hook 생성: hooks/useReservations.ts
// 2. Supabase insert 로직 유지
// 3. 에러 핸들링 강화
```

**검증**:
- [ ] 예약 생성
- [ ] 예약 상태 변경
- [ ] DB 데이터 확인
- [ ] 에러 케이스 처리

---

### Week 2: 핵심 로직 이동

#### Task 4: 사용자 역할 로직 이동 (Day 8-9) - 🟡 주의
**대상**: `userRole`, `fetchUserRole`, `adminSangjoId`

**이미 완료**: `useAppInitialization.ts`에 구현됨

**적용 절차**:
```typescript
// 1. App.tsx에서 기존 로직 주석 처리
// 2. useAppInitialization import 및 사용
// 3. 문제 발생 시 즉시 롤백
```

**검증**:
- [ ] 로그인 시 역할 확인
- [ ] 상조 업체 정보 로드
- [ ] 자동 라우팅 (관리자/일반)

---

#### Task 5: 시설 데이터 로직 이동 (Day 10-11) - 🔴 신중
**대상**: `facilities`, `fetchFacilities`, `handleFacilitySelect`

**이미 완료**: `useFacilityData.ts`에 구현됨

**적용 절차**:
```typescript
// 1. Feature flag로 점진적 적용
const USE_NEW_FACILITY_HOOK = import.meta.env.VITE_ENABLE_NEW_HOOKS === 'true';

// 2. 조걶적 사용
const facilityData = USE_NEW_FACILITY_HOOK 
  ? useFacilityData(userInfo)
  : useOldFacilityLogic(); // 기존 로직
```

**검증** (반드시 수동 테스트):
- [ ] 시설 목록 로드
- [ ] 시설 선택 시 상세 정보
- [ ] 리뷰 추가/삭제
- [ ] 이미지 표시

---

## 4. 검증 단계 (지속적)

### 자동화 테스트
```bash
# 1. TypeScript 검증
npx tsc --noEmit

# 2. 빌드 검증
npm run build

# 3. Cypress E2E
npx cypress run --spec "cypress/e2e/home.cy.ts"
npx cypress run --spec "cypress/e2e/facility-list.cy.ts"

# 4. Lighthouse CI
npx lighthouse http://localhost:5173 --output=json
```

### 수동 테스트 체크리스트
| 기능 | 테스트 항목 | 담당자 | 날짜 |
|------|-------------|--------|------|
| 지도 | 마커 표시, 클릭, 이동 | | |
| 검색 | 키워드 검색, 필터 | | |
| 시설 | 상세 정보, 리뷰 | | |
| 예약 | 생성, 조회, 취소 | | |
| 관리자 | 로그인, 대시보드 | | |
| 인증 | 로그인/로그아웃 | | |

---

## 5. 최적화 단계 (Week 3)

### Task 6: MapContainer 성능 개선 (Day 15-16)
**목표**: 마커 클러스터링, 가시 영역 렌더링

**절차**:
```typescript
// 1. 클러스터링 라이브러리 추가
npm install @navermaps/marker-clustering

// 2. MapContainer 수정
const visibleFacilities = useMemo(() => {
  if (!mapBounds) return facilities;
  return facilities.filter(f => mapBounds.contains(new LatLng(f.lat, f.lng)));
}, [facilities, mapBounds]);
```

**검증**:
- [ ] 1000개 마커 테스트
- [ ] 지도 이동 시 성능
- [ ] 메모리 사용량

---

### Task 7: 번들 최적화 (Day 17-18)
**목표**: 843KB → 500KB

**전략**:
```typescript
// 1. 추가 코드 스플리팅
const HeavyComponent = lazy(() => import('./HeavyComponent'));

// 2. Tree shaking 확인
// package.json "sideEffects": false

// 3. 중복 코드 제거
// webpack-bundle-analyzer로 분석
```

**검증**:
```bash
npm run build
# 메인 번들 < 500KB 확인
```

---

## 6. 롤백 전략

### 단계별 롤백
```bash
# 문제 발견 시 즉시 롤백
git stash                    # 현재 작업 저장
git checkout HEAD~1          # 이전 커밋으로 이동
npm run build               # 빌드 확인
npm run dev                 # 개발 서버 실행 후 테스트
```

### 긴급 롤백 (심각한 버그 발생 시)
```bash
# 원본 복원
cp App.tsx.backup.original App.tsx
cp -r hooks.backup.original/* hooks/
git checkout -- .
npm run build
```

---

## 7. 위험 관리

### 위험도 평가
| 작업 | 위험도 | 영향 | 대응책 |
|------|--------|------|--------|
| 토스트 로직 이동 | 🟢 낮음 | UI 일부 | 즉시 롤백 |
| 비교함 이동 | 🟢 낮음 | 부가 기능 | 즉시 롤백 |
| 예약 로직 이동 | 🟡 중간 | 핵심 기능 | 스테이징 테스트 |
| 사용자 역할 이동 | 🟡 중간 | 인증 | 스테이징 테스트 |
| 시설 데이터 이동 | 🔴 높음 | 핵심 기능 | Feature flag |
| MapContainer 수정 | 🟡 중간 | 핵심 기능 | A/B 테스트 |

### 모니터링 지표
- 에러 로그 (Sentry 또는 console.error)
- 사용자 행동 (핵심 기능 사용률)
- 성능 지표 (FCP, TTI)

---

## 8. 작업 일정표

### Week 1
| Day | 작업 | 산출물 | 위험도 |
|-----|------|--------|--------|
| 1 | 백업 및 테스트 환경 | 백업 파일 | 🟢 |
| 2 | 개발 브랜치 생성 | feature 브랜치 | 🟢 |
| 3 | 토스트 로직 이동 | useToast.ts | 🟢 |
| 4 | 비교함 로직 이동 | useComparison.ts | 🟢 |
| 5 | 예약 로직 이동 | useReservations.ts | 🟡 |
| 6-7 | 검증 및 버그 수정 | 테스트 리포트 | 🟡 |

### Week 2
| Day | 작업 | 산출물 | 위험도 |
|-----|------|--------|--------|
| 8-9 | 사용자 역할 이동 | useAppIntegration | 🟡 |
| 10-11 | 시설 데이터 이동 | useFacilityData 통합 | 🔴 |
| 12-13 | 검증 및 버그 수정 | 테스트 리포트 | 🔴 |
| 14 | 중간 리뷰 | 진행 상황 보고 | - |

### Week 3
| Day | 작업 | 산출물 | 위험도 |
|-----|------|--------|--------|
| 15-16 | MapContainer 성능 | 클러스터링 적용 | 🟡 |
| 17-18 | 번들 최적화 | 500KB 목표 | 🟢 |
| 19-20 | 최종 검증 | 전체 테스트 | 🟡 |
| 21 | 배포 준비 | PR 생성 | - |

---

## 9. 성공 기준

### 기능적 성공
- [ ] 모든 기존 기능 정상 동작
- [ ] TypeScript 오류 0개
- [ ] 테스트 통과율 100%

### 성능적 성공
- [ ] 메인 번들 < 500KB
- [ ] FCP < 1.5s
- [ ] TTI < 2.5s
- [ ] 메모리 누수 없음

### 코드 품질
- [ ] App.tsx < 500줄
- [ ] 순환 의존성 없음
- [ ] 테스트 커버리지 > 70%

---

## 10. 참고 자료

### 생성된 파일
```
C:\Users\black\Desktop\memorimap\
├── AppProviders.tsx
├── AppRoutes.tsx
├── lib/logger.ts
└── hooks/
    ├── useAppInitialization.ts
    ├── useFacilityData.ts
    └── useMapHandlers.ts
```

### 문서
- `PHASE_3_CODE_QUALITY_PLAN.md` - 작업 계획
- `PHASE_3_WORK_LOG.md` - 작업 로그
- `PHASE_3_SAFE_ROADMAP.md` - 이 문서

---

## 11. 결론 및 권장사항

### 즉시 시작 가능한 작업 (🟢 안전)
1. **Day 1-2**: 백업 및 환경 설정
2. **Day 3-5**: 토스트/비교함/예약 로직 이동

### 신중하게 진행할 작업 (🟡/🔴 주의)
1. **시설 데이터 로직**: Feature flag로 점진적 적용
2. **MapContainer 수정**: A/B 테스트 권장

### 작업 순서 제안
```
준비 → 토스트 → 비교함 → 예약 → 검증 → 
역할 → 시설 → 검증 → Map → 번들 → 배포
```

**핵심 메시지**: 
- "서두르지 말고, 테스트하며, 롤백 준비를"
- 한 번에 하나씩, 확실하게

---

**문서 담당자**: AI Assistant  
**승인 필요**: Tech Lead  
**시작일**: ___/___  
**목표 완료일**: ___/___
