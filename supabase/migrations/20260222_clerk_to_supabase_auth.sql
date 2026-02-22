-- ============================================================
-- Clerk → Supabase Auth 전환 마이그레이션
-- 실행 전: 클라이언트 코드가 이미 Supabase Auth로 전환된 상태여야 함
-- ============================================================

-- 1. clerk_user_id() 함수 내부 변경
-- 함수명은 유지 (98+ RLS 정책이 참조)
-- 내부만 auth.uid()::text로 변경
CREATE OR REPLACE FUNCTION public.clerk_user_id()
RETURNS TEXT LANGUAGE sql STABLE AS $$
  SELECT auth.uid()::text;
$$;

-- 2. is_super_admin() 함수 업데이트
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE clerk_id = auth.uid()::text AND role = 'super_admin'
  );
END;
$$;

-- 3. profiles 테이블: clerk_id nullable로 변경
-- (이미 nullable이면 무시됨)
ALTER TABLE profiles ALTER COLUMN clerk_id DROP NOT NULL;

-- 4. 출시 전 테스트 데이터 정리 (profiles)
-- 주의: CASCADE로 인해 FK 참조 테이블도 함께 삭제됨
-- 실행 전 아래 쿼리로 영향 범위 확인 필수:
--   SELECT tc.table_name
--   FROM information_schema.table_constraints tc
--   JOIN information_schema.constraint_column_usage ccu
--     ON tc.constraint_name = ccu.constraint_name
--   WHERE ccu.table_name = 'profiles'
--     AND tc.constraint_type = 'FOREIGN KEY';
-- TRUNCATE profiles CASCADE;
-- ↑ 주석 처리됨 — 영향 범위 확인 후 수동 실행할 것

-- 5. user_id가 'user_' 형식인 Clerk 테스트 데이터 정리
-- (출시 전이므로 테스트 데이터 삭제 무관)
-- DELETE FROM facility_reviews WHERE user_id LIKE 'user_%';
-- DELETE FROM reservations WHERE user_id LIKE 'user_%';
-- DELETE FROM consultations WHERE user_id LIKE 'user_%';
-- DELETE FROM user_notifications WHERE user_id LIKE 'user_%';
-- DELETE FROM favorites WHERE user_id LIKE 'user_%';
-- DELETE FROM sangjo_favorites WHERE user_id LIKE 'user_%';
-- ↑ 주석 처리됨 — 필요 시 수동 실행
