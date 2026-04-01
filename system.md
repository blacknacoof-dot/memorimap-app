# SYSTEM.md - Type Safety & Integrity Rules

> **[IMPORTANT]**
> 본 문서는 프로젝트의 **타입 안정성(Type Safety)**과 **데이터 무결성(Data Integrity)**을 보장하기 위한 **절대적인 시스템 규칙**입니다.
> 모든 개발자 및 AI 어시스턴트는 코드를 작성하거나 수정할 때 반드시 아래 규칙을 준수해야 합니다.

---

## 1. 데이터베이스 스키마 레벨 규칙

### 규칙 1: 모든 ID 필드는 UUID 타입으로 강제
- 테이블 생성 시 모든 ID 필드(`id`, `user_id`, `clerk_id`, `facility_id` 등)는 반드시 **UUID** 타입이어야 한다.
- `TEXT` 타입의 ID 사용은 절대 금지한다.
- 기존 `TEXT` 타입 컬럼은 `UUID`로 마이그레이션해야 한다.

### 규칙 2: 외래키 제약조건으로 타입 일관성 강제
- 모든 관계형 데이터는 반드시 **Foreign Key(외래키)**로 명시적 선언해야 한다.
- 외래키 제약조건을 통해 올바르지 않은 타입의 데이터 삽입을 원천 차단한다.

### 규칙 3: 도메인 타입 정의 및 재사용
- 프로젝트 전용 도메인 타입(`user_id_type`, `clerk_id_type` 등)을 정의하여 사용한다.
- 모든 테이블에서 동일한 도메인 타입을 사용하여 일관성을 유지한다.

### 규칙 4: 타입 검증 CHECK 제약조건 추가
- 모든 ID 필드에 대해 **UUID 형식 정규식**(`^[0-9a-f]{8}-...`)을 검증하는 `CHECK` 제약조건을 추가한다.

---

## 2. RLS 정책 작성 규칙

### 규칙 5: 정책에서 타입 캐스팅 금지
- RLS 정책 조건절에서 불필요한 타입 캐스팅(`::text`, `::uuid`)을 지양한다.
- 비교 대상 컬럼끼리는 반드시 **동일한 타입**이어야 한다.

### 규칙 6: JWT 클레임 추출 시 타입 명시
- `auth.jwt() ->> 'sub'` (TEXT 반환) 사용 시, 반드시 `::uuid`로 **명시적 형변환** 후 비교한다.
- `auth.uid()` (UUID 반환)와 비교할 때는 대상 컬럼도 UUID여야 한다.

### 규칙 7: RLS 정책 변경 시 타입 검증 필수
- 정책 생성/수정 전, `information_schema`를 조회하여 대상 컬럼의 실제 타입을 확인한다.
- 확인된 타입과 정책 조건의 타입이 일치하는지 검증 후 적용한다.

---

## 3. 개발 워크플로우 규칙

### 규칙 8: 스키마 변경 시 타입 영향도 분석 필수
- 스키마 변경 시, 영향받는 RLS 정책, 외래키, 트리거, 애플리케이션 코드를 전수 조사한다.
- 타입 변경이 필요한 경우 마이그레이션 스크립트를 작성한다.

### 규칙 9: 마이그레이션 스크립트에 타입 검증 포함
- 모든 마이그레이션 스크립트 시작 부분에 `IF` 문을 사용하여 대상 컬럼의 타입을 검증하는 방어 로직을 포함한다.
- 타입 불일치 시 마이그레이션을 중단(`RAISE EXCEPTION`)한다.

### 규칙 10: 환경별 타입 검증 스크립트 실행
- 배포 전 모든 환경(Local, Staging, Prod)에서 타입 검증 스크립트(`scripts/verify-types.sh`)를 실행한다.

---

## 4. 코드 리뷰 규칙

### 규칙 11: RLS 정책 코드 리뷰 필수 체크리스트
- 정책 조건에 숨겨진 타입 캐스팅이 없는지 확인한다.
- 비교 대상 컬럼의 실제 타입과 `auth.uid()`의 타입 일치 여부를 확인한다.

### 규칙 12: 스키마 변경 시 2인 승인 필수
- 스키마 변경, 특히 타입 변경 시에는 반드시 **2명 이상의 리뷰어**(동료 개발자 + DBA/보안 담당자)의 승인을 받아야 한다.

---

## 5. CI/CD 파이프라인 규칙

### 규칙 13: PR 생성 시 자동 타입 검증
- PR 생성 시 GitHub Actions 등 CI 도구를 통해 자동으로 스키마 및 RLS 정책의 타입 일치 여부를 검증한다.

### 규칙 14: 배포 전 스테이징 환경 타입 검증
- 프로덕션 배포 전, 스테이징 환경에서 타입 검증 스크립트를 실행하여 정합성을 최종 확인한다.

---

## 6. 모니터링 및 알림 규칙

### 규칙 15: 타입 불일치 에러 모니터링 설정
- DB 레벨에서 타입 불일치 에러 발생 시 별도 로그 테이블(`type_mismatch_logs`)에 기록한다.

### 규칙 16: 정기적 타입 일관성 검사
- `pg_cron` 등을 사용하여 매일 정기적으로 타입 일관성을 검사하고, 위반 사항 발생 시 알림을 보낸다.

---

## 7. 문서화 규칙

### 규칙 17: 타입 규칙 문서 필수 작성 및 갱신
- 본 `SYSTEM.md` (또는 `TYPE_RULES.md`)를 항상 최신 상태로 유지한다.
- ID 필드 표준, 인증 관련 타입 규칙, 테이블별 타입 정의를 명시한다.

### 규칙 18: API 문서에 타입 명시
- TypeScript 인터페이스 및 Zod 스키마 정의 시, 모든 ID 필드가 **UUID**임을 명시하고 검증 로직을 포함한다. (`z.string().uuid()`)

---

## 8. 팀 협업 규칙

### 규칙 19: 타입 규칙 위반 시 즉시 롤백
- 배포 후 타입 불일치가 감지되면 즉시 이전 버전으로 롤백하고 원인을 분석한다.

### 규칙 20: 타입 규칙 교육 및 온보딩
- 신규 입사자 및 프로젝트 참여자에게 본 `SYSTEM.md` 내용을 필수적으로 교육한다.

---

## 9. 코드 수정 안전 규칙 (2026-02-08 추가)

> **[CRITICAL]**
> 본 규칙은 2026-02-08 대규모 파일 손상 사고를 계기로 추가되었습니다.
> AI 어시스턴트 및 모든 개발자는 코드 수정 시 **반드시** 준수해야 합니다.

### 규칙 21: 작업 전 Git 커밋 필수
```bash
# 작업 전 반드시 현재 상태 커밋
git add .
git commit -m "Phase N 작업 전 백업 - [작업 내용]"
```
- 대규모 수정 작업 전에는 **반드시** Git 커밋으로 복구 지점을 생성한다.
- 커밋 메시지에 작업 내용을 명확히 기록한다.

### 규칙 22: 한 파일씩 순차 처리
- **병렬 수정 금지**: 여러 파일을 동시에 수정하지 않는다.
- **순차 검증**: 파일 A 수정 → 빌드 확인 → 파일 B 수정 → 빌드 확인
- **최대 동시 수정**: 한 번에 최대 2개 파일까지만 수정한다.

### 규칙 23: 즉시 빌드 검증
```bash
# 수정 후 즉시 TypeScript 빌드 확인
npx tsc --noEmit
```
- 파일 수정 후 **즉시** TypeScript 컴파일러로 에러 확인한다.
- 에러 발생 시 다음 파일로 넘어가지 않고 즉시 수정한다.
- 한글 문자 깨짐, 인코딩 문제를 조기에 발견한다.

### 규칙 24: 절대 금지 사항
❌ **한글 포함 파일 병렬 multi_replace 금지**
- 한글이 포함된 `.tsx`, `.ts` 파일은 **절대** 병렬로 `multi_replace_file_content` 실행 금지
- 인코딩 손상 위험으로 인해 한 번에 하나씩만 처리

❌ **3개 이상 파일 동시 수정 금지**
- 한 턴에 3개 이상의 파일을 동시에 수정하지 않는다.
- 에러 발생 시 추적이 어렵고 복구가 복잡해진다.

❌ **Template Literal 공백 유지 필수**
```typescript
// ❌ 잘못된 예 (공백 추가됨)
className={`p - 4 cursor - pointer`}

// ✅ 올바른 예
className={`p-4 cursor-pointer`}
```
- Template literal 내부 표현식 `${}`에 불필요한 공백을 추가하지 않는다.

### 규칙 25: 파일 손상 시 즉시 복구
```bash
# Git으로 손상된 파일 되돌리기
git checkout HEAD -- [손상된파일.tsx]

# 또는 최근 커밋으로 전체 되돌리기
git reset --hard HEAD
```
- 파일 손상이 감지되면 **즉시** Git으로 복구한다.
- 수동 복구 시도는 시간이 오래 걸리므로 Git reset을 우선한다.

### 규칙 26: 수정 작업 체크리스트
**모든 코드 수정 작업 시 아래 체크리스트를 따른다:**

- [ ] 1. Git 커밋 완료
- [ ] 2. 수정할 파일 1-2개만 선정
- [ ] 3. 한글 포함 여부 확인
- [ ] 4. 파일 수정 실행
- [ ] 5. `npx tsc --noEmit` 실행
- [ ] 6. 에러 없으면 다음 파일, 에러 있으면 즉시 수정
- [ ] 7. 모든 파일 완료 후 최종 빌드 확인
- [ ] 8. 문제 없으면 Git 커밋

---

## 사고 기록

### 2026-02-08: 대규모 파일 손상 사고
**원인**: `multi_replace_file_content`로 한글 포함 파일 6개 병렬 수정
**피해**: App.tsx (28 errors), LiveConsultation.tsx (100+ errors), PartnerManagement.tsx 등
**복구**: Git reset + 수동 template literal 수정
**교훈**: 규칙 21-26 제정

---

**마지막 업데이트**: 2026-02-08
**버전**: 2.0 (코드 수정 안전 규칙 추가)

## Deployment Unification Rule
- Production deployment must target the single existing Vercel project: `memorimap-app`.
- Do not deploy from an unlinked worktree or any directory that can implicitly create a new Vercel project.
- Before any `vercel --prod`, verify `.vercel/project.json` points to `memorimap-app` and the expected `projectId`.
- If a worktree is used for release verification, link that worktree to the same Vercel project before deployment.
- Production deploy is allowed only from `main` or an explicitly approved release branch.
- Never deploy from a dirty workspace.
- After deployment, always verify the alias with `vercel inspect https://memorimap.kr`.
- Deployment is not complete until `memorimap.kr` points to the intended new production deployment.
