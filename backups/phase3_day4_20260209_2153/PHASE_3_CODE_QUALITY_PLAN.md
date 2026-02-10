# Phase 3: 코드 품질 개선 - 작업계획 (수정판)

**문서 생성일**: 2026-02-09  
**검증일**: 2026-02-09  
**상태**: 검증 완료 - 작업 준비  
**예상 소요기간**: 2-3일  
**총 예상 시간**: 12시간

---

## 1. 검증 결과 요약

### ✅ TypeScript 오류 상태

| 항목 | 계획 문서 | 실제 검증 결과 |
|------|-----------|----------------|
| **TypeScript 오류 수** | 31개 | **0개** ✅ |
| **tsc --noEmit 결과** | 오류 예상 | Exit code: 0 |

> **중요**: 계획 문서의 31개 TypeScript 오류 주장은 **더 이상 유효하지 않습니다**. 이미 해결되었거나 `tsconfig.json`에서 제외된 상태입니다.

---

### 📦 번들 사이즈 상태

| 파일 | 크기 | Gzip |
|------|------|------|
| **index-CIICoakO.js** (메인) | 843.55 KB | 247.70 KB |
| vendor-Dgp7eeXb.js | 161.06 KB | 52.58 KB |
| index-D6e1NnWf.js | 148.13 KB | 43.33 KB |
| leaflet-CWqdS40V.js | 148.93 KB | 43.09 KB |
| **총합** | ~1.3 MB | ~390 KB |

> **경고**: 메인 번들이 **843KB**로 목표 500KB를 크게 초과합니다. 코드 스플리팅 최적화가 필요합니다.

---

### 📄 App.tsx 상태

| 항목 | 측정값 | 권장값 |
|------|--------|--------|
| **총 라인 수** | 2,026줄 | < 500줄 |
| **파일 크기** | ~92KB | < 30KB |
| **함수 수** | 30개 | 분리 필요 |

---

## 2. 수정된 작업 우선순위

### ~~작업 3.1: TypeScript 오류 해결~~ ❌ 불필요
> 이미 0개 오류 상태입니다. 생략합니다.

---

## 3. 상세 작업 계획

### 작업 3.1: App.tsx 분할 (High Priority)

**예상 시간**: 4시간  
**위험도**: 🟡 중간

현재 App.tsx가 2,026줄로 과도하게 비대합니다.

#### 목표 구조

```
src/
├── App.tsx (~300줄) - 진입점
├── AppProviders.tsx - Context/Provider
├── AppRoutes.tsx - 라우트 정의
└── hooks/
    ├── useAppInitialization.ts
    ├── useFacilityData.ts
    └── useMapHandlers.ts
```

#### 3.1.1 [MODIFY] App.tsx
- Provider 로직 → `AppProviders.tsx`로 이전
- 라우트 정의 → `AppRoutes.tsx`로 이전
- `fetchFacilities`, `fetchUserRole` → hooks로 분리
- `handleMapBoundsChange` 등 핸들러 → hooks로 분리

**체크리스트**:
- [ ] Provider 로직 분리
- [ ] 라우트 정의 분리
- [ ] 데이터 페칭 로직 분리
- [ ] 이벤트 핸들러 분리
- [ ] 빌드 테스트

#### 3.1.2 [NEW] AppProviders.tsx
- ClerkProvider, QueryClientProvider 등 래핑

**구현 내용**:
```typescript
// AppProviders.tsx
import { ClerkProvider } from '@clerk/clerk-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from 'sonner';

interface AppProvidersProps {
  children: React.ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  const queryClient = new QueryClient();
  
  return (
    <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          {children}
        </ToastProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
};
```

#### 3.1.3 [NEW] AppRoutes.tsx
- 모든 Route 컴포넌트 정의

**구현 내용**:
```typescript
// AppRoutes.tsx
import { Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';

const Home = lazy(() => import('./pages/Home'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const MyPage = lazy(() => import('./pages/MyPage'));
// ... 기타 라우트

export const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/mypage" element={<MyPage />} />
        {/* ... 기타 라우트 */}
      </Routes>
    </Suspense>
  );
};
```

#### 3.1.4 [NEW] hooks/useAppInitialization.ts
- 앱 초기화 로직 (인증 상태, 초기 데이터 로드)

**구현 내용**:
```typescript
// hooks/useAppInitialization.ts
import { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';

export const useAppInitialization = () => {
  const { isLoaded, isSignedIn, user } = useUser();
  const [isInitialized, setIsInitialized] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    
    const initialize = async () => {
      if (isSignedIn && user) {
        // 사용자 역할 확인
        const role = await fetchUserRole(user.id);
        setUserRole(role);
      }
      setIsInitialized(true);
    };

    initialize();
  }, [isLoaded, isSignedIn, user]);

  return { isInitialized, userRole };
};
```

---

### 작업 3.2: 번들 사이즈 최적화 (High Priority)

**예상 시간**: 3시간  
**위험도**: 🟡 중간

#### 현재 문제
- 메인 번들 843KB (목표: < 500KB)
- 코드 스플리팅 부분 적용됨 (일부 lazy 사용 중)

#### 3.2.1 [MODIFY] App.tsx
- 추가 컴포넌트 lazy 로딩 적용
- 큰 컴포넌트 동적 import 전환

**추가 분할 대상**:
| 컴포넌트 | 현재 크기 | 액션 |
|----------|-----------|------|
| SuperAdminDashboard | 58.86 KB | 이미 분리됨 ✅ |
| MyPageView | 43.12 KB | 이미 분리됨 ✅ |
| FacilityAdminDashboard | 28.13 KB | 이미 분리됨 ✅ |
| index-CIICoakO.js | 843 KB | **분석 필요** |

**분석 방법**:
```bash
# 번들 분석 도구 실행
npx vite-bundle-visualizer
```

**체크리스트**:
- [ ] vite-bundle-visualizer 실행
- [ ] 큰 모듈 식별
- [ ] 동적 import 적용
- [ ] 코드 스플리팅 최적화
- [ ] 빌드 후 크기 확인 (목표: < 500KB)

---

### 작업 3.3: 성능 최적화 (Medium Priority)

**예상 시간**: 3시간  
**위험도**: 🟢 낮음

#### 3.3.1 [MODIFY] MapContainer.tsx
- 마커 클러스터링 적용
- 가시 영역만 렌더링

**구현 내용**:
```typescript
// MapContainer.tsx
import { useMemo, useCallback } from 'react';

const MapContainer: React.FC<MapContainerProps> = ({ facilities }) => {
  // 가시 영역 내 마커만 필터링
  const visibleFacilities = useMemo(() => {
    if (!mapBounds) return facilities;
    return facilities.filter(f => 
      mapBounds.contains(new naver.maps.LatLng(f.lat, f.lng))
    );
  }, [facilities, mapBounds]);

  // 마커 클러스터링
  useEffect(() => {
    if (!map || visibleFacilities.length === 0) return;
    
    const markers = visibleFacilities.map(f => 
      new naver.maps.Marker({
        position: new naver.maps.LatLng(f.lat, f.lng),
        map: map
      })
    );

    // 클러스터링 적용
    const clusterer = new MarkerClustering({
      minClusterSize: 2,
      maxZoom: 13,
      map: map,
      markers: markers,
      disableClickZoom: false,
      gridSize: 120,
      icons: [clusterIcon],
      indexGenerator: [10, 100, 200, 500, 1000],
      stylingFunction: function(clusterMarker, count) {
        clusterMarker.getElement().innerHTML = count;
      }
    });

    return () => {
      clusterer.clearMarkers();
    };
  }, [visibleFacilities, map]);

  return <div ref={mapRef} style={{ width: '100%', height: '100%' }} />;
};
```

**체크리스트**:
- [ ] 가시 영역 필터링 구현
- [ ] MarkerClustering 라이브러리 도입
- [ ] 클러스터링 적용
- [ ] 성능 벤치마크

#### 3.3.2 [MODIFY] 데이터 쿼리
- select('*') → 필요 필드만 선택
- 페이지네이션 적용 검토

**구현 내용**:
```typescript
// Before
const { data } = await supabase
  .from('facilities')
  .select('*')
  .not('lat', 'is', null);

// After
const { data } = await supabase
  .from('facilities')
  .select('id, name, lat, lng, type, category, address, phone')
  .not('lat', 'is', null);

// 페이지네이션
const { data, count } = await supabase
  .from('facilities')
  .select('id, name, lat, lng, type', { count: 'exact' })
  .range((page - 1) * 100, page * 100 - 1);
```

**체크리스트**:
- [ ] select 쿼리 최적화
- [ ] 페이지네이션 구현
- [ ] DB 쿼리 성능 측정

---

### 작업 3.4: 코드 품질 개선 (Low Priority)

**예상 시간**: 2시간  
**위험도**: 🟢 낮음

#### 3.4.1 [NEW] lib/logger.ts
- 로깅 유틸리티 표준화
- 환경별 로그 레벨 설정

**구현 내용**:
```typescript
// lib/logger.ts
enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

class Logger {
  private level: LogLevel;
  
  constructor(level: LogLevel = LogLevel.INFO) {
    this.level = level;
  }
  
  debug(message: string, ...args: any[]) {
    if (this.level <= LogLevel.DEBUG) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }
  
  info(message: string, ...args: any[]) {
    if (this.level <= LogLevel.INFO) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }
  
  warn(message: string, ...args: any[]) {
    if (this.level <= LogLevel.WARN) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }
  
  error(message: string, ...args: any[]) {
    if (this.level <= LogLevel.ERROR) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  }
}

export const logger = new Logger(
  import.meta.env.DEV ? LogLevel.DEBUG : LogLevel.ERROR
);
```

**체크리스트**:
- [ ] logger.ts 구현
- [ ] console.log → logger 마이그레이션
- [ ] 환경별 로그 레벨 설정

#### 3.4.2 Race Condition 해결
- AbortController 패턴 적용

**구현 내용**:
```typescript
// Race Condition 해결 예시
const abortControllerRef = useRef<AbortController | null>(null);

useEffect(() => {
  if (abortControllerRef.current) {
    abortControllerRef.current.abort();
  }
  abortControllerRef.current = new AbortController();
  
  fetchData(abortControllerRef.current.signal);
  
  return () => abortControllerRef.current?.abort();
}, [dependency]);
```

**체크리스트**:
- [ ] ChatInterface.tsx 수정
- [ ] BrandChatInterface.tsx 수정
- [ ] 기타 비동기 컴포넌트 검토

---

## 4. 작업 일정

### Day 1: App.tsx 분할

| 시간 | 작업 | 산출물 |
|------|------|--------|
| 0-2h | AppProviders.tsx, AppRoutes.tsx 생성 | 2개 신규 파일 |
| 2-4h | App.tsx 리팩토링, hooks 분리 | 정리된 App.tsx |
| 4-6h | 통합 테스트, 버그 수정 | 테스트 완료 |

### Day 2: 번들 최적화 + 성능

| 시간 | 작업 | 산출물 |
|------|------|--------|
| 0-2h | 번들 분석 (vite-bundle-visualizer) | 분석 리포트 |
| 2-4h | 코드 스플리팅 적용 | 최적화된 빌드 |
| 4-6h | MapContainer 성능 개선 | 클러스터링 적용 |

### Day 3: 마무리 + 품질 개선

| 시간 | 작업 | 산출물 |
|------|------|--------|
| 0-1h | 데이터 쿼리 최적화 | 최적화된 쿼리 |
| 1-2h | logger.ts 구현 | 로깅 유틸리티 |
| 2-4h | Race Condition 해결 | 안정화된 비동기 |
| 4-6h | 최종 테스트, 문서화 | 완료 보고서 |

---

## 5. 테스트 계획

### 5.1 자동화 테스트

```powershell
# TypeScript 검증
npx tsc --noEmit

# 빌드 검증
npm run build

# Cypress E2E 테스트
npx cypress run

# Playwright 테스트
npx playwright test
```

### 5.2 번들 사이즈 검증

```powershell
# 빌드 후 번들 크기 확인
npm run build 2>&1 | Select-String "\.js"
```

**성공 기준**: 메인 번들 < 500KB

### 5.3 수동 테스트

1. **메인 페이지 로드**
   - http://localhost:5173/ 접속
   - 지도 표시 확인
   - 마커 클릭 동작 확인

2. **관리자 기능**
   - 로그인 후 관리자 대시보드 접근
   - 각 메뉴 정상 로드 확인

3. **성능 테스트**
   - Lighthouse 점수 확인
   - FCP < 1.5s 목표

---

## 6. 선행 조건

Phase 3 시작 전 반드시 완료되어야 할 작업:

- [ ] Phase 2: Logic Hardening 완료
  - [ ] alert() → toast 교체 완료
  - [ ] Error Handler 구현 완료
  - [ ] Supabase Singleton 완성
  - [ ] Realtime cleanup 적용
- [ ] `types_schema.ts` 빌드 제외 상태 확인
- [ ] 개발 서버 정상 동작 확인
- [ ] TypeScript 오류 0개 확인

---

## 7. 위험 요소 및 대응책

| 위험 | 가능성 | 영향도 | 대응책 |
|------|--------|--------|--------|
| **App.tsx 분리 후 버그** | 중간 | 높음 | 단위 테스트 필수, 스테이징 검증 |
| **번들 최적화 후 기능 이상** | 중간 | 중간 | A/B 테스트, 점진적 적용 |
| **클러스터링 도입 후 성능 저하** | 낮음 | 중간 | 성능 벤치마크, 롤백 준비 |
| **작업 범위 확대** | 높음 | 중간 | 계획 범위 엄격히 준수 |

---

## 8. 기존 계획서 대비 변경사항

| 항목 | 기존 계획 | 수정된 계획 | 변경 이유 |
|------|----------|-------------|----------|
| TypeScript 오류 | 31개 수정 (Day 1-2) | ❌ **생략** | 이미 0개 해결됨 |
| 예상 기간 | 3-5일 | **2-3일** | TS 오류 작업 생략 |
| 주요 작업 | 타입 오류 해결 | **App.tsx 분할, 번들 최적화** | 실제 문제 우선순위 반영 |
| 총 예상 시간 | 24-36시간 | **12시간** | 불필요한 작업 제거 |

---

## 9. 예상 결과

| 항목 | Before | After | 측정 방법 |
|------|--------|-------|----------|
| **App.tsx 라인 수** | 2,026줄 | < 500줄 | 파일 분석 |
| **App.tsx 크기** | ~92KB | ~30KB | 파일 크기 |
| **메인 번들 크기** | 843KB | < 500KB | 빌드 결과 |
| **FCP** | 2.5s+ | < 1.5s | Lighthouse |
| **TTI** | 4s+ | < 2.5s | Lighthouse |
| **TypeScript 오류** | 0개 | 0개 | tsc --noEmit |

---

## 10. 참고 자료

### 문서
- `FINAL_ERROR_REPORT.md` - 오류 상세 내역
- `PHASE_2_LOGIC_HARDENING_WORK_GUIDE.md` - Phase 2 작업 현황
- `PROJECT_STATUS_UPDATE_20260209.md` - 최신 프로젝트 상태
- `.gemini/antigravity/brain/*/implementation_plan.md` - 검증 결과

### 명령어

```bash
# TypeScript 오류 검사
npx tsc --noEmit

# 번들 사이즈 분석
npx vite-bundle-visualizer

# Lighthouse 테스트
npx lighthouse http://localhost:5173 --output=html

# 빌드
npm run build

# 테스트
npx cypress run
npx playwright test
```

---

## 11. 결론 및 다음 단계

### 수정된 핵심 내용
1. **TypeScript 오류 해결 작업 제외** - 이미 0개 상태
2. **App.tsx 분할을 최우선** - 2,026줄 → 300줄 목표
3. **번들 최적화 집중** - 843KB → < 500KB 목표
4. **작업 기간 단축** - 3-5일 → 2-3일

### 승인 후 진행 순서
1. App.tsx 분할 (Day 1)
2. 번들 최적화 (Day 2)
3. 성능 및 품질 개선 (Day 3)
4. 최종 테스트 및 문서화

---

**문서 담당자**: AI Assistant  
**마지막 수정**: 2026-02-09 (검증 결과 반영)
