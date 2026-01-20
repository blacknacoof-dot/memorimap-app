-- Delete auxiliary facilities misclassified as funeral_home
-- 파일: 20260120_delete_auxiliary_facilities.sql
-- 목적: 주차장, 입구 등 부대시설 데이터 삭제

-- ============================================
-- 1. 삭제 대상 확인 (실행 전 확인용)
-- ============================================

SELECT 
    id,
    name,
    category,
    address
FROM facilities 
WHERE id IN (
    '27cbf87e-c621-4754-b85c-10fd9d1e54b7',
    '6b447f33-47db-4bc7-94fa-dbf1ccb4bc81',
    '428860e6-c04f-4887-a20b-f1454270f9b4',
    'e5302f38-9eba-4e5d-887c-351fad0c2577',
    '3789c2ff-60da-4dd2-bace-3b6fe9ec847f',
    '666f14a7-de31-489c-8cf2-86ab202e53ff',
    '82c7926a-01bb-41ef-8a5a-6b4117f1621a',
    'e0073840-1f9d-47ee-b781-68713d321362',
    '8b0c8f63-fac8-4071-a07c-4aa33034b32a',
    '469320f0-a6f8-4351-b64d-a0d9bb65ba89',
    'd4a042b9-7bf2-4ec6-817e-5ee0758488e5',
    'a3f3e46a-8035-4ea4-923f-d3974f2699e0',
    'd8ea2d7b-2fc1-42b8-a329-3a64a258e453'
);

-- ============================================
-- 2. 삭제 실행
-- ============================================

DELETE FROM facilities
WHERE id IN (
    '27cbf87e-c621-4754-b85c-10fd9d1e54b7', -- 갑을장유병원장례식장지하주차장입구
    '6b447f33-47db-4bc7-94fa-dbf1ccb4bc81', -- 경주하늘마루장례식장전용주차장입구
    '428860e6-c04f-4887-a20b-f1454270f9b4', -- 계룡장례식장입구
    'e5302f38-9eba-4e5d-887c-351fad0c2577', -- 메디팜재활요양병원장례식장입구
    '3789c2ff-60da-4dd2-bace-3b6fe9ec847f', -- 미래한국병원장례식장주차장
    '666f14a7-de31-489c-8cf2-86ab202e53ff', -- 삼천포시민장례식장입구
    '82c7926a-01bb-41ef-8a5a-6b4117f1621a', -- 신천제일요양병원주차장
    'e0073840-1f9d-47ee-b781-68713d321362', -- 아산삼성요양병원주차장
    '8b0c8f63-fac8-4071-a07c-4aa33034b32a', -- 언양요양병원장례식장입구
    '469320f0-a6f8-4351-b64d-a0d9bb65ba89', -- 연세메디하임병원주차장입출구
    'd4a042b9-7bf2-4ec6-817e-5ee0758488e5', -- 인제사랑병원장례식장주차장
    'a3f3e46a-8035-4ea4-923f-d3974f2699e0', -- 장수군 공설장례식장 주차장
    'd8ea2d7b-2fc1-42b8-a329-3a64a258e453'  -- 창녕군공설장례식장주차장
);

-- ============================================
-- 3. 삭제 결과 확인
-- ============================================

DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Deleted % auxiliary facilities', deleted_count;
    RAISE NOTICE 'Expected: 13 records';
    RAISE NOTICE '========================================';
END $$;
