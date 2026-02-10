-- RLS 정책 수정: auth.uid() → auth.jwt() ->> 'sub'
-- Supabase SQL Editor에서 실행하세요

-- ==========================================
-- 1. 기존 정책 삭제
-- ==========================================
DROP POLICY IF EXISTS "select_own_consultation" ON consultations;
DROP POLICY IF EXISTS "select_facility_consultation" ON consultations;
DROP POLICY IF EXISTS "super_admin_all_consultation" ON consultations;
DROP POLICY IF EXISTS "insert_consultation" ON consultations;

-- ==========================================
-- 2. 새 정책 생성 (auth.uid() 대신 auth.jwt() ->> 'sub' 사용)
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
    SELECT ms.facilities_id::text
    FROM memorial_spaces ms
    WHERE ms.owner_user_id = auth.jwt() ->> 'sub'
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
-- 3. 생성된 정책 확인
-- ==========================================
SELECT 
  policyname,
  cmd,
  permissive
FROM pg_policies 
WHERE tablename = 'consultations'
ORDER BY policyname;
