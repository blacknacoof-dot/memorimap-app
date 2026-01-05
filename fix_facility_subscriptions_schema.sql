-- facility_subscriptions 테이블 스키마 수정
-- 문제: 'end_date' 등의 컬럼이 없어서 400 에러 발생 (Code: PGRST204)

-- 1. start_date 컬럼 추가
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'facility_subscriptions' AND column_name = 'start_date') THEN
        ALTER TABLE facility_subscriptions ADD COLUMN start_date TIMESTAMPTZ;
    END IF;
END $$;

-- 2. end_date 컬럼 추가 (이게 에러의 주원인)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'facility_subscriptions' AND column_name = 'end_date') THEN
        ALTER TABLE facility_subscriptions ADD COLUMN end_date TIMESTAMPTZ;
    END IF;
END $$;

-- 3. status 컬럼 추가
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'facility_subscriptions' AND column_name = 'status') THEN
        ALTER TABLE facility_subscriptions ADD COLUMN status VARCHAR(20) DEFAULT 'active';
    END IF;
END $$;

-- 4. ai_chat_used 컬럼 추가
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'facility_subscriptions' AND column_name = 'ai_chat_used') THEN
        ALTER TABLE facility_subscriptions ADD COLUMN ai_chat_used INTEGER DEFAULT 0;
    END IF;
END $$;

-- 5. RLS 정책도 확인 (INSERT/UPDATE 권한)
ALTER TABLE facility_subscriptions ENABLE ROW LEVEL SECURITY;

GRANT ALL ON facility_subscriptions TO authenticated;
GRANT ALL ON facility_subscriptions TO anon;
GRANT ALL ON facility_subscriptions TO service_role;

-- 기존 정책 삭제 후 재생성 (충돌 방지)
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON facility_subscriptions;
DROP POLICY IF EXISTS "Enable read access for all users" ON facility_subscriptions;
DROP POLICY IF EXISTS "Enable update for users based on email" ON facility_subscriptions;
DROP POLICY IF EXISTS "Allow UPSERT for authenticated users" ON facility_subscriptions;

-- 단순화된 정책 (개발용): 인증된 사용자는 자유롭게 쓰고 읽기
CREATE POLICY "Allow UPSERT for authenticated users"
ON facility_subscriptions
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- 누구나 읽기 가능 (플랜 확인용)
CREATE POLICY "Allow Public Read"
ON facility_subscriptions
FOR SELECT
USING (true);

-- 확인
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'facility_subscriptions';
