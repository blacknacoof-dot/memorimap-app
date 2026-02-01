-- ========================================================================
-- Facility Reviews 최종 통합 해결 스크립트 (V4)
-- ========================================================================
-- 1. RLS 정책 전면 초기화 및 재구성 (22P02 및 403 에러 해결)
-- 2. 상조/장례식장 리뷰어 성씨 마스킹 (익명 -> XX**)
-- 3. 실명 리뷰 마스킹 (최준혁 -> 최**)
-- ========================================================================

BEGIN;

-- ===== STEP 1: 모든 가능한 기존 정책 삭제 (공격적 삭제) =====
-- 테이블의 모든 정책을 한 번에 정리하여 충돌 방지
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN (SELECT policyname FROM pg_policies WHERE tablename = 'facility_reviews') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.facility_reviews', pol.policyname);
    END LOOP;
END $$;

-- ===== STEP 2: RLS 정책 전면 재정의 (JWT sub 직접 사용) =====

-- 1. SELECT (조회): 활성 리뷰는 누구나, 전체는 관리자
CREATE POLICY "Anyone can view active reviews"
ON public.facility_reviews FOR SELECT
USING (
    is_active = true 
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- 2. INSERT (작성): 인증 사용자 전용
CREATE POLICY "Authenticated users can insert"
ON public.facility_reviews FOR INSERT
TO authenticated
WITH CHECK (
    (auth.jwt() ->> 'sub') IS NOT NULL
    OR user_id = 'system_funeral_migration'
);

-- 3. UPDATE (수정 및 소프트 삭제): 본인 및 관리자
-- auth.uid() 대신 (auth.jwt() ->> 'sub') 사용 (22P02 방지 필수)
CREATE POLICY "Users and admins can update reviews"
ON public.facility_reviews FOR UPDATE
TO authenticated
USING (
    user_id = (auth.jwt() ->> 'sub')
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    OR user_id = 'system_funeral_migration'
)
WITH CHECK (true); -- 모든 변경 허용 (소프트 삭제 포함)

-- 4. DELETE (실제 삭제): 본인 및 관리자
CREATE POLICY "Users and admins can delete reviews"
ON public.facility_reviews FOR DELETE
TO authenticated
USING (
    user_id = (auth.jwt() ->> 'sub')
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    OR user_id = 'system_funeral_migration'
);

-- ===== STEP 3: 상조/장례식장 성씨 마스킹 (V4) =====
-- 대상: '상조', 'funeral', '장례식장' 타입 시설
-- 규칙: '익명'은 무작위 성씨로, 실명은 성씨만 남김

WITH target_facility_ids AS (
    SELECT id::text as fid FROM public.facilities 
    WHERE type IN ('상조', 'funeral', '장례식장') OR name LIKE '%장례식장%'
    UNION
    SELECT legacy_id::text FROM public.facilities 
    WHERE (type IN ('상조', 'funeral', '장례식장') OR name LIKE '%장례식장%') 
    AND legacy_id IS NOT NULL
),
surname_list AS (
  SELECT unnest(ARRAY['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임']) as sn
)
UPDATE public.facility_reviews fr
SET author_name = CASE 
    -- '익명'이거나 비어있는 경우: 무작위 성씨 부여
    WHEN (author_name = '익명' OR author_name IS NULL OR author_name = '' OR author_name = 'NULL') 
    THEN (SELECT sn FROM surname_list OFFSET floor(random() * 10) LIMIT 1) || '**'
    
    -- 실명인 경우: 첫 글자(성씨)만 남기고 마스킹
    ELSE left(author_name, 1) || '**'
END
WHERE facility_id IN (SELECT fid FROM target_facility_ids);

COMMIT;

-- ===== 최종 확인 쿼리 =====
DO $$ 
BEGIN
    RAISE NOTICE '✅ RLS 정책 초기화 및 재구성 완료';
    RAISE NOTICE '✅ 상조/장례식장 성씨 마스킹 완료';
END $$;

-- 상조 리뷰 마스킹 현황 출력
SELECT author_name, count(*) 
FROM public.facility_reviews fr
LEFT JOIN public.facilities f ON fr.facility_id = f.id::text OR fr.facility_id = f.legacy_id
WHERE (f.type IN ('상조', 'funeral', '장례식장') OR f.name LIKE '%장례식장%' OR fr.facility_id LIKE 'fc%')
GROUP BY author_name
ORDER BY count(*) DESC;
