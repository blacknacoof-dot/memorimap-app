-- 20260123_seed_sangjo_companies.sql
-- Description: Seed 'facilities' table with top Korean Sangjo Service companies.
-- Type: '상조' (FacilityCategoryType)

DO $$
DECLARE
    v_user_id text;
BEGIN
    -- 1. Try to find an existing user to assign ownership
    SELECT id::text INTO v_user_id FROM auth.users LIMIT 1;

    -- 2. If no user found, use a Nil UUID placeholder (Safe fallback)
    -- WARNING: If strict FK exists, this might fail unless '0000...' user exists.
    -- If it fails, please replace this string with a REAL user UUID from your Authentication page.
    IF v_user_id IS NULL THEN
        v_user_id := '00000000-0000-0000-0000-000000000000';
    END IF;

    RAISE NOTICE 'Seeding Sangjo companies with owner_id: %', v_user_id;

    -- 3. Clean up old entries
    DELETE FROM public.facilities WHERE name = '에이치디투어존';
    DELETE FROM public.facilities WHERE name LIKE '%에이치디투어존%';
    
    -- Cleanup duplicates of the ones we are about to insert to ensure idempotency
    DELETE FROM public.facilities WHERE name IN (
        '프리드라이프 (Preed Life)', '보람상조 (Boram Sangjo)', '교원라이프 (Kyowon Life)',
        '대명스테이션 (Daemyung Station)', 'The-K 예다함상조', '용인공원 (Yongin Park)', 
        '한경베스트 (Hankyung Best)', '마음상조 (Maeum Sangjo)', '상조114 (Sangjo 114)'
    );

    -- 4. Insert Data
    INSERT INTO public.facilities (
        id,
        name,
        type,
        description,
        address,
        phone,
        website,
        image_url,
        ai_features,
        user_id,
        status
    ) VALUES 
    (
        gen_random_uuid(),
        '보람상조 (Boram Sangjo)',
        '상조',
        '국가대표 상조기업, 30년 전통의 품격 있는 장례 서비스.',
        '서울특별시 중구 세종대로 136, 파이낸스센터',
        '1588-7979',
        'https://www.boram.com',
        '/images/sangjo/보람상조.JPG',
        '{"services": ["장례", "사이버추모관", "직영장례식장"], "grade": "AAA", "rank": 1}',
        v_user_id,
        'active'
    ),
    (
        gen_random_uuid(),
        'The-K 예다함상조',
        '상조',
        '한국교직원공제회가 만든 믿을 수 있는 상조회사.',
        '서울특별시 영등포구 여의나루로 50',
        '1566-6644',
        'https://www.yedaham.co.kr',
        '/images/sangjo/예다함상조.JPG',
        '{"services": ["장례", "제휴할인", "페이백"], "grade": "AAA", "rank": 2}',
        v_user_id,
        'active'
    ),
    (
        gen_random_uuid(),
        '마음상조 (Maeum Sangjo)',
        '상조',
        '진심을 담은 따뜻한 이별, 마음상조가 함께합니다.',
        '서울특별시',
        '1588-0000',
        '',
        '/images/sangjo/마음상조.JPG',
        '{"services": ["장례", "추모", "상담"], "grade": "AA", "rank": 3}',
        v_user_id,
        'active'
    ),
    (
        gen_random_uuid(),
        '상조114 (Sangjo 114)',
        '상조',
        '투명하고 정직한 상조 서비스 비교 및 상담.',
        '서울특별시',
        '114',
        '',
        '/images/sangjo/상조114.JPG',
        '{"services": ["상조비교", "무료상담"], "grade": "A", "rank": 4}',
        v_user_id,
        'active'
    ),
    (
        gen_random_uuid(),
        '프리드라이프 (Preed Life)',
        '상조',
        '대한민국 1등 상조, 자산총액 및 선수금 1위. 토탈 라이프 케어 서비스 제공.',
        '서울특별시 중구 소월로2길 30, 남산트라팰리스 T타워',
        '1588-3740',
        'https://www.preedlife.com',
        'https://www.preedlife.com/static/images/common/logo.png',
        '{"services": ["장례", "웨딩", "크루즈", "투어"], "grade": "AAA", "rank": 5}',
        v_user_id,
        'active'
    ),
    (
        gen_random_uuid(),
        '교원라이프 (Kyowon Life)',
        '상조',
        '교원그룹의 신뢰를 바탕으로 한 고품격 상조 서비스.',
        '서울특별시 종로구 청계천로 1',
        '1588-0077',
        'https://www.kyowonlife.co.kr',
        'https://www.kyowonlife.co.kr/images/common/logo.png',
        '{"services": ["장례", "웨딩", "교육전환"], "grade": "AA+", "rank": 6}',
        v_user_id,
        'active'
    ),
    (
        gen_random_uuid(),
        '대명스테이션 (Daemyung Station)',
        '상조',
        '대명소노그룹의 레저 인프라와 결합한 신개념 라이프 케어.',
        '서울특별시 송파구 법원로 135',
        '1588-8511',
        'https://www.daemyungstation.com',
        'https://www.daemyungstation.com/images/common/logo.png',
        '{"services": ["장례", "여행", "웨딩", "멤버십"], "grade": "AA+", "rank": 7}',
        v_user_id,
        'active'
    );
END $$;
