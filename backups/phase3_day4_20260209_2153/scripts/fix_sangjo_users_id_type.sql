-- id 컬럼을 UUID에서 TEXT로 변경하여 Clerk ID를 지원하도록 수정
-- 1. 기존 외래 키 제약 조건 제거 (존재하는 경우)
ALTER TABLE sangjo_dashboard_users DROP CONSTRAINT IF EXISTS sangjo_dashboard_users_id_fkey;

-- 2. 컬럼 타입 변경
ALTER TABLE sangjo_dashboard_users ALTER COLUMN id TYPE TEXT;

-- 3. RLS 정책 재확인 (필요시)
-- 이미 '대시보드 유저 정보 전원 공개' 정책 등이 true로 설정되어 있어 조회가 가능할 것입니다.
