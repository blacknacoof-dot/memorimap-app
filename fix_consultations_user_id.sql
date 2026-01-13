-- Fix: consultations.user_id 컬럼을 UUID에서 TEXT로 변경
-- Clerk 사용자 ID는 'user_xxxxx' 형식의 문자열이므로 UUID 타입과 호환되지 않음

-- 1. 먼저 Foreign Key 제약조건 삭제
ALTER TABLE public.consultations 
DROP CONSTRAINT IF EXISTS consultations_user_id_fkey;

-- 2. 컬럼 타입을 TEXT로 변경
ALTER TABLE public.consultations 
ALTER COLUMN user_id TYPE TEXT 
USING user_id::TEXT;

-- 3. 확인
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'consultations' AND column_name = 'user_id';
