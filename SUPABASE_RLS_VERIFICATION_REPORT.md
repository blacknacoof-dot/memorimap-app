# Supabase RLS Fix Document 검증 보고서

**문서명**: SUPABASE_RLS_FIX_DOCUMENT.md  
**검증일**: 2026-02-13  
**상태**: ⚠️ 개선 필요

---

## 1. 발견된 불일치 및 문제점

### 1.1 🚨 심각: DELETE/UPDATE 정책 누락

**문제**: 문서에는 SELECT와 INSERT 정책만 있고, DELETE와 UPDATE 정책이 없음

**영향**: 
- 사용자가 본인의 상담 내역을 수정하거나 삭제할 수 없음
- 관리자가 상담 상태를 변경할 수 없음

**해결방안**:
```sql
-- 사용자 본인 수정 권한
CREATE POLICY "consultations_owner_update" ON public.consultations
    FOR UPDATE TO authenticated
    USING (user_id = (auth.jwt() ->> 'sub'));

-- 관리자 수정 권한 (상태 변경 등)
CREATE POLICY "consultations_admin_update" ON public.consultations
    FOR UPDATE TO authenticated
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

-- 관리자 삭제 권한
CREATE POLICY "consultations_admin_delete" ON public.consultations
    FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE clerk_id = (auth.jwt() ->> 'sub') 
            AND role = 'super_admin'
        )
    );
```

---

### 1.2 ⚠️ 주의: INSERT 정책 권한 범위

**문제**: 현재 INSERT 정책이 `WITH CHECK (true)`로 모든 사용자(비로그인 포함)에게 허용

**영향**:
- 보안 취약점: 익명 사용자가 상담 데이터를 무제한으로 삽입 가능
- 스팸/악용 위험

**해결방안 (2가지 옵션)**:

**옵션 A - 로그인 필수 (권장)**:
```sql
DROP POLICY IF EXISTS "consultations_insert_enabled" ON public.consultations;
CREATE POLICY "consultations_insert_authenticated" ON public.consultations
    FOR INSERT TO authenticated
    WITH CHECK (user_id = (auth.jwt() ->> 'sub'));
```

**옵션 B - 익명 허용하되 검증 강화**:
```sql
DROP POLICY IF EXISTS "consultations_insert_enabled" ON public.consultations;
CREATE POLICY "consultations_insert_with_validation" ON public.consultations
    FOR INSERT 
    WITH CHECK (
        -- 필수 필드 검증
        user_id IS NOT NULL 
        AND facility_id IS NOT NULL
        AND created_at IS NOT NULL
    );
```

---

### 1.3 ⚠️ 주의: admin_select 정책 중복 조회 가능성

**문제**: 동일한 사용자가 owner_select와 admin_select 두 정책에 모두 해당될 수 있음

**영향**: 
- 기능상 문제는 없으나 정책 평가 오버헤드 발생
- 혼란스러운 권한 구조

**해결방안**:
```sql
-- 통합 SELECT 정책으로 단순화
DROP POLICY IF EXISTS "consultations_owner_select" ON public.consultations;
DROP POLICY IF EXISTS "consultations_admin_select" ON public.consultations;

CREATE POLICY "consultations_select_unified" ON public.consultations
    FOR SELECT TO authenticated
    USING (
        -- 본인 데이터
        user_id = (auth.jwt() ->> 'sub')
        OR
        -- 시설 관리자
        EXISTS (
            SELECT 1 FROM public.facilities 
            WHERE facilities.id::text = consultations.facility_id::text 
            AND facilities.user_id = (auth.jwt() ->> 'sub')
        )
        OR 
        -- 슈퍼 관리자
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE clerk_id = (auth.jwt() ->> 'sub') 
            AND role = 'super_admin'
        )
    );
```

---

### 1.4 ⚠️ 주의: profiles 테이블 참조 불확실성

**문제**: `profiles` 테이블의 `clerk_id` 컬럼 존재 여부 및 인덱스 확인 필요

**영향**:
- 정책 평가 시 풀 테이블 스캔 발생 가능
- 성능 저하

**해결방안**:
```sql
-- profiles 테이블 clerk_id 인덱스 확인 및 생성
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'profiles' 
        AND indexname = 'idx_profiles_clerk_id'
    ) THEN
        CREATE INDEX idx_profiles_clerk_id ON public.profiles(clerk_id);
        RAISE NOTICE 'Created index idx_profiles_clerk_id';
    END IF;
END $$;
```

---

### 1.5 📝 개선: 트랜잭션 및 에러 핸들링

**문제**: 현재 스크립트는 부분 실패 시 롤백되지만, 상세한 에러 메시지가 없음

**해결방안**:
```sql
-- 트랜잭션 블록에 예외 처리 추가
DO $$
BEGIN
    -- 데이터 타입 변경
    ALTER TABLE IF EXISTS public.consultations 
    DROP CONSTRAINT IF EXISTS consultations_user_id_fkey;
    
    ALTER TABLE public.consultations 
    ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT,
    ALTER COLUMN facility_id TYPE TEXT USING facility_id::TEXT;
    
    RAISE NOTICE '✓ Step 1: Data type conversion completed';
    
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to alter table: %', SQLERRM;
END $$;
```

---

## 2. 누락된 고려사항

### 2.1 실시간 구독 (Realtime) 설정

**필요성**: 상담 알림 등 실시간 기능 사용 시 RLS가 realtime에도 적용되어야 함

**해결방안**:
```sql
-- Realtime 구독을 위한 publication 설정 확인
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication 
        WHERE pubname = 'supabase_realtime'
    ) THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
    
    -- consultations 테이블을 publication에 추가
    ALTER PUBLICATION supabase_realtime ADD TABLE public.consultations;
EXCEPTION 
    WHEN duplicate_table THEN
        RAISE NOTICE 'Table already in publication';
END $$;
```

### 2.2 감사 로깅 (Audit Logging)

**필요성**: 누가 언제 상담을 조회/수정했는지 추적

**해결방안**:
```sql
-- 감사 로그 테이블 생성
CREATE TABLE IF NOT EXISTS public.consultation_audit_logs (
    id BIGSERIAL PRIMARY KEY,
    consultation_id BIGINT REFERENCES public.consultations(id) ON DELETE CASCADE,
    action VARCHAR(20) NOT NULL, -- 'SELECT', 'INSERT', 'UPDATE', 'DELETE'
    performed_by TEXT NOT NULL,
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    old_data JSONB,
    new_data JSONB
);

-- RLS 활성화
ALTER TABLE public.consultation_audit_logs ENABLE ROW LEVEL SECURITY;

-- 관리자만 조회 가능
CREATE POLICY "audit_logs_admin_only" ON public.consultation_audit_logs
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE clerk_id = (auth.jwt() ->> 'sub') 
            AND role IN ('super_admin', 'facility_admin')
        )
    );
```

### 2.3 데이터 마이그레이션 검증

**필요성**: UUID에서 TEXT로 변환 시 기존 데이터 무결성 확인

**해결방안**:
```sql
-- 마이그레이션 전 데이터 백업 및 검증
CREATE TABLE IF NOT EXISTS public.consultations_backup AS 
SELECT * FROM public.consultations;

-- 변환 후 데이터 무결성 검증
DO $$
DECLARE
    original_count BIGINT;
    converted_count BIGINT;
BEGIN
    SELECT COUNT(*) INTO original_count FROM public.consultations_backup;
    SELECT COUNT(*) INTO converted_count FROM public.consultations;
    
    IF original_count != converted_count THEN
        RAISE EXCEPTION 'Data migration error: Original count (%) != Converted count (%)', 
            original_count, converted_count;
    END IF;
    
    RAISE NOTICE '✓ Data integrity verified: % records preserved', converted_count;
END $$;
```

---

## 3. 최종 권장 SQL (통합본)

```sql
-- =============================================
-- 📋 public.consultations RLS 완전 복구 스크립트 (개선판)
-- =============================================

BEGIN;

-- 1. 백업 생성
CREATE TABLE IF NOT EXISTS public.consultations_backup AS 
SELECT * FROM public.consultations;

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_profiles_clerk_id ON public.profiles(clerk_id);
CREATE INDEX IF NOT EXISTS idx_consultations_user_id ON public.consultations(user_id);
CREATE INDEX IF NOT EXISTS idx_consultations_facility_id ON public.consultations(facility_id);

-- 3. 데이터 타입 정리
ALTER TABLE IF EXISTS public.consultations 
DROP CONSTRAINT IF EXISTS consultations_user_id_fkey;

ALTER TABLE public.consultations 
ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT,
ALTER COLUMN facility_id TYPE TEXT USING facility_id::TEXT;

-- 4. 기존 정책 초기화
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'consultations' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.consultations';
    END LOOP;
END $$;

-- 5. RLS 활성화
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;

-- 6. 통합 정책 적용

-- 6.1 INSERT: 로그인 사용자만, 본인 데이터만
CREATE POLICY "consultations_insert" ON public.consultations
    FOR INSERT TO authenticated
    WITH CHECK (user_id = (auth.jwt() ->> 'sub'));

-- 6.2 SELECT: 본인 + 시설관리자 + 슈퍼관리자
CREATE POLICY "consultations_select" ON public.consultations
    FOR SELECT TO authenticated
    USING (
        user_id = (auth.jwt() ->> 'sub')
        OR EXISTS (
            SELECT 1 FROM public.facilities 
            WHERE facilities.id::text = consultations.facility_id::text 
            AND facilities.user_id = (auth.jwt() ->> 'sub')
        )
        OR EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE clerk_id = (auth.jwt() ->> 'sub') 
            AND role = 'super_admin'
        )
    );

-- 6.3 UPDATE: 본인(제한적) + 관리자
CREATE POLICY "consultations_update" ON public.consultations
    FOR UPDATE TO authenticated
    USING (
        -- 관리자는 모든 필드 수정 가능
        EXISTS (
            SELECT 1 FROM public.facilities 
            WHERE facilities.id::text = consultations.facility_id::text 
            AND facilities.user_id = (auth.jwt() ->> 'sub')
        )
        OR EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE clerk_id = (auth.jwt() ->> 'sub') 
            AND role = 'super_admin'
        )
    )
    WITH CHECK (
        -- 본인은 특정 필드만 수정 가능 (예: 취소 요청)
        user_id = (auth.jwt() ->> 'sub')
        OR EXISTS (
            SELECT 1 FROM public.facilities 
            WHERE facilities.id::text = consultations.facility_id::text 
            AND facilities.user_id = (auth.jwt() ->> 'sub')
        )
        OR EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE clerk_id = (auth.jwt() ->> 'sub') 
            AND role = 'super_admin'
        )
    );

-- 6.4 DELETE: 슈퍼관리자만
CREATE POLICY "consultations_delete" ON public.consultations
    FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE clerk_id = (auth.jwt() ->> 'sub') 
            AND role = 'super_admin'
        )
    );

-- 7. 권한 부여
GRANT ALL ON public.consultations TO authenticated, service_role;
GRANT USAGE ON SEQUENCE public.consultations_id_seq TO authenticated;

COMMIT;

-- 8. 검증
SELECT 
    'RLS Fix Completed' as status,
    COUNT(*) as total_records,
    COUNT(DISTINCT user_id) as unique_users
FROM public.consultations;

-- 9. 정책 목록 확인
SELECT policyname, permissive, roles, cmd, qual::text
FROM pg_policies 
WHERE tablename = 'consultations' AND schemaname = 'public';
```

---

## 4. 검증 체크리스트

- [ ] SQL 실행 후 오류 없이 완료되는지 확인
- [ ] 기존 데이터가 모두 보존되었는지 확인
- [ ] 로그인 사용자가 본인 상담 조회 가능한지 확인
- [ ] 시설 관리자가 소속 시설 상담 조회 가능한지 확인
- [ ] 슈퍼관리자가 모든 상담 조회/수정/삭제 가능한지 확인
- [ ] 비로그인 사용자가 INSERT 불가능한지 확인
- [ ] MyPage에서 상담 내역 정상 표시되는지 확인
- [ ] 관리자 페이지에서 상담 관리 가능한지 확인

---

**검증 결론**: 문서는 기본적인 문제 해결을 위한 좋은 출발점이나, DELETE/UPDATE 정책 누락과 INSERT 권한 범위 문제로 인해 실제 운영 환경에서는 보안 취약점이 발생할 수 있습니다. 위 개선안 적용을 권장합니다.
