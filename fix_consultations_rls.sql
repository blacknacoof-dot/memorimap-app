-- Fix: consultations 테이블 RLS 정책 수정
-- 인증된 사용자의 INSERT 및 자신의 상담 조회 허용

-- 1. 기존 정책 삭제 (있으면)
DROP POLICY IF EXISTS "Users can insert own consultations" ON public.consultations;
DROP POLICY IF EXISTS "Users can view own consultations" ON public.consultations;
DROP POLICY IF EXISTS "Facility owners can view facility consultations" ON public.consultations;
DROP POLICY IF EXISTS "Allow authenticated insert" ON public.consultations;
DROP POLICY IF EXISTS "Allow public insert" ON public.consultations;

-- 2. RLS 활성화 (이미 되어있으면 무시됨)
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;

-- 3. 새 정책 생성

-- 3-1. 누구나 상담 접수 가능 (비로그인 포함 - 긴급 상담용)
CREATE POLICY "Allow public insert consultations"
ON public.consultations
FOR INSERT
TO public
WITH CHECK (true);

-- 3-2. 자신의 상담만 조회 가능 (로그인 사용자)
CREATE POLICY "Users can view own consultations"
ON public.consultations
FOR SELECT
TO authenticated
USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- 3-3. 시설 관리자는 해당 시설 상담 조회 가능
CREATE POLICY "Facility owners can view facility consultations"
ON public.consultations
FOR SELECT
TO authenticated
USING (
  facility_id IN (
    SELECT id::text FROM memorial_spaces 
    WHERE owner_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  )
);

-- 3-4. 시설 관리자는 상담 상태 업데이트 가능
CREATE POLICY "Facility owners can update consultations"
ON public.consultations
FOR UPDATE
TO authenticated
USING (
  facility_id IN (
    SELECT id::text FROM memorial_spaces 
    WHERE owner_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  )
);

-- 4. 확인
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename = 'consultations';
