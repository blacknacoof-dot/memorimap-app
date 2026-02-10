# Supabase 보안 강화 구현계획 검증 보고서

**문서 버전:** 1.0  
**작성일:** 2026-02-08  
**대상:** docs/security_hardening/implementation_plan.md

---

## 1. 개요

본 보고서는 Supabase PostGIS 격리 및 보안 강화 구현계획의 타당성을 검증하고, 향후 타입 불일치 등의 기술적 문제가 발생하지 않도록 예방 방안을 제시합니다.

---

## 2. 구현계획 검증 결과

### 2.1 Phase 1: 사전 점검 (Inspection) ✅

**검증 항목:**
- PostGIS 객체 위치 확인 쿼리는 표준 SQL로 작성됨
- `pg_class`, `pg_namespace`, `pg_extension` 시스템 테이블 접근은 안전함

**위험도:** 낮음  
**권고사항:** 쿼리는 읽기 전용이므로 안전함

---

### 2.2 Phase 2: PostGIS 시스템 예외 처리 ⚠️

**검증 항목:**
- `spatial_ref_sys` 테이블 RLS 활성화는 슈퍼유저 권한 필요
- `service_role`로는 실행 불가 (Must be owner 오류)

**위험도:** 중간  
**권고사항:** 
- Supabase Dashboard SQL Editor에서 슈퍼유저 권한으로 실행 필요
- 실행 권한이 없는 경우 "안전한 예외"로 관리하는 방안 수용

---

### 2.3 Phase 3: Profiles 테이블 RLS 정상화 ✅

**검증 항목:**
- 콘솔 42501 에러 해결을 위한 정책 보강 완료

**위험도:** 낮음  
**권고사항:** Phase 7에서 더 강화된 정책으로 대첵됨

---

### 2.4 Phase 4: 백업 스키마 봉인 ✅

**검증 항목:**
- `backup` 스키마 권한 완전 박탈
- `VOID_TO_DELETE__policy_backup` 테이블 정책 제거

**위험도:** 낮음  
**권고사항:** 실수로 데이터 손실되지 않도록 주의

---

### 2.5 Phase 5: 허용적 RLS 정책 강화 ⚠️

**검증 항목:**
- `partner_conversations`, `partner_inquiries` INSERT 정책 강화
- `subscription_payments` 복합 체크 로직
- `user_notifications` SELECT/UPDATE 분리

**타입 불일치 위험:**
```sql
-- 위험 패턴: UUID와 TEXT 혼합
auth.uid()::text = user_id::text
```

**위험도:** 높음  
**권고사항:** 데이터 타입 통일 필요 (하단 3.1 참조)

---

### 2.6 Phase 7: Genius Profile Sync Fix ⚠️

**검증 항목:**
- 스키마 캐시 갱신: `NOTIFY pgrst, 'reload schema'`
- 406, 401, 42501 에러 해결을 위한 종합 정책

**타입 불일치 위험:**
```sql
-- 위험 패턴 1: JWT sub 추출
clerk_id = (select auth.jwt() ->> 'sub')

-- 위험 패턴 2: UUID-TEXT 변환
clerk_id = (select auth.uid())::text
```

**위험도:** 높음  
**권고사항:** 
- `clerk_id` 필드 타입 확인 필요 (UUID vs TEXT)
- JWT sub 클레임 타입 확인 필요

---

### 2.7 Phase 8: 최종 클린업 ✅

**검증 항목:**
- 임시 테이블 삭제

**위험도:** 낮음  
**권고사항:** 백업 테이블 내용 확인 후 삭제

---

## 3. 타입 불일치 예방 방안

### 3.1 데이터 타입 표준화

**문제:** 현재 계획에서 `auth.uid()::text` 변환과 `clerk_id` 비교가 빈번히 사용됨

**해결 방안:**

#### 방안 A: 모든 ID 필드를 UUID 타입으로 통일 (권장)

```sql
-- 1. 기존 TEXT 타입을 UUID로 마이그레이션
ALTER TABLE public.profiles 
  ALTER COLUMN clerk_id TYPE UUID 
  USING clerk_id::UUID;

ALTER TABLE public.partner_conversations 
  ALTER COLUMN user_id TYPE UUID 
  USING user_id::UUID;

ALTER TABLE public.partner_conversations 
  ALTER COLUMN partner_id TYPE UUID 
  USING partner_id::UUID;

-- 2. 타입 변환 없이 직접 비교
CREATE POLICY "Users can insert their own conversations" 
ON public.partner_conversations FOR INSERT 
WITH CHECK (auth.uid() = user_id OR auth.uid() = partner_id);
```

#### 방안 B: TEXT 타입 유지하되 변환 로직 일관성 확보

```sql
-- 모든 비교에서 동일한 방식 사용
-- auth.uid()는 항상 ::text로 변환
-- JWT sub는 항상 TEXT로 처리

CREATE POLICY "Consistent type comparison" 
ON public.profiles FOR INSERT 
WITH CHECK (
  clerk_id::text = (select auth.uid())::text
  OR clerk_id::text = (select auth.jwt() ->> 'sub')
);
```

### 3.2 JWT 클레임 타입 검증

**문제:** `auth.jwt() ->> 'sub'`의 반환 타입이 명확하지 않음

**해결 방안:**

```sql
-- JWT 클레임 타입 확인 쿼리
SELECT 
  pg_typeof(auth.jwt() ->> 'sub') as sub_type,
  pg_typeof(auth.uid()) as uid_type;

-- 결과에 따라 적절한 캐스팅 적용
-- TEXT인 경우: auth.jwt() ->> 'sub'
-- UUID인 경우: (auth.jwt() ->> 'sub')::UUID
```

### 3.3 타입 검증 트리거

**문제:** 런타임에 잘못된 타입의 데이터 삽입 방지

**해결 방안:**

```sql
-- profiles 테이블 타입 검증 트리거
CREATE OR REPLACE FUNCTION validate_profile_types()
RETURNS TRIGGER AS $$
BEGIN
  -- clerk_id가 UUID 형식인지 확인
  IF NEW.clerk_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RAISE EXCEPTION 'clerk_id must be a valid UUID: %', NEW.clerk_id;
  END IF;
  
  -- user_id가 UUID 형식인지 확인 (해당되는 경우)
  IF NEW.user_id IS NOT NULL AND 
     NEW.user_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RAISE EXCEPTION 'user_id must be a valid UUID: %', NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_profile_types_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION validate_profile_types();
```

### 3.4 스키마 문서화 및 타입 매핑

**문제:** 개발자간 타입 불일치로 인한 혼란

**해결 방안:**

```markdown
## 타입 규칙 문서 (TYPE_RULES.md)

### ID 필드 타입 규칙
- 모든 사용자 ID: UUID
- Clerk ID: UUID  
- Partner ID: UUID
- Facility ID: UUID
- Subscription ID: UUID

### 인증 관련 타입
- auth.uid(): UUID 반환
- auth.jwt() ->> 'sub': TEXT 반환 (Clerk JWT)
- 변환 필요 시: (auth.jwt() ->> 'sub')::UUID

### 정책 작성 규칙
- 비교 대상 필드와 동일한 타입 사용
- 불확실한 경우 ::text 변환으로 통일
```

### 3.5 CI/CD 타입 검증

**문제:** 배포 전 타입 불일치 감지 실패

**해결 방안:**

```yaml
# .github/workflows/type-check.yml
name: Database Type Check

on: [push, pull_request]

jobs:
  type-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run Supabase Type Check
        run: |
          supabase db lint --schema public
          supabase db typecheck
          
      - name: Validate RLS Policies
        run: |
          psql $DATABASE_URL -f scripts/validate_policies.sql
```

```sql
-- scripts/validate_policies.sql
-- 정책 타입 불일치 검증 쿼리
SELECT 
  schemaname,
  tablename,
  policyname,
  CASE 
    WHEN qual LIKE '%::text%' OR with_check LIKE '%::text%' THEN 'WARNING: Type casting detected'
    ELSE 'OK'
  END as type_check_status
FROM pg_policies
WHERE schemaname = 'public';
```

---

## 4. 타입 불일치 방지 시스템 규칙

앞으로 타입 불일치가 발생하지 않도록 시스템에 반드시 적용해야 할 규칙들입니다.

### 4.1 데이터베이스 스키마 레벨 규칙

#### 규칙 1: 모든 ID 필드는 UUID 타입으로 강제
```sql
-- 규칙: 테이블 생성 시 모든 ID 필드는 UUID로 선언
CREATE TABLE public.example_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,  -- TEXT 절대 금지
  clerk_id UUID NOT NULL, -- TEXT 절대 금지
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 규칙: 기존 TEXT 타입 컬럼 즉시 마이그레이션
ALTER TABLE public.profiles 
  ALTER COLUMN clerk_id TYPE UUID 
  USING NULLIF(clerk_id, '')::UUID;
```

#### 규칙 2: 외래키 제약조건으로 타입 일관성 강제
```sql
-- 규칙: 모든 관계는 외래키로 명시적 선언
ALTER TABLE public.partner_conversations
  ADD CONSTRAINT fk_user_id 
  FOREIGN KEY (user_id) REFERENCES public.profiles(id);

-- 규칙: 외래키 제약조건으로 인해 타입 불일치 INSERT 차단됨
```

#### 규칙 3: 도메인 타입 정의 및 재사용
```sql
-- 규칙: 프로젝트 전용 도메인 타입 생성
CREATE DOMAIN user_id_type AS UUID;
CREATE DOMAIN clerk_id_type AS UUID;
CREATE DOMAIN facility_id_type AS UUID;

-- 규칙: 모든 테이블에서 도메인 타입 사용
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id user_id_type NOT NULL,  -- 도메인 타입 사용
  message TEXT NOT NULL
);
```

#### 규칙 4: 타입 검증 CHECK 제약조건 추가
```sql
-- 규칙: 모든 ID 필드에 UUID 형식 검증
ALTER TABLE public.profiles
  ADD CONSTRAINT check_clerk_id_format 
  CHECK (clerk_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$');
```

### 4.2 RLS 정책 작성 규칙

#### 규칙 5: 정책에서 타입 캐스팅 금지
```sql
-- ❌ 금지: 타입 캐스팅 사용
CREATE POLICY "bad_policy" ON public.profiles
  FOR SELECT USING (auth.uid()::text = clerk_id::text);

-- ✅ 허용: 동일 타입 직접 비교
CREATE POLICY "good_policy" ON public.profiles
  FOR SELECT USING (auth.uid() = clerk_id);
```

#### 규칙 6: JWT 클레임 추출 시 타입 명시
```sql
-- 규칙: JWT sub는 항상 UUID로 변환 후 비교
CREATE POLICY "jwt_policy" ON public.profiles
  FOR INSERT 
  WITH CHECK (
    clerk_id = (auth.jwt() ->> 'sub')::UUID
  );

-- 규칙: auth.uid()와 JWT sub는 동일 타입으로 통일
```

#### 규칙 7: RLS 정책 변경 시 타입 검증 필수
```sql
-- 규칙: 정책 생성/수정 전 타입 확인 쿼리 실행
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'profiles' 
  AND column_name IN ('clerk_id', 'user_id');

-- 규칙: 확인된 타입과 정책 조건의 타입 일치 확인 후 적용
```

### 4.3 개발 워크플로우 규칙

#### 규칙 8: 스키마 변경 시 타입 영향도 분석 필수
```markdown
## 스키마 변경 체크리스트 (필수)

- [ ] 변경 대상 컬럼의 현재 타입 확인
- [ ] 변경 후 영향받는 RLS 정책 목록 작성
- [ ] 변경 후 영향받는 외래키 제약조건 확인
- [ ] 변경 후 영향받는 트리거 확인
- [ ] 관련 애플리케이션 코드 타입 확인
- [ ] 타입 변경 시 마이그레이션 스크립트 작성
- [ ] 테스트 환경에서 타입 불일치 테스트 수행
```

#### 규칙 9: 마이그레이션 스크립트에 타입 검증 포함
```sql
-- 규칙: 모든 마이그레이션 스크립트 시작부분에 타입 검증
DO $$
BEGIN
  -- 타입 검증
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'clerk_id' 
    AND data_type != 'uuid'
  ) THEN
    RAISE EXCEPTION ' clerk_id is not UUID type. Migration aborted.';
  END IF;
END $$;

-- 실제 마이그레이션 로직
ALTER TABLE ...
```

#### 규칙 10: 환경별 타입 검증 스크립트 실행
```bash
#!/bin/bash
# scripts/verify-types.sh
# 규칙: 배포 전 모든 환경에서 타입 검증 실행

echo "🔍 Checking database types..."

psql $DATABASE_URL -f scripts/check-id-types.sql

if [ $? -ne 0 ]; then
  echo "❌ Type validation failed!"
  exit 1
fi

echo "✅ All types are valid"
```

### 4.4 코드 리뷰 규칙

#### 규칙 11: RLS 정책 코드 리뷰 필수 체크리스트
```markdown
## RLS 정책 리뷰 체크리스트

- [ ] 정책 조건에 타입 캐스팅(::text, ::uuid 등)이 없는지 확인
- [ ] 비교 대상 컬럼의 실제 타입이 무엇인지 확인
- [ ] auth.uid() 반환 타입(UUID)과 비교 대상 타입 일치 확인
- [ ] JWT 클레임 추출 시 타입 캐스팅이 명시적인지 확인
- [ ] 서브쿼리 결과의 타입이 예상과 일치하는지 확인
- [ ] 테스트 환경에서 정책이 정상 작동하는지 확인
```

#### 규칙 12: 스키마 변경 시 2인 승인 필수
```markdown
## 스키마 변경 승인 프로세스

1. 개발자: 스키마 변경 요청서 작성 (타입 영향도 포함)
2. 리뷰어 #1: 타입 일관성 검토 및 승인
3. 리뷰어 #2: RLS 정책 영향도 검토 및 승인
4. DBA: 프로덕션 영향도 검토 및 최종 승인
5. 배포: 승인 완료 후에만 배포 가능
```

### 4.5 CI/CD 파이프라인 규칙

#### 규칙 13: PR 생성 시 자동 타입 검증
```yaml
# .github/workflows/type-validation.yml
name: Type Validation

on:
  pull_request:
    paths:
      - 'supabase/migrations/**'
      - 'scripts/db/**'

jobs:
  type-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        
      - name: Start Supabase Local
        run: supabase start
        
      - name: Run Type Validation
        run: |
          psql $DATABASE_URL -f scripts/validate-all-types.sql
          
      - name: Check RLS Policies
        run: |
          psql $DATABASE_URL -f scripts/check-rls-type-consistency.sql
          
      - name: Fail on Type Mismatch
        if: failure()
        run: |
          echo "❌ Type mismatch detected! Fix before merging."
          exit 1
```

#### 규칙 14: 배포 전 스테이징 환경 타입 검증
```yaml
# .github/workflows/deploy-staging.yml
name: Deploy to Staging

on:
  push:
    branches: [develop]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Staging
        run: supabase db push --db-url $STAGING_DB_URL
        
      - name: Post-Deploy Type Verification
        run: |
          psql $STAGING_DB_URL -f scripts/verify-all-types.sql
          
      - name: Rollback on Type Failure
        if: failure()
        run: |
          supabase db rollback
          exit 1
```

### 4.6 모니터링 및 알림 규칙

#### 규칙 15: 타입 불일치 에러 모니터링 설정
```sql
-- 규칙: 타입 불일치 에러 로깅 테이블
CREATE TABLE public.type_mismatch_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  error_message TEXT NOT NULL,
  table_name TEXT,
  column_name TEXT,
  expected_type TEXT,
  actual_type TEXT,
  query_text TEXT,
  occurred_at TIMESTAMPTZ DEFAULT now()
);

-- 규칙: 타입 에러 발생 시 자동 알림 트리거
CREATE OR REPLACE FUNCTION notify_type_error()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify('type_error', 
    json_build_object(
      'table', TG_TABLE_NAME,
      'error', NEW.error_message,
      'time', NEW.occurred_at
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER type_error_notification
  AFTER INSERT ON public.type_mismatch_logs
  FOR EACH ROW EXECUTE FUNCTION notify_type_error();
```

#### 규칙 16: 정기적 타입 일관성 검사
```sql
-- 규칙: 매일 자정 타입 일관성 자동 검사
SELECT cron.schedule('daily-type-check', '0 0 * * *', $$
  INSERT INTO public.type_mismatch_logs (error_message, table_name, column_name)
  SELECT 
    'Type mismatch detected',
    table_name,
    column_name
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND column_name LIKE '%id%'
    AND data_type NOT IN ('uuid', 'integer', 'bigint')
    AND table_name NOT IN ('type_mismatch_logs')
$$);
```

### 4.7 문서화 규칙

#### 규칙 17: 타입 규칙 문서 필수 작성 및 갱신
```markdown
# TYPE_RULES.md (필수 문서)

## 1. ID 필드 타입 표준
- 모든 ID: UUID (gen_random_uuid())
- 예외: AUTO_INCREMENT 사용 금지
- 예외: TEXT 타입 사용 금지

## 2. 인증 관련 타입
- auth.uid(): UUID
- auth.jwt() ->> 'sub': TEXT → 반드시 ::UUID 변환

## 3. RLS 정책 작성 규칙
- 타입 캐스팅 금지
- 동일 타입 간 비교만 허용
- JWT 클레임은 명시적 타입 변환

## 4. 테이블별 타입 정의
| 테이블명 | ID 필드 | 타입 | 비고 |
|---------|--------|------|------|
| profiles | clerk_id | UUID | |
| partner_conversations | user_id | UUID | |
| partner_conversations | partner_id | UUID | |

## 5. 변경 이력
| 날짜 | 변경내용 | 담당자 |
|------|---------|--------|
| 2026-02-08 | clerk_id TEXT→UUID | @developer |
```

#### 규칙 18: API 문서에 타입 명시
```typescript
// 규칙: TypeScript 타입 정의에서 모든 ID는 UUID
interface Profile {
  id: string; // UUID
  clerk_id: string; // UUID - TEXT 아님
  user_id: string; // UUID
}

// 규칙: Zod 스키마에서 UUID 검증
import { z } from 'zod';

const ProfileSchema = z.object({
  id: z.string().uuid(), // UUID 형식 강제
  clerk_id: z.string().uuid(), // UUID 형식 강제
});
```

### 4.8 팀 협업 규칙

#### 규칙 19: 타입 규칙 위반 시 즉시 롤백
```markdown
## 타입 규칙 위반 대응 절차

1. 타입 불일치 감지 즉시 배포 중단
2. 원인 분석 (스키마 vs 정책 vs 앱 코드)
3. 긴급 수정 및 테스트
4. 재배포 전 타입 검증 재실행
5. 사후 분석 및 문서화
```

#### 규칙 20: 타입 규칙 교육 및 온보딩
```markdown
## 개발자 온보딩 체크리스트

- [ ] TYPE_RULES.md 문서 검토
- [ ] UUID 타입의 중요성 이해
- [ ] RLS 정책 작성 시 타입 규칙 숙지
- [ ] 타입 검증 스크립트 실행 방법 학습
- [ ] 스키마 변경 승인 프로세스 이해
```

---

## 5. 구현 우선순위 및 체크리스트

### 즉시 실행 (Critical)
- [ ] 데이터베이스 전체 백업 완료
- [ ] 현재 테이블 스키마 및 타입 조사
- [ ] `clerk_id`, `user_id` 등 주요 ID 필드 타입 통일 결정
- [ ] TYPE_RULES.md 문서 작성
- [ ] 타입 검증 스크립트 작성

### Phase 1~2 (사전 작업)
- [ ] PostGIS 객체 위치 확인 쿼리 실행
- [ ] `spatial_ref_sys` RLS 설정 검토 (슈퍼유저 권한 확인)
- [ ] 모든 ID 필드 UUID 타입으로 마이그레이션
- [ ] 외래키 제약조건 추가

### Phase 3~5 (정책 강화)
- [ ] 타입 통일 후 RLS 정책 재작성
- [ ] `partner_conversations` 정책 테스트
- [ ] `partner_inquiries` 정책 테스트
- [ ] `subscription_payments` 복합 체크 로직 테스트
- [ ] `user_notifications` SELECT/UPDATE 분리 테스트

### Phase 7 (프로파일 동기화)
- [ ] 스키마 캐시 갱신 명령 실행
- [ ] Clerk-Supabase 인증 통합 테스트
- [ ] 406, 401, 42501 에러 재발 여부 확인

### Phase 8 (클린업)
- [ ] 임시 테이블 내용 확인
- [ ] 임시 테이블 삭제

### 검증
- [ ] Linter 경고 사라짐 확인
- [ ] 기능 테스트 (사용자 로그인, 알림, 대화)
- [ ] 보안 테스트 (타인 ID로 INSERT 차단 확인)
- [ ] 타입 불일치 로그 모니터링

---

## 6. 결론

본 구현계획은 기술적으로 타당하며, 보안 강화 목표를 달성할 수 있습니다. 다만 **타입 불일치 문제**가 주요 리스크로 작용할 수 있으므로:

1. **모든 ID 필드를 UUID로 통일**하는 것을 강력히 권장
2. **시스템 규칙 20가지**를 즉시 적용하여 재발 방지
3. JWT 클레임 추출 시 타입 캐스팅을 명시적으로 수행
4. CI/CD 파이프라인에 타입 검증 단계 추가
5. 개발팀 내 타입 규칙 문서 공유 및 준수

위 방안을 적용하면 향후 타입 관련 오류를 효과적으로 예방할 수 있습니다.

---

## 7. 참고자료

- [Supabase RLS Best Practices](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Type System](https://www.postgresql.org/docs/current/datatype.html)
- [JWT Claims Specification](https://datatracker.ietf.org/doc/html/rfc7519#section-4)
- 본 프로젝트: docs/security_hardening/implementation_plan.md
