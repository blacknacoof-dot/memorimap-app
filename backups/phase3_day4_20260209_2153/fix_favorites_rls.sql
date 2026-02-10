
-- favorites 테이블의 RLS 정책을 수정하는 SQL입니다.
-- Supabase 대시보드 -> SQL Editor에서 실행해주세요.

-- 1. 테이블이 존재하는지 확인 및 RLS 활성화
ALTER TABLE IF EXISTS favorites ENABLE ROW LEVEL SECURITY;

-- 2. 기존 정책이 있다면 충돌 방지를 위해 삭제 (선택사항, 필요시 주석 해제)
-- DROP POLICY IF EXISTS "Users can view own favorites" ON favorites;
-- DROP POLICY IF EXISTS "Users can insert own favorites" ON favorites;
-- DROP POLICY IF EXISTS "Users can delete own favorites" ON favorites;

-- 3. SELECT 정책: 본인의 즐겨찾기만 조회 가능
CREATE POLICY "Users can view own favorites" 
ON favorites FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- 4. INSERT 정책: 본인의 즐겨찾기만 추가 가능
CREATE POLICY "Users can insert own favorites" 
ON favorites FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 5. DELETE 정책: 본인의 즐겨찾기만 삭제 가능
CREATE POLICY "Users can delete own favorites" 
ON favorites FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- 확인용: 정책이 잘 적용되었는지 확인하려면 아래 쿼리를 실행해볼 수 있습니다.
-- SELECT * FROM pg_policies WHERE tablename = 'favorites';
