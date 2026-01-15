-- 1. Fix Categories for known Sangjo companies (Mutual Aid Providers)
-- Targeting the range identified in debug (IDs 2248 to 2284 typically based on import time) 
-- and known names. 
-- Using a broad WHERE clause for known mutual aid company keywords but excluding funeral halls ('장례식장' in name)
UPDATE memorial_spaces
SET category = '상조'
WHERE 
  (
       name LIKE '%프리드%' 
    OR name LIKE '%보람상조%'
    OR name LIKE '%교원라이프%' 
    OR name LIKE '%대명스테이션%'
    OR name LIKE '%더케이%' 
    OR name LIKE '%예다함%'
    OR name LIKE '%부모사랑%'
    OR name LIKE '%더리본%'
    OR name LIKE '%효원%'
    OR name LIKE '%상조%'
    OR name LIKE '%라이프%'
    OR name LIKE '%늘곁애%'
    OR name LIKE '%평화상조%'
    OR name LIKE '%한라상조%'
    OR name LIKE '%재향군인상조%'
    OR name LIKE '%한효%'
  )
  AND name NOT LIKE '%장례식장%' -- Exclude funeral homes operated by them
  AND name NOT LIKE '%병원%'
  AND category != '상조'; -- Prevent redundant updates

-- 2. Update specific Sangjo data with better defaults if missing
-- 프리드라이프
UPDATE memorial_spaces
SET 
  image_url = 'https://www.preedlife.com/images/common/logo_footer.png',
  description = '국내 1위 상조 서비스, 프리드라이프입니다. 200만 회원이 선택한 믿을 수 있는 서비스를 제공합니다.',
  features = ARRAY['전국 직영망', '24시간 상담', '장례지도사 1:1 케어']
WHERE name LIKE '%프리드라이프%' AND category = '상조';

-- 보람상조
UPDATE memorial_spaces
SET 
  image_url = 'https://www.boram.com/images/common/logo.png',
  description = '대한민국 대표 상조, 보람상조입니다. 30년 전통의 고품격 장례 서비스를 약속드립니다.',
  features = ARRAY['업계 최초 가격정찰제', '사이버추모관', '고품격 리무진 서비스']
WHERE name LIKE '%보람상조%' AND category = '상조';

-- 교원라이프
UPDATE memorial_spaces
SET 
  image_url = 'https://www.kyowonlife.co.kr/images/common/logo.png',
  description = '교원라이프는 고객의 삶과 함께하는 토탈 라이프케어 서비스입니다.',
  features = ARRAY['교육/생활 제휴 혜택', '전국 물류망', '투명한 회계']
WHERE name LIKE '%교원라이프%' AND category = '상조';

-- 예다함 (더케이 & 예다함)
UPDATE memorial_spaces
SET 
  image_url = 'https://www.yedaham.co.kr/images/common/logo.gif',
  description = '한국교직원공제회가 만든 믿을 수 있는 상조, 예다함입니다.',
  features = ARRAY['자산지급여력비율 1위', '부당행위 보호', '페이백 시스템']
WHERE (name LIKE '%더케이예다함%' OR name LIKE '%예다함%') AND category = '상조';

-- 부모사랑
UPDATE memorial_spaces
SET 
  image_url = 'https://www.bumo-sarang.com/images/common/logo.png', 
  description = '부모사랑상조는 자본금 100억원의 튼튼한 회사입니다.',
  features = ARRAY['자본금 100억', 'TV CF 방영', '장례이행 보증']
WHERE name LIKE '%부모사랑%' AND category = '상조';

-- 효원상조
UPDATE memorial_spaces
SET 
  image_url = 'http://www.hwand.co.kr/img/common/logo.gif',
  description = '효원상조는 고객의 신뢰를 최우선으로 생각합니다.',
  features = ARRAY['재무안정성', '전문가 그룹', '고객중심']
WHERE name LIKE '%효원%' AND category = '상조';
