-- memorial_spaces 테이블의 owner_user_id 컬럼에 UNIQUE 제약 조건 추가
-- 이를 통해 한 계정이 여러 시설을 소유하는 것과 한 시설을 여러 계정이 관리하는 것을 금지함 (1:1 관계 강제)

DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'unique_owner_user_id'
    ) THEN
        ALTER TABLE memorial_spaces ADD CONSTRAINT unique_owner_user_id UNIQUE (owner_user_id);
    END IF;
END $$;
