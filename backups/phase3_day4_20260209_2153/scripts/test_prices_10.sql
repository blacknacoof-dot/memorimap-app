-- 테스트: 10개 장례식장 상세 가격 업데이트

-- 당진종합병원장례식장
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일당","price":96000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '안치실 10만원'
WHERE id = '14529968';

-- 장례식장상예원
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"접객실","name":"봉황관","detail":"시간당","price":35000,"priceDisplay":"4만원"},{"category":"시설임대료","subCategory":"접객실","name":"공작관","detail":"시간당","price":30000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"접객실","name":"백조관","detail":"시간당","price":25000,"priceDisplay":"3만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"시간당","price":7000,"priceDisplay":"7,000원"}]'::jsonb,
    price_range = '안치실 1만원'
WHERE id = '997742163';

-- 법성장례식장
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실","detail":"1일","price":180000,"priceDisplay":"18만원"},{"category":"시설임대료","subCategory":"접객실","name":"접객실","detail":"1일기준 (1시간 35000_","price":500000,"priceDisplay":"50만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1일","price":100000,"priceDisplay":"10만원"},{"category":"안치실이용료","subCategory":"일반","name":"영안실","detail":"#NAME?","price":250000,"priceDisplay":"25만원"}]'::jsonb,
    price_range = '빈소 18만원 / 안치실 10만원'
WHERE id = '15991793';

-- 아산유리요양병원 장례식장
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"특실","detail":"150평형 960000/1일   40000/시간","price":960000,"priceDisplay":"96만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"일반실(1호)","detail":"60평형  720000/1일  30000/시간","price":720000,"priceDisplay":"72만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"일반실(2호)","detail":"60평형  720000/1일  30000/시간","price":720000,"priceDisplay":"72만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"일반실(3호)","detail":"60평형  720000/1일  30000/시간","price":720000,"priceDisplay":"72만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일 120000   5000/시간","price":120000,"priceDisplay":"12만원"}]'::jsonb,
    price_range = '빈소 72~96만원 / 안치실 12만원'
WHERE id = '24976497';

-- 서부산시민장례식장
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실사용료","detail":"1일 기준","price":200000,"priceDisplay":"20만원"}]'::jsonb,
    price_range = '안치실 20만원'
WHERE id = '773184747';

-- 엠마오사랑병원장례식장
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료","detail":"130평1실/1시간당","price":50000,"priceDisplay":"5만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일","price":80000,"priceDisplay":"8만원"}]'::jsonb,
    price_range = '빈소 5만원 / 안치실 8만원'
WHERE id = '12166156';

-- 샘안양병원장례식장
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"3호실 사용료","detail":"시간 사용료24000","price":600000,"priceDisplay":"60만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"256호실 사용료","detail":"시간 사용료30000","price":700000,"priceDisplay":"70만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"7호실 사용료","detail":"시간 사용료38000","price":900000,"priceDisplay":"90만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"1호실 사용료","detail":"시간 사용료32000","price":800000,"priceDisplay":"80만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"원내사망20%감면","detail":"빈소사용료 및 안치료","price":20,"priceDisplay":"20원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"30%감면 (직원직계)","detail":"빈소사용료 및 안치료","price":30,"priceDisplay":"30원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"50%감면(본인사망)","detail":"빈소사용료 및 안치료","price":50,"priceDisplay":"50원"},{"category":"시설임대료","subCategory":"접객실","name":"쓰레기수거료","detail":"빈소 분리 수거료","price":30000,"priceDisplay":"3만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"시간 사용료6000","price":150000,"priceDisplay":"15만원"}]'::jsonb,
    price_range = '빈소 0~90만원 / 안치실 15만원'
WHERE id = '94';

-- 의정부성모장례식장
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료","detail":"50평형(1실/24시간 기준","price":500000,"priceDisplay":"50만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료","detail":"40평형(1실/24시간 기준","price":400000,"priceDisplay":"40만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료","detail":"40평형(1실/24시간 기준","price":400000,"priceDisplay":"40만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일/24시간 기준","price":75000,"priceDisplay":"8만원"}]'::jsonb,
    price_range = '빈소 40~50만원 / 안치실 8만원'
WHERE id = '95';

-- 오포장례식장
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실임대료","detail":"안치실(1일)","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '안치실 10만원'
WHERE id = '96';

-- 안산온누리병원장례식장
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"시간당","price":5000,"priceDisplay":"5,000원"}]'::jsonb,
    price_range = '안치실 1만원'
WHERE id = '101';

