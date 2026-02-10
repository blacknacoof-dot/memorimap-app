-- Fix RLS policies for BOTH favorites tables

-- ============================================
-- 1. Fix facilities favorites (시설 즐겨찾기)
-- ============================================
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read for users" ON favorites;
DROP POLICY IF EXISTS "Enable insert for users" ON favorites;
DROP POLICY IF EXISTS "Enable delete for users" ON favorites;

CREATE POLICY "Enable read for users" 
ON favorites FOR SELECT 
USING (true);

CREATE POLICY "Enable insert for users" 
ON favorites FOR INSERT 
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Enable delete for users" 
ON favorites FOR DELETE 
USING (auth.uid()::text = user_id);


-- ============================================
-- 2. Fix sangjo favorites (상조 즐겨찾기)
-- ============================================
ALTER TABLE sangjo_favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read for sangjo users" ON sangjo_favorites;
DROP POLICY IF EXISTS "Enable insert for sangjo users" ON sangjo_favorites;
DROP POLICY IF EXISTS "Enable delete for sangjo users" ON sangjo_favorites;

CREATE POLICY "Enable read for sangjo users" 
ON sangjo_favorites FOR SELECT 
USING (true);

CREATE POLICY "Enable insert for sangjo users" 
ON sangjo_favorites FOR INSERT 
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Enable delete for sangjo users" 
ON sangjo_favorites FOR DELETE 
USING (auth.uid()::text = user_id);


-- Reload schema cache
NOTIFY pgrst, 'reload schema';
