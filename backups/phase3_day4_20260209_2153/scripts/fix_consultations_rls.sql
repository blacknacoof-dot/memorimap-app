-- consultations 테이블 RLS 정책 정리 및 재생성
-- Supabase SQL Editor에서 실행하세요

-- ==========================================
-- 1. 기존 정책 모두 삭제
-- ==========================================
DROP POLICY IF EXISTS "Users can view own consultations" ON consultations;
DROP POLICY IF EXISTS "Super admins can view all consultations" ON consultations;
DROP POLICY IF EXISTS "Facility admins can view facility consultations" ON consultations;
DROP POLICY IF EXISTS "consultations_insert_owner_only" ON consultations;
DROP POLICY IF EXISTS "authenticated_insert_own_consultation" ON consultations;
DROP POLICY IF EXISTS "authenticated_select_own_consultation" ON consultations;
DROP POLICY IF EXISTS "facility_admin_view_consultations" ON consultations;

-- ==========================================
-- 2. RLS 활성화 (비활성화되어 있다면)
-- ==========================================
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 3. 새 정책 생성
-- ==========================================

-- 정책 1: 본인은 자신의 상담 조회 가능
CREATE POLICY "select_own_consultation" 
ON consultations FOR SELECT 
USING (
  user_id = auth.jwt() ->> 'sub'
);

-- 정책 2: 시설 관리자는 해당 시설의 상담 조회 가능
CREATE POLICY "select_facility_consultation" 
ON consultations FOR SELECT 
USING (
  facility_id IN (
    SELECT facility_id::text 
    FROM facility_admins 
    WHERE user_id::uuid = auth.uid()
  )
);

-- 정책 3: 슈퍼관리자는 모든 상담 조회/수정/삭제 가능
CREATE POLICY "super_admin_all_consultation" 
ON consultations FOR ALL 
USING (
  EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE clerk_id = auth.jwt() ->> 'sub' 
      AND role = 'super_admin'
  )
);

-- 정책 4: 인증된 사용자는 상담 생성 가능
CREATE POLICY "insert_consultation" 
ON consultations FOR INSERT 
WITH CHECK (
  user_id = auth.jwt() ->> 'sub'
);

-- ==========================================
-- 4. 생성된 정책 확인
-- ==========================================
SELECT 
  policyname,
  cmd,
  permissive,
  roles::text as roles
FROM pg_policies 
WHERE tablename = 'consultations'
ORDER BY policyname;
