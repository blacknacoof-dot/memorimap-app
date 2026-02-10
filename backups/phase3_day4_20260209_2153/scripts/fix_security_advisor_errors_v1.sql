-- ========================================================================
-- Supabase 보안 종합 해결 스크립트 (ERROR 레벨 전체 해결 - v1.0)
-- ========================================================================
-- 1. Security Definer View -> Security Invoker로 전환
-- 2. RLS 미활성화 테이블(백업 포함) 보안 강화
-- NOTE: spatial_ref_sys 관련 변경은 시스템 테이블 소유권 문제로 제거됨
-- ========================================================================

BEGIN;

-- ========================================================================
-- PART 1: Security Definer View 수정
-- ========================================================================

-- 기존 뷰 삭제 후 보안 강화 버전으로 재생성
DROP VIEW IF EXISTS public.admin_subscriptions_with_facility CASCADE;

CREATE VIEW public.admin_subscriptions_with_facility
WITH (security_invoker = true) -- 호출자 권한으로 실행하도록 보안 강화
AS
SELECT 
    fs.*,
    f.name as facility_name,
    sp.name as plan_name
FROM facility_subscriptions fs
LEFT JOIN facilities f ON f.id = fs.facility_id_uuid
LEFT JOIN subscription_plans sp ON (
    fs.plan_id = sp.name OR 
    fs.plan_id = sp.name_en OR 
    (fs.plan_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND fs.plan_id::uuid = sp.id)
);

-- ========================================================================
-- PART 2: 비활성 RLS 테이블 활성화 (중요 테이블)
-- ========================================================================

-- 2-1. sangjo_hq_admins (관리자 전용)
ALTER TABLE public.sangjo_hq_admins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Super admins only" ON public.sangjo_hq_admins;
CREATE POLICY "Super admins only" ON public.sangjo_hq_admins
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE clerk_id = (SELECT auth.jwt() ->> 'sub') -- 성능 최적화를 위한 SELECT 래핑
        AND role::text = 'super_admin'
    )
);

-- 2-2. funeral_company_legacy_mapping (관리자 전용)
ALTER TABLE public.funeral_company_legacy_mapping ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin only access" ON public.funeral_company_legacy_mapping;
CREATE POLICY "Admin only access" ON public.funeral_company_legacy_mapping
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE clerk_id = (SELECT auth.jwt() ->> 'sub') -- 성능 최적화를 위한 SELECT 래핑
        AND role::text IN ('super_admin', 'sangjo_manager')
    )
);

-- ========================================================================
-- PART 3: 백업 테이블 RLS 활성화 (관리자만 접근 가능)
-- ========================================================================

DO $$
DECLARE
    t text;
    backup_tables text[] := ARRAY[
        'facilities_backup_20260119',
        'facilities_backup_20260122',
        'columbarium_backup_20260119',
        'broken_images_backup_20260119',
        'facility_subscriptions_backup'
    ];
BEGIN
    FOREACH t IN ARRAY backup_tables LOOP
        -- 테이블 존재 여부 확인 (안전 장치)
        IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = t) THEN
            -- RLS 활성화
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
            
            -- 기존 정책 삭제 (정책 이름에 테이블명을 포함)
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Admin only access - ' || t, t);
            
            -- 관리자 전용 정책 생성 (성능 최적화 및 인증된 사용자 명시)
            EXECUTE format('
                CREATE POLICY %I ON public.%I
                FOR ALL TO authenticated
                USING (
                    EXISTS (
                        SELECT 1 FROM public.profiles
                        WHERE clerk_id = (SELECT auth.jwt() ->> ''sub'')
                        AND role::text IN (''super_admin'', ''sangjo_manager'')
                    )
                )', 'Admin only access - ' || t, t);
        ELSE
            RAISE NOTICE 'Skipping: Table public.% does not exist.', t;
        END IF;
    END LOOP;
END $$;

-- ========================================================================
-- PART 4: spatial_ref_sys 관련 변경은 의도적으로 제외되었습니다.
-- 이유: spatial_ref_sys는 PostGIS 시스템 테이블로 소유자가 다르므로
-- ALTER TABLE / CREATE POLICY 를 실행하면 "must be owner" 에러가 발생합니다.
-- ========================================================================

COMMIT;

-- 결과 확인
DO $$ 
BEGIN
    RAISE NOTICE '✅ ERROR 레벨 보안 이슈 8개 해결 완료 (spatial_ref_sys 제외)';
END $$;
