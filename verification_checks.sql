-- verification_checks.sql
-- [Safe Read-Only Checks]
-- Use these to verify data integrity and RLS policy effects.

-------------------------------------------------------
-- 1. 사용자/시설 데이터 샘플 확인
-------------------------------------------------------
SELECT id, user_id, facility_id FROM public.consultations LIMIT 10;
SELECT id, user_id FROM public.facilities LIMIT 10;

-------------------------------------------------------
-- 2. UUID 형식 유효성 검사 (Text 컬럼에 저장된 데이터)
-- 'valid_uuid_format' 카운트가 'non_null...' 카운트와 일치해야 안전합니다.
-------------------------------------------------------

-- A. Consultations user_id
SELECT COUNT(*) AS total_rows,
       COUNT((user_id IS NOT NULL)::int) AS non_null_user_id,
       COUNT( (user_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')::int ) AS valid_uuid_format
FROM public.consultations;

-- B. Consultations facility_id
SELECT 'Consultations facility_id Check' as check_name;
SELECT COUNT(*) AS total_rows,
       COUNT((facility_id IS NOT NULL)::int) AS non_null_facility_id,
       COUNT( (facility_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')::int ) AS valid_uuid_format
FROM public.consultations;

-- C. Facilities user_id
SELECT 'Facilities user_id Check' as check_name;
SELECT COUNT(*) AS total_rows,
       COUNT((user_id IS NOT NULL)::int) AS non_null_user_id,
       COUNT( (user_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')::int ) AS valid_uuid_format
FROM public.facilities;

-------------------------------------------------------
-- 3. RLS 시뮬레이션 (관리자 권한으로 실행하여 필터링 로직 검증)
-------------------------------------------------------

-- 특정 유저(Text ID)가 자신의 상담을 조회할 때와 같은 결과인지 확인
-- '000...001' 자리에 실제 테스트할 user_id를 넣으세요.
SELECT * FROM public.consultations
WHERE user_id = '00000000-0000-0000-0000-000000000001'; 

-- 시설 관리자가 자신의 시설에 접수된 상담을 조회할 때
SELECT c.*
FROM public.consultations c
WHERE EXISTS (
  SELECT 1 FROM public.facilities f
  WHERE f.id::text = c.facility_id
    AND f.user_id = '00000000-0000-0000-0000-000000000001' -- facility owner id (text)
);
