-- consultations 테이블의 user_id 컬럼 타입을 UUID에서 TEXT로 변경
-- Clerk ID(예: user_2s...)를 저장하기 위함입니다.
ALTER TABLE consultations
  ALTER COLUMN user_id TYPE text USING user_id::text;

-- (선택사항) 만약 user_id에 대한 기존 FK 제약조건이 있다면 삭제해야 할 수도 있습니다.
-- ALTER TABLE consultations DROP CONSTRAINT IF EXISTS consultations_user_id_fkey;
