-- [FINAL] profiles 테이블 RLS 정책 수정 (406/401 해결)
-- Supabase SQL Editor에서 실행하세요.

BEGIN;

-- 1. RLS 활성화
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 2. 기존 정책 정리 (충돌 방지)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;

-- 3. SELECT 정책: 내 프로필 조회 + 공용 프로필(필요 시)
-- Clerk ID(clerk_id 컬럼)가 현재 토큰의 sub와 일치하는지 확인
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
TO authenticated
USING (
  clerk_id = (auth.jwt() ->> 'sub') 
  OR id = auth.uid()
);

-- 4. INSERT 정책: 내 프로필 생성
-- Clerk ID가 일치하는 데이터만 삽입 가능
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (
  clerk_id = (auth.jwt() ->> 'sub')
);

-- 5. UPDATE 정책: 내 프로필 수정
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (
  clerk_id = (auth.jwt() ->> 'sub')
)
WITH CHECK (
  clerk_id = (auth.jwt() ->> 'sub')
);

-- 6. (옵션) 서비스 운영상 필요한 경우: 모든 인증된 사용자가 기본 정보 조회 가능
-- 예: 댓글 작성자 이름 표시 등. 필요하면 주석 해제하여 실행.
-- CREATE POLICY "Authenticated users can view basic profile info"
-- ON profiles FOR SELECT
-- TO authenticated
-- USING (true);

COMMIT;

SELECT 'Profiles RLS policies successfully applied.' as result;
