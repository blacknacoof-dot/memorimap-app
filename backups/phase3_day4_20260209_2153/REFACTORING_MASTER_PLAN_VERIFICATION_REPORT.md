# 종합 리팩토링 및 안정화 계획 검증 보고서

**문서명**: REFACTORING_MASTER_PLAN.md  
**검증일**: 2026-02-08  
**검증자**: OpenCode AI  
**대상 프로젝트**: Memorimap  

---

## 1. 개요 (Executive Summary)

본 보고서는 `REFACTORING_MASTER_PLAN.md` 문서를 종합적으로 검토하여 계획의 적절성, 실행 가능성, 위험 요소, 개선 사항을 분석한 것입니다.

**검증 결과 요약:**
- **종합 등급**: B+ (Good)
- **강점**: 명확한 우선순위, 현실적 일정 산정, 구체적 실행 항목
- **보완 필요**: 테스트 전략, 롤백 계획, 팀 협업 가이드

---

## 2. 계획 구조 분석

### 2.1 전체 구조

```
종합 리팩토링 및 안정화 계획
├── 📌 개요 (Overview)
├── 🥅 목표 (Goal) - 3가지
├── 🚧 작업 단계 (Phases) - 3단계
│   ├── Phase 1: 기반 다지기 (치명적 오류)
│   ├── Phase 2: 로직 강화 (중요 오류)
│   └── Phase 3: 코드 품질 향상 (마이너)
└── 📅 예상 일정 (Timeline)
```

### 2.2 목표 설정 평가

| 목표 | 적절성 | 코멘트 |
|------|--------|--------|
| **Runtime Stability** | ⭐⭐⭐⭐⭐ | 타입 안정성 100% 목표 명확 |
| **Security Hardening** | ⭐⭐⭐⭐ | 구체적 위협(SQL Injection, XSS) 언급 좋음 |
| **Data Integrity** | ⭐⭐⭐⭐⭐ | DB-UI 불일치 해결은 핵심 과제 |

**평가**: 3가지 목표가 중복되지 않고 상호 보완적입니다.

---

## 3. 상세 검증 결과

### 3.1 Phase 1: 기반 다지기 (치명적 오류 해결)

#### ✅ 강점

**1-1. 타입 정의 통합**
```markdown
- `types/index.ts`와 `types/db.ts`의 `Reservation`, `Favorite`, `User` 타입 충돌 해결
- 단일 진실 공급원(Single Source of Truth) 원칙 적용
```

**검증 의견**: 
- ⭐⭐⭐⭐⭐ 타입 충돌의 근본 원인 제시
- "단일 진실 공급원" 원칙 적용은 모범 사례
- 대상 파일 명시로 실행 용이성 확보

**1-2. 데이터 정합성 복구**
```markdown
- 슈퍼관리자: 존재하지 않는 `consultation_leads` 테이블 참조 로직을 `consultations`로 정상화
- 시설관리자: `Reservation` 타입 매핑 오류 수정
```

**검증 의견**:
- ⭐⭐⭐⭐⭐ 이전 검증 보고서에서 발견된 문제 직접 언급
- 구체적 테이블명 명시로 작업 범위 명확

**1-3. 보안 구멍 막기**
```markdown
- **Mock Logic 제거**: `userId.startsWith('mock-')` 로직을 환경 변수(`VITE_USE_MOCK`) 기반으로 분리
- **SQL Injection 방지**: `ilike` 검색 쿼리 검증 로직 추가
- **XSS 방지**: 채팅 및 공지사항 입력값에 `DOMPurify` 적용
```

**검증 의견**:
- ⭐⭐⭐⭐⭐ 구체적 솔루션(DOMPurify, 환경변수) 제시
- ⭐⭐⭐ 보완: XSS/SQL Injection **테스트 방법** 명시 필요

#### ⚠️ 개선 필요 사항

| 항목 | 문제 | 개선 제안 |
|------|------|-----------|
| **타입 통합 방식** | 어떤 파일을 기준으로 통합할지 미명시 | `types/index.ts`(UI) → `types/db.ts`(DB) 매퍼 함수 방식 명시 |
| **데이터 마이그레이션** | 타입 변경 시 기존 데이터 대응책 없음 | DB 마이그레이션 스크립트 작성 계획 추가 |
| **보안 검증** | 테스트 방법 부재 | `npm audit`, CodeQL, Burp Suite 등 검증 도구 명시 |

---

### 3.2 Phase 2: 로직 강화 (중요 오류 해결)

#### ✅ 강점

**2-1. 에러 핸들링 표준화**
```markdown
- 모든 비동기 요청(Async/Await)에 `try-catch` 적용
- 사용자에게 `alert()` 대신 `toast`로 부드러운 피드백 제공
- *대상*: `MyPageView.tsx`, `FacilityAdminView.tsx`, `favoriteService.ts`
```

**검증 의견**:
- ⭐⭐⭐⭐⭐ UX 개선 방향 명확
- 대상 파일 구체적 명시
- ⭐⭐⭐⭐ 보완: Error Boundary 도입 검토 추가

**2-2. Supabase Client 최적화**
```markdown
- `createAuthenticatedClient` 중복 생성 방지 (싱글톤 패턴 확립)
- Realtime Subscription 메모리 누수 방지 (Cleanup 함수 검증)
```

**검증 의견**:
- ⭐⭐⭐⭐⭐ 싱글톤 패턴 적용은 성능 향상에 필수
- ⭐⭐⭐⭐ 보완: Cleanup 검증 체크리스트 구체화

**2-3. 데이터 병합 로직 개선**
```markdown
- Legacy 상담 내역과 AI 상담 내역 병합 시 `any` 타입 제거
- 명시적 매퍼 함수(`mapAiToLegacy`) 구현
```

**검증 의견**:
- ⭐⭐⭐⭐⭐ `any` 타입 제거는 타입 안정성 확보의 핵심
- 매퍼 함수 명명 규칙 제시 좋음

#### ⚠️ 개선 필요 사항

| 항목 | 문제 | 개선 제안 |
|------|------|-----------|
| **에러 핸들링** | Global Error Handling 전략 부재 | ErrorBoundary 컴포넌트 도입 검토 |
| **싱글톤 패턴** | 구현 방법 미명시 | `lib/supabaseClient.ts` 수정 방향 구체화 |
| **데이터 병합** | 병합 기준(정렬, 중복 제거) 미정의 | 병합 알고리즘 명세서 작성 |

---

### 3.3 Phase 3: 코드 품질 향상 (마이너 이슈)

#### ✅ 강점

**3-1. Any 타입 제거**
```markdown
- `noImplicitAny` 준수를 목표로 주요 컴포넌트의 `any` 제거
```

**검증 의견**:
- ⭐⭐⭐⭐⭐ TypeScript strict mode 활성화 목표
- ⭐⭐⭐ 보완: 우선순위 파일 목록 추가 필요

**3-2. 코드 정리**
```markdown
- 사용하지 않는 import, 주석, `console.log` 정리
```

**검증 의견**:
- ⭐⭐⭐⭐⭐ 자동화 가능 (ESLint, Prettier)

**3-3. 컴포넌트 분리**
```markdown
- `MyPageView` 등 거대 컴포넌트를 기능별로 분할
```

**검증 의견**:
- ⭐⭐⭐⭐⭐ 625라인 컴포넌트 분리는 유지보수성 향상에 필수
- ⭐⭐⭐ 보완: 분리 기준(관심사 분리) 명시 필요

#### ⚠️ 개선 필요 사항

| 항목 | 문제 | 개선 제안 |
|------|------|-----------|
| **strict mode** | 활성화 방법 미명시 | `tsconfig.json` 수정 및 점진적 적용 전략 |
| **코드 정리** | 자동화 도구 활용 여부 미명시 | ESLint 규칙 추가, `husky` pre-commit 설정 |
| **컴포넌트 분리** | 분리 후 테스트 계획 없음 | Storybook 도입 또는 단위 테스트 작성 |

---

## 4. 일정 분석

### 4.1 예상 일정

```markdown
- **Phase 1 (Critical)**: 1~2일 (즉시 시작 권장)
- **Phase 2 (Major)**: 2~3일
- **Phase 3 (Minor)**: 1~2일 / 출시 후 진행 가능
```

### 4.2 일정 평가

| Phase | 산정 일정 | 현실성 | 리스크 |
|-------|-----------|--------|--------|
| **Phase 1** | 1~2일 | ⭐⭐⭐⭐⭐ | 타입 충돌 해결은 예상보다 오래 걸릴 수 있음 |
| **Phase 2** | 2~3일 | ⭐⭐⭐⭐ | 에러 핸들링 표준화는 테스트 시간 필요 |
| **Phase 3** | 1~2일 | ⭐⭐⭐⭐ | 출시 후 진행 가능하다는 판단 적절 |
| **총계** | 4~7일 | ⭐⭐⭐⭐ | 테스트 및 검증 시간 미포함은 리스크 |

**종합 평가**: 현실적이나 **버퍼(여유) 시간**이 없음

### 4.3 개선 제안

```markdown
## 📅 수정된 일정 (권장)
- **Phase 1 (Critical)**: 2~3일 (버퍼 포함)
- **Phase 2 (Major)**: 3~4일 (테스트 시간 포함)
- **Phase 3 (Minor)**: 2일 / 출시 후 진행 가능
- **총계**: 7~9일

## 🎯 마일스톤
- Day 1-2: Phase 1 완료 → Git 태그 `v1.0.0-critical`
- Day 3-5: Phase 2 완료 → Git 태그 `v1.0.0-major`
- Day 6-7: Phase 3 완료 → Git 태그 `v1.0.0-refactored`
```

---

## 5. 위험 요소 분석

### 5.1 식별된 위험

| 위험 ID | 위험 내용 | 심각도 | 발생 가능성 | 대응책 |
|---------|-----------|--------|-------------|--------|
| **R-01** | 타입 통합 중 예상치 못한 사이드 이펙트 | 🔴 높음 | 중간 | 단계별 적용, 롤백 지점 설정 |
| **R-02** | Mock 데이터 의존 기능 동작 불가 | 🟠 중간 | 높음 | 환경 변수 기반 점진적 전환 |
| **R-03** | Realtime Subscription 수정 시 실시간 기능 장애 | 🔴 높음 | 중간 | 실시간 모니터링, 롤백 준비 |
| **R-04** | 개발 일정 지연으로 출시 영향 | 🟠 중간 | 높음 | Phase 3 출시 후 진행 가능성 확보 |
| **R-05** | 팀원 간 작업 충돌 | 🟡 낮음 | 중간 | Git 브랜치 전략 수립 |

### 5.2 위험 관리 제안

```markdown
## 🛡️ 위험 완화 전략

### 타입 통합 (R-01)
- [ ] 각 타입 변경 후 단위 테스트 실행
- [ ] TypeScript strict mode 점진적 활성화
- [ ] Git 커밋 단위: 타입별 분리

### Mock 데이터 (R-02)
- [ ] 개발/스테이징 환경에서 Mock 유지
- [ ] 프로덕션 환경에서만 Mock 제거
- [ ] Feature Flag 패턴 적용 검토

### 실시간 기능 (R-03)
- [ ] WebSocket 연결 모니터링 로그 추가
- [ ] 장애 발생 시 폴링 모드 fallback 준비
- [ ] 부하 테스트: 1000+ 동시 연결
```

---

## 6. 테스트 전략 부재 (Critical Gap)

### 6.1 현재 상태
- 테스트 계획 **완전히 부재**
- CI/CD 파이프라인 언급 없음
- 품질 게이트(Quality Gate) 정의 없음

### 6.2 추가 필요 항목

```markdown
## 🧪 테스트 계획 (추가 필요)

### 단위 테스트 (Unit Test)
- **도구**: Jest + React Testing Library
- **대상**: 
  - 타입 매퍼 함수
  - 데이터 병합 로직
  - 유틸리티 함수
- **목표**: 커버리지 80% 이상

### 통합 테스트 (Integration Test)
- **도구**: Jest + MSW (Mock Service Worker)
- **대상**:
  - Supabase Client 연동
  - Realtime Subscription
  - 데이터 Fetch 로직
- **목표**: 주요 API 흐름 검증

### E2E 테스트
- **도구**: Playwright 또는 Cypress
- **대상**:
  - 로그인 → 예약 → 취소 플로우
  - 관리자 대시보드 CRUD
  - 실시간 채팅
- **목표**: 핵심 유저 시나리오 100% 커버

### 보안 테스트
- **도구**: 
  - `npm audit` (의존성 취약점)
  - CodeQL (정적 분석)
  - OWASP ZAP (동적 분석)
- **목표**: Critical/High 취약점 0개

### 성능 테스트
- **도구**: Lighthouse, WebPageTest
- **대상**:
  - 초기 로딩 시간 < 3초
  - 번들 크기 < 500KB (gzipped)
  - Time to Interactive < 5초
```

---

## 7. 롤백 및 복구 전략 부재 (Critical Gap)

### 7.1 현재 상태
- 롤백 계획 **완전히 부재**
- 장애 발생 시 대응책 미정의

### 7.2 추가 필요 항목

```markdown
## 🔄 롤백 전략 (추가 필요)

### Git 기반 롤백
```bash
# Phase 1 완료 후 태그 생성
git tag -a v1.0.0-phase1 -m "Phase 1: Critical fixes complete"

# 문제 발생 시 롤백
git revert HEAD~3..HEAD  # 최근 3개 커밋 되돌리기
# 또는
git checkout v1.0.0-phase1  # 안정 버전으로 복귀
```

### DB 롤백
- 각 마이그레이션마다 DOWN 스크립트 작성
- Supabase PITR(Point-in-Time Recovery) 활성화
- 백업 자동화 (매일 00:00 UTC)

### Feature Flag
- 긴급 시 기능 비활성화 가능하도록 구현
- 예: `VITE_ENABLE_REALTIME=false`로 실시간 기능 OFF
```

---

## 8. 팀 협업 가이드 부재

### 8.1 현재 상태
- 코드 리뷰 체크리스트 없음
- Git 브랜치 전략 없음
- 커밋 메시지 컨벤션 없음

### 8.2 추가 필요 항목

```markdown
## 👥 협업 가이드 (추가 필요)

### Git 브랜치 전략
```
main (production)
  └── develop
       ├── feature/refactoring-types
       ├── feature/refactoring-error-handling
       └── feature/refactoring-security
```

### 코드 리뷰 체크리스트
- [ ] 타입 에러 0개 (`npm run type-check`)
- [ ] Lint 에러 0개 (`npm run lint`)
- [ ] 불필요한 `console.log` 제거
- [ ] `any` 타입 미사용
- [ ] 테스트 통과 (`npm test`)
- [ ] 보안 취약점 없음 (`npm audit`)

### 커밋 메시지 컨벤션
```
[REFACTOR] 타입 정의 통합 - Reservation 타입
[SECURITY] Mock 로직 제거 및 환경변수 분리
[FIX] 에러 핸들링 표준화 - MyPageView
[PERF] Supabase Client 싱글톤 패턴 적용
```
```

---

## 9. 종합 평가 및 권고사항

### 9.1 점수별 평가

| 평가 항목 | 점수 (5점 만점) | 등급 | 코멘트 |
|-----------|-----------------|------|--------|
| **우선순위 설정** | 5.0 | A+ | Critical → Major → Minor 명확 |
| **구체성** | 4.0 | A | 파일명 언급 좋으나 세부 전략 부족 |
| **실행 가능성** | 4.5 | A | 현실적 일정 산정 |
| **완성도** | 3.0 | B | 테스트/롤백/협업 부분 부재 |
| **위험 관리** | 2.5 | C | 위험 분석 및 대응책 미흡 |
| **문서화** | 3.5 | B | 참고문서 링크 부재 |

### 9.2 종합 등급

**B+ (Good)**
- 핵심 목표와 작업 항목은 잘 정의됨
- 실행 가능한 일정 산정
- ⚠️ 테스트, 롤백, 협업 가이드 보완 필요

### 9.3 실행 권고사항

#### 즉시 실행 (P0)
```markdown
1. 테스트 계획 수립
2. 롤백 전략 정의
3. Git 브랜치 전략 수립
4. Phase 1 시작
```

#### 단기 보완 (P1)
```markdown
1. 데이터 마이그레이션 스크립트 작성
2. 보안 검증 도구 설정 (CodeQL)
3. CI/CD 파이프라인 검증 단계 추가
4. 코드 리뷰 체크리스트 작성
```

#### 장기 개선 (P2)
```markdown
1. E2E 테스트 작성 (Playwright)
2. Storybook 도입 (컴포넌트 문서화)
3. 성능 모니터링 도구 도입
4. 기술 부채 대시보드 구축
```

---

## 10. 수정된 마스터 플랜 (권고)

```markdown
# 종합 리팩토링 및 안정화 계획 (Comprehensive Refactoring Plan) v1.1

## 🥅 목표 (Goal)
1. **Runtime Stability**: 타입 불일치로 인한 앱 크래시 원천 봉쇄 (Type Safety 100%)
2. **Security Hardening**: SQL Injection, XSS, Mock 데이터 노출 등 보안 구멍 제거
3. **Data Integrity**: DB와 UI 간 데이터 불일치 및 중복 정의 제거

## 🚧 작업 단계 (Phases)

### Phase 0: 준비 (Preparation) - 🆕 신규 추가
**목표**: 안전한 리팩토링을 위한 기반 조성

1. **백업 및 롤백 준비**
   - [ ] Supabase PITR 활성화 확인
   - [ ] Git 태그 생성: `git tag v0.9.9-stable`
   - [ ] 롤백 스크립트 작성

2. **테스트 환경 구축**
   - [ ] Jest + React Testing Library 설정
   - [ ] CI/CD 파이프라인에 테스트 단계 추가
   - [ ] 보안 스캔 도구 설정 (CodeQL)

3. **Git 브랜치 전략 수립**
   ```
   feature/refactoring-phase1
   feature/refactoring-phase2
   feature/refactoring-phase3
   ```

### Phase 1: 기반 다지기 (치명적 오류 해결) - 🚨 최우선
**목표**: 앱이 "절대 죽지 않는" 상태 만들기
**일정**: 2~3일 (버퍼 포함)

1. **타입 정의 통합 (Type Unification)**
   - `types/index.ts`(UI 타입)와 `types/db.ts`(DB 타입) 통합
   - **전략**: `types/db.ts`를 기준으로 매퍼 함수 작성
   - **검증**: `npm run type-check` 에러 0개
   - *대상 파일*: `types/index.ts`, `types/db.ts`, `types/favorites.ts`
   - *예상 소요시간*: 4~6시간

2. **데이터 정합성 복구 (Dashboard Fixes)**
   - 슈퍼관리자: `consultation_leads` → `consultations` 마이그레이션
   - 시설관리자: `Reservation` 타입 매핑 오류 수정
   - **검증**: 대시보드 데이터 표시 정상화 확인
   - *대상 파일*: `lib/api/superAdmin.ts`, `hooks/useFacilityAdmin.ts`
   - *예상 소요시간*: 3~4시간

3. **보안 구멍 막기 (Security)**
   - **Mock Logic 제거**: `VITE_USE_MOCK=true` 환경변수 기반 개발환경 분리
   - **SQL Injection 방지**: `ilike` 검색 쿼리 파라미터 검증 추가
   - **XSS 방지**: `DOMPurify` 적용 및 CSP 헤더 설정
   - **검증**: `npm audit` Critical/High 취약점 0개
   - *대상 파일*: `services/favoriteService.ts`, `lib/api/superAdmin.ts`
   - *예상 소요시간*: 4~6시간

**Phase 1 완료 기준 (Definition of Done)**:
- [ ] TypeScript 컴파일 에러 0개
- [ ] `npm run build` 성공
- [ ] 주요 기능 수동 테스트 통과
- [ ] Git 태그: `v1.0.0-phase1`

### Phase 2: 로직 강화 (중요 오류 해결)
**목표**: 사용자 경험(UX)을 해치는 버그 및 예외 상황 처리
**일정**: 3~4일 (테스트 시간 포함)

1. **에러 핸들링 표준화 (Error Handling)**
   - 모든 비동기 요청에 `try-catch` 적용
   - `alert()` → `toast` 마이그레이션
   - Global ErrorBoundary 도입
   - **검증**: E2E 테스트 에러 시나리오 커버리지 100%
   - *대상 파일*: `MyPageView.tsx`, `FacilityAdminView.tsx`, `favoriteService.ts`
   - *예상 소요시간*: 6~8시간

2. **Supabase Client 최적화**
   - `createAuthenticatedClient` 싱글톤 패턴 확립
   - Realtime Subscription cleanup 검증
   - **검증**: 메모리 프로파일링 누수 0개
   - *대상 파일*: `lib/supabaseClient.ts`
   - *예상 소요시간*: 4~6시간

3. **데이터 병합 로직 개선 (Consultations)**
   - `any` 타입 제거
   - `mapAiToLegacy()` 매퍼 함수 구현
   - **검증**: 단위 테스트 커버리지 90% 이상
   - *대상 파일*: `components/dashboard/MyConsultations.tsx`
   - *예상 소요시간*: 4~6시간

**Phase 2 완료 기준**:
- [ ] E2E 테스트 주요 시나리오 통과
- [ ] 에러 피드백 UI 일관성 확인
- [ ] 메모리 누수 테스트 통과
- [ ] Git 태그: `v1.0.0-phase2`

### Phase 3: 코드 품질 향상 (마이너 이슈)
**목표**: 유지보수하기 좋은 깔끔한 코드
**일정**: 2일 / 출시 후 진행 가능

1. **Any 타입 제거**
   - `noImplicitAny` 활성화
   - 우선순위: 컴포넌트 Props → API 응답 → 내부 로직
   - **검증**: `any` 사용 빈도 0개

2. **코드 정리**
   - 사용하지 않는 import, 주석, `console.log` 제거
   - ESLint 규칙 강화
   - **검증**: `npm run lint` warning 0개

3. **컴포넌트 분리**
   - `MyPageView` → 5개 이하 컴포넌트로 분할
   - Storybook 문서화
   - **검증**: 순환 의존성 없음, 단위 테스트 용이

**Phase 3 완료 기준**:
- [ ] Code Review 완료
- [ ] 기술 문서 업데이트
- [ ] Git 태그: `v1.0.0-refactored`

## 📅 예상 일정 (Timeline)
- **Phase 0 (준비)**: 1일
- **Phase 1 (Critical)**: 2~3일
- **Phase 2 (Major)**: 3~4일
- **Phase 3 (Minor)**: 2일 / 출시 후 진행 가능
- **총계**: 8~10일 (버 포함)

## 🧪 테스트 계획 (Test Plan)
### 단위 테스트
- **도구**: Jest + React Testing Library
- **목표**: 커버리지 80% 이상

### 통합 테스트
- **도구**: MSW (Mock Service Worker)
- **대상**: Supabase 연동, Realtime 기능

### E2E 테스트
- **도구**: Playwright
- **대상**: 로그인 → 예약 → 취소 플로우

### 보안 테스트
- **도구**: npm audit, CodeQL
- **목표**: Critical/High 취약점 0개

## 🔄 롤백 전략 (Rollback Strategy)
### Git 기반 롤백
```bash
# 안정 버전으로 복귀
git checkout v0.9.9-stable
```

### DB 롤백
- Supabase PITR 활용
- 마이그레이션 DOWN 스크립트 준비

### Feature Flag
- 긴급 시 `VITE_ENABLE_REALTIME=false`로 기능 OFF

## 👥 협업 가이드 (Collaboration)
### 코드 리뷰 체크리스트
- [ ] 타입 에러 0개
- [ ] Lint 에러 0개
- [ ] 테스트 통과
- [ ] 보안 취약점 없음

### 커밋 메시지 컨벤션
```
[REFACTOR] 타입 정의 통합
[SECURITY] Mock 로직 제거
[FIX] 에러 핸들링 표준화
[PERF] 싱글톤 패턴 적용
```

## 🎯 성공 기준 (Success Criteria)
1. TypeScript 컴파일 에러 0개
2. `any` 타입 사용 0개
3. 보안 취약점 Critical/High 0개
4. E2E 테스트 통과율 100%
5. 코드 리뷰 승인 2인 이상
```

---

## 11. 결론

`REFACTORING_MASTER_PLAN.md`는 **핵심 목표와 작업 항목이 잘 정의된 우수한 계획**입니다. 그러나 **테스트 전략, 롤백 계획, 팀 협업 가이드**가 부재하여 실제 실행 시 위험이 존재합니다.

**즉시 보완이 필요한 항목:**
1. ✅ Phase 0 (준비 단계) 추가
2. ✅ 테스트 계획 수립
3. ✅ 롤백 전략 정의
4. ✅ Git 브랜치 전략 수립

**권장 실행 순서:**
1. Phase 0 완료 (준비)
2. Phase 1-3 (보안) 먼저 실행
3. Phase 1-1, 1-2 (타입/데이터) 순차 실행
4. Phase 2, 3 진행

**최종 평가**: B+ (Good) → A (Excellent) 도달 가능 (보완 시)

---

**검증 완료**: 2026-02-08  
**보고서 버전**: v1.0  
**다음 검토 예정**: Phase 1 완료 후
