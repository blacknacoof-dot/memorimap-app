-- [RPC 함수 직접 테스트]
-- 지도에서 보내는 것과 비슷한 좌표 범위(한국 전체)로 함수를 호출해봅니다.
-- lat, lng, category 컬럼이 제대로 나오는지 확인합니다.

SELECT * 
FROM search_facilities_in_view(
    33.0, -- min_lat (제주도 남쪽)
    124.0, -- min_lng (서해)
    43.0, -- max_lat (북한 경계)
    132.0 -- max_lng (독도 동쪽)
)
LIMIT 5;
