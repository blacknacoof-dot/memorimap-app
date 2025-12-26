-- 1. memorial_spaces 타입 제약 조건 업데이트
ALTER TABLE memorial_spaces 
DROP CONSTRAINT IF EXISTS memorial_spaces_type_check;

ALTER TABLE memorial_spaces
ADD CONSTRAINT memorial_spaces_type_check 
CHECK (type IN ('charnel', 'natural', 'park', 'complex', 'sea', 'pet', 'funeral'));

-- [추가] 누락된 naver_booking_url 컬럼 추가
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='memorial_spaces' AND column_name='naver_booking_url') THEN
        ALTER TABLE memorial_spaces ADD COLUMN naver_booking_url TEXT;
    END IF;
END $$;

-- 2. funeral_companies RLS 정책 활성화 및 설정
ALTER TABLE funeral_companies ENABLE ROW LEVEL SECURITY;

-- 모든 사용자(Public)가 정보를 조회(SELECT)할 수 있도록 허용
DROP POLICY IF EXISTS "Allow public read access on funeral_companies" ON funeral_companies;
CREATE POLICY "Allow public read access on funeral_companies" 
ON funeral_companies FOR SELECT 
TO public 
USING (true);

-- 모든 사용자가 임시로 모든 작업을 할 수 있도록 허용 (마이그레이션 중 오류 방지)
-- ⚠️ 마이그레이션 완료 후에는 authenticated나 service_role로 제한하는 것이 좋습니다.
DROP POLICY IF EXISTS "Allow all access for migration" ON funeral_companies;
CREATE POLICY "Allow all access for migration" 
ON funeral_companies FOR ALL 
TO public 
USING (true)
WITH CHECK (true);

-- 3. sangjo_dashboard_users ID 타입을 Clerk ID(TEXT)와 호환되도록 수정
DO $$ 
BEGIN 
    -- 기존 컬럼 타입 변경
    ALTER TABLE sangjo_dashboard_users ALTER COLUMN user_id TYPE TEXT;
EXCEPTION 
    WHEN others THEN 
        RAISE NOTICE 'user_id 타입 변경 중 오류 발생: %', SQLERRM;
END $$;


