# 📋 Supabase RLS 및 상담 데이터 조회 문제 해결 방안

## 1. 문제 분석 (Root Cause Analysis)

현재 `public.consultations` 테이블에서 데이터는 정상적으로 INSERT되지만, 사용자의 "내 정보(MyPage)" 등에서 조회가 되지 않는 문제는 주로 **RLS(Row Level Security)** 설정의 불일치 때문입니다.

### 주요 원인
1.  **인증 식별자 불일치**: 
    - 프로젝트에서 **Clerk**을 사용하고 있으나, 일부 RLS 정책이 Supabase 고유 함수인 `auth.uid()`를 사용하고 있습니다. 
    - `auth.uid()`는 UUID를 반환하지만, Clerk의 사용자 ID는 `user_36v...`와 같은 **TEXT** 형식이므로 서로 매칭되지 않습니다.
2.  **데이터 타입 혼선**:
    - `user_id` 컬럼이 초기에는 `UUID` 타입(auth.users 참조)으로 생성되었으나, 실제 데이터는 Clerk ID(TEXT)가 들어오면서 타입 불일치 및 제약 조건 오류가 발생할 수 있습니다.
3.  **정책 중복 및 파편화**:
    - 여러 SQL 파일(`create_consultations_table.sql`, `fix_consultations_rls.sql`, `migrations` 등)에서 서로 다른 이름과 조건으로 정책을 생성하여, 어떤 정책이 우선 순위를 갖는지 불명확해졌습니다.

---

## 2. 해결 방안 (Proposed Solution)

모든 인증 기반 검색 정책을 Clerk의 JWT 구조에 맞게 **표준화**하고, 데이터 타입을 **TEXT**로 통일합니다.

### 핵심 원칙
- 모든 RLS 정책에서 사용자 식별 시 `(auth.jwt() ->> 'sub')`를 사용합니다.
- 비교 대상인 `user_id`, `facility_id` 등을 명시적으로 `::TEXT`로 캐스팅하여 비교합니다.
- 기존의 파편화된 정책을 모두 삭제하고 통합된 정책으로 재설정합니다.

---

## 3. 실행 가이드 (SQL 실행문)

아래 SQL을 Supabase Dashboard의 **SQL Editor**에서 실행하십시오. 이 스크립트는 기존 정책을 초기화하고 Clerk 환경에 최적화된 새로운 보안 정책을 적용합니다.

```sql
-- =============================================
-- 📋 public.consultations RLS 통합 복구 스크립트
-- ==============================================

BEGIN;

-- 1. 데이터 타입 및 제약 조건 정리
-- Foreign Key 제약 조건이 UUID 타입을 강제할 수 있으므로 삭제 후 타입을 TEXT로 변경
ALTER TABLE IF EXISTS public.consultations 
DROP CONSTRAINT IF EXISTS consultations_user_id_fkey;

ALTER TABLE public.consultations 
ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT,
ALTER COLUMN facility_id TYPE TEXT USING facility_id::TEXT;

-- 2. 기존 RLS 정책 초기화
-- 테이블에 걸린 모든 이전 정책을 삭제하여 충돌 방지
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'consultations' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.consultations';
    END LOOP;
END $$;

-- 3. 통합 RLS 정책 적용 (Clerk 가이드 준수)
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;

-- 3.1 [INSERT] 모든 사용자가 상담 신청 가능 (비로그인 포함인 경우 true, 로그인 필수인 경우 authenticated)
CREATE POLICY "consultations_insert_enabled" ON public.consultations
    FOR INSERT WITH CHECK (true);

-- 3.2 [SELECT] 사용자 본인의 상담 내역만 조회 가능
-- auth.jwt() ->> 'sub'는 Clerk의 User ID와 매칭됩니다.
CREATE POLICY "consultations_owner_select" ON public.consultations
    FOR SELECT TO authenticated
    USING (user_id = (auth.jwt() ->> 'sub'));

-- 3.3 [SELECT] 시설 관리자 및 슈퍼 관리자 조회 권한
-- 시설 소유자(facilities.user_id) 또는 슈퍼 관리자가 본인 시설의 상담 내역을 볼 수 있게 함
-- BIGINT와 TEXT 비교를 위해 ::TEXT로 캐스팅
CREATE POLICY "consultations_admin_select" ON public.consultations
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.facilities 
            WHERE facilities.id::text = consultations.facility_id::text 
            AND facilities.user_id = (auth.jwt() ->> 'sub')
        )
        OR 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE clerk_id = (auth.jwt() ->> 'sub') 
            AND role = 'super_admin'
        )
    );

-- 4. 권한 부여 재확인
GRANT ALL ON public.consultations TO authenticated, service_role;
GRANT INSERT ON public.consultations TO anon;

COMMIT;

-- 성공 확인 로그
SELECT 'RLS Fix Completed: Clerk user_id matching initialized.' as status;
```

---

## 4. 검증 방법

SQL 실행 후, 다음 단계를 통해 확인하십시오:

1.  **데이터베이스 확인**: `SELECT * FROM consultations WHERE user_id = '사용자의_CLERK_ID';` 쿼리가 SQL Editor에서 데이터를 반환하는지 확인합니다.
2.  **애플리케이션 확인**: MyPage의 상담 내역 목록이 정상적으로 표시되는지 확인합니다.
3.  **브라우저 콘솔 확인**: 클라이언트에서 토큰이 정상적으로 주입되고 있는지 `[AuthSync] ✅ Token Retrieved!` 로그를 확인합니다.

---
**작성일**: 2026-02-13
**담당자**: Antigravity AI Assistant
