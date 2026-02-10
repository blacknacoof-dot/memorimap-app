# NewApp 병렬 개발 작업계획

**문서 생성일**: 2026-02-09  
**전략**: 병렬 개발 (Parallel Development)  
**위험도**: 🟢 낮음 (원클릭 롤백 가능)  
**예상 소요**: 2-3주

---

## 1. 핵심 전략: NewApp 병렬 개발

### 개념
```
┌─────────────────────────────────────────────┐
│         기존 App.tsx (안전하게 보관)           │
│              ↓ 계속 동작                      │
│         안정적인 서비스 제공                   │
└─────────────────────────────────────────────┘
                    │
                    │ 병렬 개발
                    ↓
┌─────────────────────────────────────────────┐
│         NewApp.tsx (새로 개발)               │
│              ↓ 점진적 개선                    │
│         테스트 및 검증                        │
└─────────────────────────────────────────────┘
                    │
                    │ 검증 완료 후
                    ↓
┌─────────────────────────────────────────────┐
│        App.tsx ↔ NewApp.tsx 교체            │
│              ↓ 원클릭 롤백 가능               │
│         안전한 전환 완료                      │
└─────────────────────────────────────────────┘
```

### 장점
| 항목 | 기존 방식 | NewApp 병렬 방식 |
|------|----------|------------------|
| **안전성** | ⚠️ 중간 | ✅ 매우 높음 |
| **롤백 시간** | 30분+ | **1분** |
| **테스트** | 제한적 | **자유로움** |
| **리스크** | 높음 | **거의 없음** |
| **동시 개발** | ❌ 불가 | **✅ 가능** |

---

## 2. 파일 구조 및 위치

### 📁 최종 파일 구조
```
C:\Users\black\Desktop\memorimap\
│
├── 📄 App.tsx                          ← 현재 레거시 (안전 보관)
├── 📄 NewApp.tsx                       ← 새로 개발할 파일
├── 📄 App.tsx.legacy                   ← 최종 백업본
├── 📄 config.ts                        ← Feature flag 설정
├── 📄 rollback.sh                      ← 원클릭 롤백 스크립트
│
├── 📁 hooks/                           ← 이미 생성된 hooks
│   ├── useAppInitialization.ts
│   ├── useFacilityData.ts
│   └── useMapHandlers.ts
│
├── 📁 tests/
│   └── newapp-compare.test.js         ← 비교 테스트
│
└── 📄 main.tsx                         ← 진입점 (조걶적 렌더링)
```

### 📄 문서 파일
```
C:\Users\black\Desktop\memorimap\
├── PHASE_3_CODE_QUALITY_PLAN.md       ← 초기 계획
├── PHASE_3_WORK_LOG.md                ← 작업 로그
├── PHASE_3_SAFE_ROADMAP.md            ← 안전 로드맵
└── NEWAPP_PARALLEL_PLAN.md            ← 이 문서
```

---

## 3. 단계별 작업계획

### 🔷 Phase 1: 준비 (Day 1-2)

#### Day 1: 병렬 환경 구축
**작업 내용**:
```bash
# 1. 백업 생성
cp App.tsx App.tsx.backup.parallel
cp App.tsx App.tsx.legacy

# 2. NewApp.tsx 생성
cp App.tsx NewApp.tsx

# 3. Feature flag 설정 파일 생성
```

**생성 파일**:
- `config.ts`
- `NewApp.tsx`
- `rollback.sh`
- 백업 파일들

**검증**:
- [ ] 백업 파일 존재 확인
- [ ] NewApp.tsx 생성 확인
- [ ] Git 커밋: "Setup NewApp parallel development"

---

#### Day 2: Feature Flag 설정
**작업 내용**:
```typescript
// config.ts
export const USE_NEW_APP = import.meta.env.VITE_USE_NEW_APP === 'true';
export const NEW_APP_FEATURES = {
  useNewHooks: true,
  useNewToast: false,      // 점진적 활성화
  useNewComparison: false, // 점진적 활성화
  useNewFacilityData: false // 나중에 활성화
};
```

```typescript
// main.tsx 수정
import { USE_NEW_APP } from './config';
import OldApp from './App';
import NewApp from './NewApp';

const AppComponent = USE_NEW_APP ? NewApp : OldApp;

root.render(<AppComponent />);
```

**환경 변수 설정**:
```bash
# .env.local
VITE_USE_NEW_APP=false  # 기본값: 기존 App 사용
```

**검증**:
- [ ] `npm run dev` → 기존 App 동작
- [ ] `VITE_USE_NEW_APP=true npm run dev` → NewApp 동작

---

### 🔷 Phase 2: NewApp 점진적 개발 (Week 1-2)

#### Week 1: 기본 구조 개선

**Task 1: NewApp.tsx 정리 (Day 3-4)**
```typescript
// NewApp.tsx에서 순차적으로 적용
import { useAppInitialization } from './hooks/useAppInitialization';
import { useFacilityData } from './hooks/useFacilityData';

function NewApp() {
  // 새 hooks 사용
  const { userRole, userInfo } = useAppInitialization(viewState, setViewState);
  const { facilities, handleFacilitySelect } = useFacilityData(userInfo);
  
  // ... 나머지 로직
}
```

**진행 방법**:
1. 주석 처리하지 말고, 바로 새 hooks 적용
2. 에러 발생 시 해당 부분만 원복
3. 하루에 1-2개 기능씩만 수정

**Daily Checklist**:
- [ ] 오전: 한 가지 기능 수정
- [ ] 오후: 테스트 및 검증
- [ ] 저녁: Git 커밋

---

**Task 2: 라우팅 분리 (Day 5-6)**
```typescript
// NewApp.tsx
import { AppProviders } from './AppProviders';
import { AppRoutes } from './AppRoutes';

function NewApp() {
  return (
    <AppProviders>
      <AppRoutes {...props} />
    </AppProviders>
  );
}
```

**검증**:
- [ ] 모든 라우트 정상 동작
- [ ] 레이아웃 깨짐 없음
- [ ] Provider 정상 작동

---

#### Week 2: 기능별 마이그레이션

**Task 3: 토스트/알림 (Day 8)**
```typescript
// 기존
const [toast, setToast] = useState(...);
const showToast = (...) => {...};

// 새로운 방식 (NewApp.tsx에만 적용)
import { useToast } from './hooks/useToast';
const { toast, showToast } = useToast();
```

**검증**: 토스트 10회 테스트

---

**Task 4: 비교함 기능 (Day 9)**
```typescript
import { useComparison } from './hooks/useComparison';
const { compareList, toggleCompare } = useComparison();
```

**검증**: 
- [ ] 비교함 추가
- [ ] 비교함 제거
- [ ] 최대 3개 제한

---

**Task 5: 예약 기능 (Day 10-11)**
```typescript
import { useReservations } from './hooks/useReservations';
```

**⚠️ 주의**: DB 연동 기능이므로 스테이징 환경에서 테스트

---

### 🔷 Phase 3: 테스트 및 검증 (Week 3)

#### Day 15-17: 종합 테스트
**테스트 시나리오**:
```bash
# 1. 개발 서버 테스트
VITE_USE_NEW_APP=true npm run dev

# 2. Cypress E2E 테스트
npx cypress run --spec "cypress/e2e/**/*.cy.ts"

# 3. Lighthouse 성능 테스트
npx lighthouse http://localhost:5173 --output=json
```

**체크리스트**:
| 기능 | 테스트 항목 | 결과 |
|------|-------------|------|
| 지도 | 마커 표시, 클릭, 이동 | ☐ |
| 검색 | 키워드, 필터, 정렬 | ☐ |
| 시설 | 상세정보, 리뷰, 예약 | ☐ |
| 인증 | 로그인, 로그아웃, 권한 | ☐ |
| 관리자 | 대시보드, 시설관리 | ☐ |
| 상조 | 업체조회, 비교, 상담 | ☐ |

---

#### Day 18-19: 버그 수정
- 발견된 버그 우선순위별 수정
- 수정 후 즉시 테스트
- Git 커밋: 버그별로 분리

---

### 🔷 Phase 4: 안전한 교체 (Week 4)

#### Day 20: 스테이징 배포
```bash
# 1. 스테이징 브랜치
git checkout -b staging/newapp

# 2. NewApp을 App으로 이름 변경
git mv App.tsx App.tsx.backup.final
git mv NewApp.tsx App.tsx

# 3. 빌드 및 배포
npm run build
# → 스테이징 서버에 배포
```

**24시간 모니터링**:
- [ ] 에러 로그 확인
- [ ] 사용자 피드백 수집
- [ ] 성능 지표 비교

---

#### Day 21-22: 프로덕션 교체
```bash
# 원클릭 교체 스크립트
#!/bin/bash
# deploy-newapp.sh

echo "🚀 NewApp 배포 시작..."

# 1. 백업
cp App.tsx App.tsx.rollback-$(date +%Y%m%d)

# 2. 교체
git checkout staging/newapp -- App.tsx

# 3. 빌드
npm run build

# 4. 모니터링 시작 (5분)
sleep 300

echo "✅ 배포 완료!"
echo "문제 발생 시: ./rollback.sh"
```

---

## 4. 롤백 전략

### 🚨 원클릭 롤백
```bash
# rollback.sh
#!/bin/bash
echo "⚠️  NewApp 롤백 시작..."

# 1. 원복
cp App.tsx App.tsx.failed-$(date +%Y%m%d)
cp App.tsx.legacy App.tsx

# 2. 빌드
npm run build

# 3. 검증
npx tsc --noEmit && echo "✅ 롤백 성공!"
```

**사용법**:
```bash
chmod +x rollback.sh
./rollback.sh
```

### 🔧 부분적 롤백 (특정 기능만)
```typescript
// config.ts에서 기능 비활성화
export const NEW_APP_FEATURES = {
  useNewHooks: false,      // ← 이것만 false로
  useNewToast: true,
  useNewComparison: true,
};
```

---

## 5. 위험 관리

### 위험도 평가
| 단계 | 위험도 | 영향 | 대응책 |
|------|--------|------|--------|
| **Phase 1** | 🟢 낮음 | 없음 | 백업만으로 충분 |
| **Phase 2** | 🟢 낮음 | NewApp만 | 기존 App은 안전 |
| **Phase 3** | 🟡 중간 | 테스트 환경 | 버그 수정 |
| **Phase 4** | 🟡 중간 | 프로덕션 | 원클릭 롤백 |

### 모니터링 지표
```typescript
// NewApp.tsx에 추가
useEffect(() => {
  // Sentry 또는 로깅
  console.log('[NewApp] Initialized');
  
  // 성능 측정
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      console.log(`[Performance] ${entry.name}: ${entry.duration}ms`);
    }
  });
  observer.observe({ entryTypes: ['measure'] });
}, []);
```

---

## 6. 일정 요약

### 총 4주 일정

```
Week 1: 준비 및 기본 구조
  Day 1-2: 환경 구축 (백업, Feature flag)
  Day 3-4: NewApp.tsx 정리
  Day 5-6: 라우팅 분리
  Day 7: 검증 및 커밋

Week 2: 기능별 마이그레이션
  Day 8: 토스트/알림
  Day 9: 비교함
  Day 10-11: 예약 기능
  Day 12-13: 사용자 역할
  Day 14: 중간 리뷰

Week 3: 테스트
  Day 15-17: 종합 테스트
  Day 18-19: 버그 수정
  Day 20-21: 문서화

Week 4: 배포
  Day 22-23: 스테이징 배포
  Day 24: 모니터링
  Day 25: 프로덕션 교체
  Day 26-28: 안정화
```

---

## 7. 성공 기준

### ✅ 기능적 성공
- [ ] 모든 페이지 정상 로드
- [ ] TypeScript 오류 0개
- [ ] 테스트 통과율 100%
- [ ] 기존 기능 100% 유지

### ✅ 성능적 성공
- [ ] 메인 번들 < 500KB
- [ ] FCP < 1.5s
- [ ] TTI < 2.5s
- [ ] Lighthouse 점수 80+

### ✅ 코드 품질
- [ ] NewApp.tsx < 500줄
- [ ] App.tsx 삭제 (또는 legacy로 이동)
- [ ] 순환 의존성 없음
- [ ] 테스트 커버리지 > 70%

---

## 8. 시작 가이드

### 🚀 바로 시작하기
```bash
# 1. 현재 디렉토리 확인
cd C:\Users\black\Desktop\memorimap

# 2. 백업 생성
cp App.tsx App.tsx.backup.parallel

# 3. NewApp.tsx 생성
cp App.tsx NewApp.tsx

# 4. Feature flag 파일 생성
# (config.ts 내용은 위 참고)

# 5. Git 커밋
git add .
git commit -m "Setup NewApp parallel development"

# 6. 개발 서버 실행
VITE_USE_NEW_APP=true npm run dev
```

---

## 9. 참고 자료

### 이미 생성된 파일
```
hooks/
├── useAppInitialization.ts    ← 사용자 초기화
├── useFacilityData.ts         ← 시설 데이터
└── useMapHandlers.ts          ← 지도 핸들러

lib/
└── logger.ts                  ← 로깅 유틸리티

AppProviders.tsx               ← Provider 설정
AppRoutes.tsx                  ← 라우트 정의
```

### 문서
- `NEWAPP_PARALLEL_PLAN.md` ← 이 문서
- `PHASE_3_SAFE_ROADMAP.md` ← 안전 전략
- `PHASE_3_WORK_LOG.md` ← 작업 로그

---

## 10. 결론 및 권장사항

### 핵심 메시지
✅ **"기존 App.tsx는 절대 건드리지 않는다"**  
✅ **"NewApp.tsx에서 자유롭게 개발한다"**  
✅ **"문제 발생 시 1분 내 롤백 가능"**

### 권장사항
1. **오늘 바로 시작**: 백업 → NewApp.tsx 생성 → Feature flag
2. **하루 1개 기능**: 너무 급하게 하지 말 것
3. **매일 Git 커밋**: 작은 단위로 자주 저장
4. **테스트 습관**: 수정 후 반드시 테스트

### 지원 필요 시
- TypeScript 오류 → `npx tsc --noEmit`
- 빌드 실패 → `npm run build` 에러 메시지 확인
- 롤백 필요 → `./rollback.sh` 실행

---

**시작하시겠습니까?**  
NewApp.tsx 생성부터 도와드리겠습니다!

---

**문서 정보**  
- **파일명**: NEWAPP_PARALLEL_PLAN.md  
- **위치**: `C:\Users\black\Desktop\memorimap\NEWAPP_PARALLEL_PLAN.md`  
- **작성자**: AI Assistant  
- **버전**: 1.0  
- **상태**: 승인 대기 중
