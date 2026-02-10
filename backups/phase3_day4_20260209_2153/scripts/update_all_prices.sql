-- 장례식장 가격 일괄 업데이트
-- 총 822개 시설
-- 생성일: 2025-12-26T07:24:59.505Z

-- 오산장례문화원 (오산장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향소 및 접객실 / 201호 (특실)","detail":"95 평형 1일 / 24시간 기준","price":890000,"priceDisplay":"89만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향소 및 접객실 / 302호","detail":"65 평형 1일 / 24시간 기준","price":590000,"priceDisplay":"59만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향소 및 접객실 / 303호","detail":"85 평형 1일 / 24시간 기준","price":790000,"priceDisplay":"79만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향소 및 접객실 / 301호","detail":"65 평형 1일 / 24시간 기준","price":590000,"priceDisplay":"59만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향소 및 접객실 / 101호","detail":"50 평형 1일 / 24시간 기준","price":400000,"priceDisplay":"40만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향소 및 접객실 / 202호 (특실)","detail":"120평형 1일 / 24시간 기준","price":1090000,"priceDisplay":"109만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향소 및 접객실 / 402호 (VIP)","detail":"150평형 1일 / 24시간 기준","price":1350000,"priceDisplay":"135만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향소 및 접객실 / 401호","detail":"65 평형 1일 / 24시간 기준","price":590000,"priceDisplay":"59만원"},{"category":"안치실이용료","subCategory":"일반","name":"시신보관실 / 안치료","detail":"1일 / 24시간 기준","price":90000,"priceDisplay":"9만원"}]'::jsonb,
    price_range = '빈소 40~135만원 / 안치실 9만원'
WHERE id = '99';

-- 양서농협장례문화원 (양서농협장례문화원)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"201202호 빈소+접객실(55.2평)","detail":"1일기준","price":1300000,"priceDisplay":"130만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"101호 빈소+접객실(26.38평)","detail":"1일기준","price":500000,"priceDisplay":"50만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"301호 빈소+접객실(72평)","detail":"1일기준","price":1900000,"priceDisplay":"190만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"302호 빈소+접객실(41.38평)","detail":"1일기준","price":900000,"priceDisplay":"90만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일기준","price":200000,"priceDisplay":"20만원"}]'::jsonb,
    price_range = '빈소 50~190만원 / 안치실 20만원'
WHERE id = '102';

-- 백년장례문화원 (백년장례문화원)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"일반실(빈소접객실사용료)","detail":"50평","price":500000,"priceDisplay":"50만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특1호실(빈소접객실사용료)","detail":"100평","price":900000,"priceDisplay":"90만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"일반실(빈소접객실사용료)","detail":"60평","price":600000,"priceDisplay":"60만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"일반실(빈소.접객실사용료)","detail":"40평","price":400000,"priceDisplay":"40만원"},{"category":"안치실이용료","subCategory":"기타","name":"안치관리비","detail":"1일 / 24 시간 기준","price":120000,"priceDisplay":"12만원"}]'::jsonb,
    price_range = '빈소 40~90만원 / 안치실 12만원'
WHERE id = '103';

-- 주식회사 헤븐앤어스 (주식회사 헤븐앤어스)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"일","price":96000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '안치실 10만원'
WHERE id = '104';

-- 봉담장례문화원 (봉담장례문화원)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료(백송실 45평)","detail":"1실 / 24시간기준","price":290000,"priceDisplay":"29만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료(적송실 85평)","detail":"1실 / 24시간기준","price":780000,"priceDisplay":"78만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료(금송실 95평)","detail":"1실 / 24시간기준","price":880000,"priceDisplay":"88만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료(해당화실 120평)","detail":"1실 / 24시간기준","price":1080000,"priceDisplay":"108만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료(무궁화실 130평)","detail":"1실 / 24시간기준","price":1080000,"priceDisplay":"108만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료(진달래실 100평)","detail":"1실 / 24시간기준","price":980000,"priceDisplay":"98만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일 / 24시간기준","price":120000,"priceDisplay":"12만원"}]'::jsonb,
    price_range = '빈소 29~108만원 / 안치실 12만원'
WHERE id = '106';

-- 시흥장례원 (시흥장례원)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일(5000원*24시간)","price":120000,"priceDisplay":"12만원"},{"category":"안치실이용료","subCategory":"기타","name":"야간염습(18시 이후)","detail":"야간염습(18시 이후)","price":400000,"priceDisplay":"40만원"},{"category":"안치실이용료","subCategory":"기타","name":"염습(2인1조)","detail":"염습(2인1조)","price":350000,"priceDisplay":"35만원"}]'::jsonb,
    price_range = '안치실 12만원'
WHERE id = '107';

-- 효원장례문화센타 (효원장례문화센타)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향 및 접객실","detail":"2호특실(100평)/1일","price":700000,"priceDisplay":"70만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향 및 접객실","detail":"5호7호(65평)/1일","price":480000,"priceDisplay":"48만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향 및 접객실","detail":"1호특실(100평)/1일","price":800000,"priceDisplay":"80만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향 및 접객실","detail":"6호(80평)/1일","price":550000,"priceDisplay":"55만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향 및 접객실","detail":"3호(100평)/1일","price":650000,"priceDisplay":"65만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일","price":60000,"priceDisplay":"6만원"}]'::jsonb,
    price_range = '빈소 48~80만원 / 안치실 6만원'
WHERE id = '108';

-- 양수삼성장례식장 (양수삼성장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"입관실 사용료(상조자체입관시)","detail":"1회","price":300000,"priceDisplay":"30만원"},{"category":"안치실이용료","subCategory":"일반","name":"분향실 사용료","detail":"1시간","price":23000,"priceDisplay":"2만원"},{"category":"안치실이용료","subCategory":"일반","name":"특수 냉장 안치료","detail":"1시간","price":9000,"priceDisplay":"9,000원"},{"category":"안치실이용료","subCategory":"일반","name":"일반 냉장 안치료","detail":"1시간","price":8000,"priceDisplay":"8,000원"}]'::jsonb,
    price_range = '안치실 1만원'
WHERE id = '111';

-- 가평연새장례식장 (가평연새장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"시신 안치료(1일기준)","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '안치실 10만원'
WHERE id = '115';

-- 경기도의료원 포천병원장례식장 (경기도의료원 포천병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소+접객실(100평형)","detail":"1일","price":840000,"priceDisplay":"84만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소+접객실(50평형)","detail":"1일","price":420000,"priceDisplay":"42만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소+접객실(30평형)","detail":"1일","price":252000,"priceDisplay":"25만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소+접객실(40평형)","detail":"1일","price":336000,"priceDisplay":"34만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일","price":72000,"priceDisplay":"7만원"}]'::jsonb,
    price_range = '빈소 25~84만원 / 안치실 7만원'
WHERE id = '116';

-- 효병원장례식장 (부안효병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"기타","name":"안치1호~4호","detail":"시간당","price":5000,"priceDisplay":"5,000원"}]'::jsonb,
    price_range = '안치실 1만원'
WHERE id = '117';

-- 양평병원장례식장 (양평병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소+접객실 (231m2)","detail":"1일 24시간 기준","price":800000,"priceDisplay":"80만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일 24시간 기준","price":120000,"priceDisplay":"12만원"}]'::jsonb,
    price_range = '빈소 80만원 / 안치실 12만원'
WHERE id = '118';

-- 용문장례식장 (용문장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1일","price":150000,"priceDisplay":"15만원"}]'::jsonb,
    price_range = '안치실 15만원'
WHERE id = '119';

-- 무주군보건의료원장례식장 (무주군보건의료원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"기타","name":"사용료감면1분향실","detail":"1일","price":150000,"priceDisplay":"15만원"}]'::jsonb,
    price_range = '안치실 15만원'
WHERE id = '12280233';

-- 자미원스카이장례식장 (스카이장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"시신안치","price":150000,"priceDisplay":"15만원"}]'::jsonb,
    price_range = '안치실 15만원'
WHERE id = '124';

-- 용인시민장례문화원 (용인시민장례문화원)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"VIP실","detail":"100평","price":49000,"priceDisplay":"5만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"일반실","detail":"40평","price":26000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특실","detail":"60평","price":30000,"priceDisplay":"3만원"},{"category":"안치실이용료","subCategory":"일반","name":"","detail":"","price":7000,"priceDisplay":"7,000원"}]'::jsonb,
    price_range = '빈소 3~5만원 / 안치실 1만원'
WHERE id = '125';

-- 양주장례문화원 (양주장례문화원)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실사용료","detail":"1시간","price":4000,"priceDisplay":"4,000원"}]'::jsonb,
    price_range = '안치실 0만원'
WHERE id = '126';

-- 큰길장례문화원 (큰길장례문화원)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실 사용료","detail":"시간당","price":4000,"priceDisplay":"4,000원"}]'::jsonb,
    price_range = '안치실 0만원'
WHERE id = '127';

-- 양평 갈월장례식장 (양평 갈월장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"24시간","price":240000,"priceDisplay":"24만원"}]'::jsonb,
    price_range = '안치실 24만원'
WHERE id = '129';

-- 고아농협 장례문화원 (고아농협 장례문화원)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"101호실 시간당","detail":"225m2","price":33000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"201호실 시간당","detail":"219m2","price":29000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특 실 시간당","detail":"245m2","price":41000,"priceDisplay":"4만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실 시간당","detail":"27m2","price":4000,"priceDisplay":"4,000원"}]'::jsonb,
    price_range = '빈소 3~4만원 / 안치실 0만원'
WHERE id = '130';

-- 남구미요양병원장례식장 (남구미요양병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"기타","name":"고인 안치 (24시간)","detail":"","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '안치실 10만원'
WHERE id = '131';

-- 수성요양병원장례식장 (수성요양병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"사체안치료 1일","price":96000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '안치실 10만원'
WHERE id = '147';

-- 해동병원장례식장 (해동병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"안치료    1일(시간/4.000원)","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '안치실 10만원'
WHERE id = '148';

-- (주)예담 활주로장례식장 ((주)예담 활주로장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"기타","name":"사체 냉장실","detail":"1회당","price":200000,"priceDisplay":"20만원"}]'::jsonb,
    price_range = '안치실 20만원'
WHERE id = '573367821';

-- 동전주 장례문화원 (동전주 장례문화원)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"특3호 5호","detail":"33058m2","price":1056000,"priceDisplay":"106만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"동전주실","detail":"16529m2","price":840000,"priceDisplay":"84만원"}]'::jsonb,
    price_range = '빈소 84~106만원'
WHERE id = '157';

-- 늘푸른장례식장 (늘푸른장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"특2호","detail":"3일중 1일 적용","price":500000,"priceDisplay":"50만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특1호","detail":"3일중 1일 적용","price":600000,"priceDisplay":"60만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"3호","detail":"3일중 1일 적용","price":400000,"priceDisplay":"40만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 40~60만원 / 안치실 10만원'
WHERE id = '18553410';

-- 한일병원장례식장 (21C한일병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"특실(분향실+상주실+접객실)","detail":"1일","price":700000,"priceDisplay":"70만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"고급(분향실+상주실+접객실)","detail":"1일","price":500000,"priceDisplay":"50만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실이용료","detail":"1일","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 50~70만원 / 안치실 10만원'
WHERE id = '17085739';

-- 양주소망장례식장 (양주소망장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료(약40평)","detail":"1일/시간 기준","price":25000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료(약90평)","detail":"1일/시간 기준","price":35000,"priceDisplay":"4만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료(약90평)","detail":"1일/시간 기준","price":35000,"priceDisplay":"4만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료(약40평)","detail":"1일/시간 기준","price":25000,"priceDisplay":"3만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실료","detail":"1일/시간 기준","price":8000,"priceDisplay":"8,000원"}]'::jsonb,
    price_range = '빈소 3~4만원 / 안치실 1만원'
WHERE id = '128';

-- 회천농협장례문화원 (회천농협장례문화원)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"시간당","price":4000,"priceDisplay":"4,000원"}]'::jsonb,
    price_range = '안치실 0만원'
WHERE id = '109';

-- 복지장례문화원 (복지장례문화원)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"2층 특1호실 (시간당 35000원)","detail":"65평형 / 1일 / 접객실분향실상주휴게실 포함","price":840000,"priceDisplay":"84만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"5층 VVIP실 (시간당 63000원)","detail":"150평형 / 1일 / 접객실분향실상주휴게실 포함","price":1512000,"priceDisplay":"151만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"6층 특3호실 (시간당 38000원)","detail":"70평형 / 1일 / 접객실분향실상주휴게실 포함","price":912000,"priceDisplay":"91만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"2층 복지1호실 (시간당 22000원)","detail":"40평형 / 1일 / 접객실분향실상주휴게실 포함","price":528000,"priceDisplay":"53만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"3층 VIP실 (시간당 45000원)","detail":"80평형 / 1일 / 접객실분향실상주휴게실 포함","price":1080000,"priceDisplay":"108만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"3층 특2호실 (시간당 38000원)","detail":"70평형 / 1일 / 접객실분향실상주휴게실 포함","price":912000,"priceDisplay":"91만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"2층 복지2호실 (시간당 22000원)","detail":"40평형 / 1일 / 접객실분향실상주휴게실 포함","price":528000,"priceDisplay":"53만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료 1일(24시간)","detail":"1시간 4200원","price":100800,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 53~151만원 / 안치실 10만원'
WHERE id = '149';

-- 나진장례식장 (나진장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소 / 접객실","detail":"6호실  20평 / 시간당 16000","price":384000,"priceDisplay":"38만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소 / 접객실","detail":"5호실  50평 / 시간당 30000","price":720000,"priceDisplay":"72만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소 / 접객실","detail":"3호실  60평 / 시간당 35000","price":840000,"priceDisplay":"84만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소 / 접객실","detail":"특2호실  80평 / 시간당 45000","price":1080000,"priceDisplay":"108만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소 / 접객실","detail":"특1호실 120평 / 시간당 54000","price":1296000,"priceDisplay":"130만원"}]'::jsonb,
    price_range = '빈소 38~130만원'
WHERE id = '89';

-- 충주병원장례식장(주) (충주병원장례식장(주))
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소/접객실사용료  101호실","detail":"25평형/83제곱미터/1일","price":200000,"priceDisplay":"20만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소/접객실사용료  201호실(특)","detail":"130평형/430제곱미터/1일","price":900000,"priceDisplay":"90만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소/접객실사용료  301호실(특)","detail":"130평형/430제곱미터/1일","price":900000,"priceDisplay":"90만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소/접객실사용료  501호실(별관)","detail":"50평형/165제곱미터/1일","price":400000,"priceDisplay":"40만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소/접객실사용료  401호실","detail":"100평형/330제곱미터/1일","price":700000,"priceDisplay":"70만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실사용료","detail":"1일","price":60000,"priceDisplay":"6만원"}]'::jsonb,
    price_range = '빈소 20~90만원 / 안치실 6만원'
WHERE id = '25677611';

-- 양양장례문화원 (양양장례문화원)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소및 접객실","detail":"빈소및 접겍실 사용료시간당","price":15000,"priceDisplay":"2만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"안치료시간당","price":5000,"priceDisplay":"5,000원"}]'::jsonb,
    price_range = '빈소 2만원 / 안치실 1만원'
WHERE id = '93';

-- 양평장례식장 (양평장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"","name":"안치료","detail":"1일 120000원/ 시간당 5000원","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '안치실 10만원'
WHERE id = '123';

-- 포항성모병원장례식장 (포항성모병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"65.84m2/시간당","price":2000,"priceDisplay":"2,000원"},{"category":"안치실이용료","subCategory":"일반","name":"(확진자)안치료","detail":"65.84m2/시간당","price":4000,"priceDisplay":"4,000원"}]'::jsonb,
    price_range = '안치실 0만원'
WHERE id = '133';

-- (주)코스모스제일장례식장 ((주)코스모스제일장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"일반실","detail":"50평(빈소 접객실 가족휴게실)","price":500000,"priceDisplay":"50만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특실","detail":"200평(빈소 접객실 가족휴게실)","price":1500000,"priceDisplay":"150만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"고급실","detail":"100평(빈소 접객실 가족휴게실)","price":1000000,"priceDisplay":"100만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료 1일","detail":"시신 안치","price":120000,"priceDisplay":"12만원"}]'::jsonb,
    price_range = '빈소 50~150만원 / 안치실 12만원'
WHERE id = '97';

-- 강화병원장례식장 (강화병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"별관 1층(20평)","detail":"12시간 이상~ 24시간 미만은 1일로 산정 - 12시간 미만 시간단위 1시간 미만은 1시간 산정.","price":480000,"priceDisplay":"48만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"별관 2층(50평)","detail":"12시간 이상~ 24시간 미만은 1일로 산정 - 12시간 미만 시간단위 1시간 미만은 1시간 산정.","price":600000,"priceDisplay":"60만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"본관 특1호실(80평)","detail":"12시간 이상~ 24시간미만은1일로 산정-12신간 미만 시간단위 1시간 미만은 1시간 산정.","price":720000,"priceDisplay":"72만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실 냉장고","detail":"3일 이내~ 발인까지","price":270000,"priceDisplay":"27만원"}]'::jsonb,
    price_range = '빈소 48~72만원 / 안치실 27만원'
WHERE id = '24744963';

-- 여주시민장례문화원 ((주)시민장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1일","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '안치실 10만원'
WHERE id = '110';

-- 가평군농협효문화센터 (가평군농협효문화센터)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"접객실 사용료(30평)","detail":"21000*24시간  1일","price":21000,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"접객실","name":"옆접객실 이용요금","detail":"","price":16700,"priceDisplay":"2만원"},{"category":"안치실이용료","subCategory":"일반","name":"시신 안치료","detail":"4500*24시간  1일","price":4500,"priceDisplay":"4,500원"}]'::jsonb,
    price_range = '빈소 2~2만원 / 안치실 0만원'
WHERE id = '120';

-- 청송군보건의료원장례식장 (청송군보건의료원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실비용","detail":"1일","price":50000,"priceDisplay":"5만원"}]'::jsonb,
    price_range = '안치실 5만원'
WHERE id = '140';

-- 신세계병원장례식장 (신세계병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실 특실2호(1일 기준) 50%할인적용","detail":"66평","price":650000,"priceDisplay":"65만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실 VIP실(1일기준)관내이용자50%할인적용","detail":"118평","price":1100000,"priceDisplay":"110만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실 특1호실(1일기준) 50%할인적용","detail":"66평","price":650000,"priceDisplay":"65만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실 (냉장시설) 하루사용기준","detail":"1일사용료/시간금액(1시간:10000원)","price":150000,"priceDisplay":"15만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1일 기준","price":80000,"priceDisplay":"8만원"}]'::jsonb,
    price_range = '빈소 65~110만원 / 안치실 8만원'
WHERE id = '1088466875';

-- 나주장례식장 (나주장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1일","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '안치실 10만원'
WHERE id = '8226797';

-- 봉화군산림조합장례식장 (봉화군산림조합장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"1호실 1일","detail":"153m2","price":460000,"priceDisplay":"46만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"1호실 1시간","detail":"153m2","price":38000,"priceDisplay":"4만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"2호실 1일","detail":"130.9m2","price":420000,"priceDisplay":"42만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"2호실 1시간","detail":"130.9m2","price":35000,"priceDisplay":"4만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"3호실 1일","detail":"200.7m2","price":624000,"priceDisplay":"62만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"3호실 1시간","detail":"200.7m2","price":52000,"priceDisplay":"5만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실 1시간","detail":"","price":5000,"priceDisplay":"5,000원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실 1일","detail":"","price":70000,"priceDisplay":"7만원"}]'::jsonb,
    price_range = '빈소 4~62만원 / 안치실 1만원'
WHERE id = '135';

-- 안중장례문화센타 (안중장례문화센타)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실.접객실","detail":"진달래실(준특실)85평/시간당 25000","price":600000,"priceDisplay":"60만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실.접객실","detail":"무궁화실(특실)150평/시간당35000","price":840000,"priceDisplay":"84만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실.접객실","detail":"수국실(일반실)75평/시간당     20000","price":480000,"priceDisplay":"48만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실.접객실","detail":"동백실(일반실)75평/시간당    20000","price":480000,"priceDisplay":"48만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실.접객실","detail":"백송실(일반실)75평/시간당    20000","price":480000,"priceDisplay":"48만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실.접객실","detail":"주목실(일반실)75평/시간당    20000","price":480000,"priceDisplay":"48만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1시간/3000 /1일","price":72000,"priceDisplay":"7만원"}]'::jsonb,
    price_range = '빈소 48~84만원 / 안치실 7만원'
WHERE id = '105';

-- 여수제일병원장례식장 (여수제일병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"냉동안치료","detail":"시간당요금","price":6000,"priceDisplay":"6,000원"}]'::jsonb,
    price_range = '안치실 1만원'
WHERE id = '11672512';

-- 검단탑병원장례식장 (검단탑병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"임대료","detail":"1실 24시간(특실)","price":840000,"priceDisplay":"84만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소이용료(특1호)","detail":"24시간","price":840000,"priceDisplay":"84만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소이용료(특2호)","detail":"24시간","price":840000,"priceDisplay":"84만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"임대료","detail":"1실 24시간(보통)","price":576000,"priceDisplay":"58만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소이용료(5호실)","detail":"24시간","price":672000,"priceDisplay":"67만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소이용료(3호실)","detail":"24시간","price":576000,"priceDisplay":"58만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"임대료","detail":"1실 24시간(보통)","price":672000,"priceDisplay":"67만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"24시간","price":120000,"priceDisplay":"12만원"}]'::jsonb,
    price_range = '빈소 58~84만원 / 안치실 12만원'
WHERE id = '154';

-- 남양주혜성병원장례식장 (혜성병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일","price":80000,"priceDisplay":"8만원"}]'::jsonb,
    price_range = '안치실 8만원'
WHERE id = '114';

-- 비에스종합병원장례식장 (비에스종합병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"특3","detail":"110평 (가족실 포함)","price":1000000,"priceDisplay":"100만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"vip1vip2실","detail":"105평 (가족실 포함)","price":1000000,"priceDisplay":"100만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특1특2실","detail":"95평 (가족실 포함)","price":800000,"priceDisplay":"80만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일","price":120000,"priceDisplay":"12만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1시간","price":5000,"priceDisplay":"5,000원"}]'::jsonb,
    price_range = '빈소 80~100만원 / 안치실 1만원'
WHERE id = '1177698384';

-- 별그리다(사담재) (별그리다(사담재))
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소사용료","detail":"빈소접객실상주휴게실 사용료(시간당)","price":50000,"priceDisplay":"5만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"안치실(냉장실) 사용료(시간당)","price":3000,"priceDisplay":"3,000원"}]'::jsonb,
    price_range = '빈소 5만원 / 안치실 0만원'
WHERE id = '121';

-- 근로복지공단 대전병원 장례식장 (근로복지공단대전병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"기타","name":"안치실","detail":"시간","price":2000,"priceDisplay":"2,000원"}]'::jsonb,
    price_range = '안치실 0만원'
WHERE id = '7830877';

-- 부산보훈병원장례식장 (부산보훈병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실 임대료","detail":"1일 사용료","price":50000,"priceDisplay":"5만원"}]'::jsonb,
    price_range = '안치실 5만원'
WHERE id = '25083539';

-- 효사랑요양병원장례식장 (효사랑요양병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"접객실","name":"특3실(빈소+접객실)","detail":"1일","price":300000,"priceDisplay":"30만원"},{"category":"시설임대료","subCategory":"접객실","name":"특2실(빈소+접객실)","detail":"1일","price":480000,"priceDisplay":"48만원"},{"category":"시설임대료","subCategory":"접객실","name":"특1실(빈소+접객실)","detail":"1일","price":600000,"priceDisplay":"60만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일","price":96000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 30~60만원 / 안치실 10만원'
WHERE id = '132';

-- 영동장례식장 (영동장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료(특 120평)","detail":"사용시간당","price":32000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료(일반 90평95평)","detail":"사용시간당","price":25000,"priceDisplay":"3만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실사용료","detail":"1일당","price":50000,"priceDisplay":"5만원"}]'::jsonb,
    price_range = '빈소 3~3만원 / 안치실 5만원'
WHERE id = '162';

-- 동창원장례식장 (동창원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"105호","detail":"1일","price":400000,"priceDisplay":"40만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"102호","detail":"1일","price":800000,"priceDisplay":"80만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"103호","detail":"1일","price":600000,"priceDisplay":"60만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일","price":90000,"priceDisplay":"9만원"}]'::jsonb,
    price_range = '빈소 40~80만원 / 안치실 9만원'
WHERE id = '1566710705';

-- 횡성삼성병원장례식장 (삼성병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실 1일","detail":"시간당 4000","price":96000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '안치실 10만원'
WHERE id = '91';

-- 경산중앙병원장례식장 (경산중앙병원장례예식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실(일반실)","detail":"1일(17500/1시간)","price":420000,"priceDisplay":"42만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실(특실)","detail":"1일(35000/1시간)","price":840000,"priceDisplay":"84만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1일(4000/1시간)","price":96000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 42~84만원 / 안치실 10만원'
WHERE id = '134';

-- 단원병원 장례문화원 (원병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소/접객실 임대료","detail":"특실 1일/24시간기준","price":840000,"priceDisplay":"84만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소/접객실 임대료","detail":"일반 1일/24시간기준","price":480000,"priceDisplay":"48만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"환경관리비","detail":"1인기준","price":30000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소/접객실 임대료","detail":"중실 1일/24시간기준","price":552000,"priceDisplay":"55만원"},{"category":"안치실이용료","subCategory":"기타","name":"안치관리비","detail":"1일/24시간기준","price":120000,"priceDisplay":"12만원"}]'::jsonb,
    price_range = '빈소 3~84만원 / 안치실 12만원'
WHERE id = '868214786';

-- 주식회사하늘정원장례식장 (주식회사하늘정원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"접객실","name":"2층 특1호실(시간당)","detail":"231㎡(시간당)","price":10000,"priceDisplay":"1만원"},{"category":"시설임대료","subCategory":"접객실","name":"3층 vip실(시간당)","detail":"396㎡(시간당)","price":20000,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"접객실","name":"2층 특2호실(시간당)","detail":"231㎡(시간당)","price":10000,"priceDisplay":"1만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실(시간당)","detail":"33㎡(시간당)","price":2700,"priceDisplay":"2,700원"}]'::jsonb,
    price_range = '빈소 1~2만원 / 안치실 0만원'
WHERE id = '1421378431';

-- 한패밀리병원장례식장 (한패밀리병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일(시간당3000)","price":72000,"priceDisplay":"7만원"}]'::jsonb,
    price_range = '안치실 7만원'
WHERE id = '146';

-- 유성한가족병원 장례식장 (유성한가족병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"시간당","price":3000,"priceDisplay":"3,000원"}]'::jsonb,
    price_range = '안치실 0만원'
WHERE id = '1006';

-- 시민장례식장 (시민장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"특1호실(70평)","detail":"분향실/접객실/상주방/화장실/샤워실","price":650000,"priceDisplay":"65만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특2호실(80평)","detail":"분향실/접객실/상주방/화장실/샤워실","price":750000,"priceDisplay":"75만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"VIP실(105평)","detail":"분향실/접객실/상주방/화장실/샤워실","price":900000,"priceDisplay":"90만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실 사용료","detail":"1일 사용료","price":100000,"priceDisplay":"10만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1일 기준","price":72000,"priceDisplay":"7만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"사용료(시간당)","price":4000,"priceDisplay":"4,000원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실사용료","detail":"1일","price":48000,"priceDisplay":"5만원"}]'::jsonb,
    price_range = '빈소 65~90만원 / 안치실 0만원'
WHERE id = '1007';

-- 창원경상국립대학교병원 장례식장 (경상국립대학교병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"102호","detail":"시간당","price":29200,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"101호","detail":"1일당","price":900000,"priceDisplay":"90만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"101호","detail":"시간당","price":37500,"priceDisplay":"4만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"102호","detail":"1일당","price":700000,"priceDisplay":"70만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"201호","detail":"시간당","price":21000,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"201호","detail":"1일당","price":500000,"priceDisplay":"50만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"205호","detail":"시간당","price":11000,"priceDisplay":"1만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"202.203204206207호","detail":"시간당","price":14340,"priceDisplay":"1만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"202.203204206207호","detail":"1일당","price":344000,"priceDisplay":"34만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"205호","detail":"1일당","price":264000,"priceDisplay":"26만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"시간당","price":7000,"priceDisplay":"7,000원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일당","price":80000,"priceDisplay":"8만원"}]'::jsonb,
    price_range = '빈소 1~90만원 / 안치실 1만원'
WHERE id = '2074852708';

-- 한솔장례식장 (한솔장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료(일반)","detail":"1일/24시간기준 (생활보호대상자국가유공자 10% D.C)","price":200000,"priceDisplay":"20만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료(일반)","detail":"1일/24시간기준 (생활보호대상자국가유공자 10% D.C)","price":300000,"priceDisplay":"30만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료(특)","detail":"1일/24시간기준 (생활보호대상자국가유공자 10% D.C)","price":450000,"priceDisplay":"45만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료(특)","detail":"1일/24시간기준 (생활보호대상자국가유공자 10% D.C)","price":380000,"priceDisplay":"38만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"","price":50000,"priceDisplay":"5만원"}]'::jsonb,
    price_range = '빈소 20~45만원 / 안치실 5만원'
WHERE id = '16212627';

-- 관산정남진장례식장 (관산정남진장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소 임대료(30평)","detail":"1일","price":400000,"priceDisplay":"40만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일","price":70000,"priceDisplay":"7만원"}]'::jsonb,
    price_range = '빈소 40만원 / 안치실 7만원'
WHERE id = '17250603';

-- 국립중앙의료원 장례식장 (국립중앙의료원)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 빈소 임대료(132㎡)","detail":"1일","price":672000,"priceDisplay":"67만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 빈소 임대료(특실)","detail":"1일","price":1080000,"priceDisplay":"108만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 빈소 임대료(66㎡)","detail":"1일","price":276000,"priceDisplay":"28만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 빈소 임대료(116㎡)","detail":"1일","price":564000,"priceDisplay":"56만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 빈소 임대료(181㎡)","detail":"1일","price":822000,"priceDisplay":"82만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 빈소 임대료(특실)","detail":"1일","price":936000,"priceDisplay":"94만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일","price":60000,"priceDisplay":"6만원"}]'::jsonb,
    price_range = '빈소 28~108만원 / 안치실 6만원'
WHERE id = '11964532';

-- 상주장례식장 (상주장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일","price":72000,"priceDisplay":"7만원"}]'::jsonb,
    price_range = '안치실 7만원'
WHERE id = '7934561';

-- 충남대학교병원 장례식장 (세종충남대학교병원 쉴낙원 장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"vip1호실","detail":"120평","price":1080000,"priceDisplay":"108만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특3호실","detail":"75평","price":840000,"priceDisplay":"84만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특2호실","detail":"74평","price":840000,"priceDisplay":"84만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"안치실","price":84000,"priceDisplay":"8만원"}]'::jsonb,
    price_range = '빈소 84~108만원 / 안치실 8만원'
WHERE id = '10843980';

-- 대전보훈병원 장례식장 (대전보훈병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실 사용료","detail":"시간당*2000 1일기준","price":48000,"priceDisplay":"5만원"}]'::jsonb,
    price_range = '안치실 5만원'
WHERE id = '14650772';

-- 신풍장례문화원 (신풍장례문화원)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"특2호실","detail":"65평 / 시간당 35000월","price":840000,"priceDisplay":"84만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"101호실","detail":"56평 / 시간당 30000원","price":720000,"priceDisplay":"72만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"102호실","detail":"41평 / 시간당 20000원","price":480000,"priceDisplay":"48만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특1호실","detail":"121평 / 시간당 40000원","price":960000,"priceDisplay":"96만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"일","price":50000,"priceDisplay":"5만원"}]'::jsonb,
    price_range = '빈소 48~96만원 / 안치실 5만원'
WHERE id = '212';

-- 서해병원장례식장 (신협서해병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"시간당","price":6000,"priceDisplay":"6,000원"}]'::jsonb,
    price_range = '안치실 1만원'
WHERE id = '213';

-- 쉴낙원 남대전장례식장 (쉴낙원 남대전장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"24시간 기준","price":48000,"priceDisplay":"5만원"}]'::jsonb,
    price_range = '안치실 5만원'
WHERE id = '16386496';

-- 푸디스트 쉴낙원남대전장례식장 (쉴낙원 남대전장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"24시간 기준","price":48000,"priceDisplay":"5만원"}]'::jsonb,
    price_range = '안치실 5만원'
WHERE id = '1083906671';

-- 대전장례식장 (대전장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소/접객실 사용료","detail":"2호실 198㎡60평/시간당 25000원","price":600000,"priceDisplay":"60만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소/접객실 사용료","detail":"1호실 198㎡60평/시간당 25000원","price":600000,"priceDisplay":"60만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소/접객실 사용료","detail":"5호실 132㎡40평/시간당 18000원","price":432000,"priceDisplay":"43만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소/접객실 사용료","detail":"3호실 231㎡70평/시간당 27000원","price":648000,"priceDisplay":"65만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"시간당 2000원","price":48000,"priceDisplay":"5만원"}]'::jsonb,
    price_range = '빈소 43~65만원 / 안치실 5만원'
WHERE id = '8897942';

-- 평화원 장례식장 (장례식장 평화원)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소/접객실","detail":"일반실132㎡ 40평/시간당 19000원","price":456000,"priceDisplay":"46만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소/접객실","detail":"일반실198㎡ 60평/시간당 31000원","price":744000,"priceDisplay":"74만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소/접객실","detail":"특실264㎡ 80평/시간당 39000원","price":936000,"priceDisplay":"94만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소/접객실","detail":"영결식장","price":100000,"priceDisplay":"10만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소/접객실","detail":"일반실165㎡ 50평/시간당 26000원","price":624000,"priceDisplay":"62만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소/접객실","detail":"VIP실330㎡ 100평/시간당 43500원","price":1044000,"priceDisplay":"104만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소/접객실","detail":"일반실231㎡ 70평/시간당 34000원","price":816000,"priceDisplay":"82만원"}]'::jsonb,
    price_range = '빈소 10~104만원'
WHERE id = '12468818';

-- 쉴낙원 갈마성심장례식장 (쉴낙원갈마성심장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"특3호","detail":"221.49m2(67평)","price":672000,"priceDisplay":"67만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특1호","detail":"495.87m2(150평)","price":1248000,"priceDisplay":"125만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"VIP3호","detail":"307.44m2(93평)","price":960000,"priceDisplay":"96만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"VIP1호","detail":"495.87m2(150평)","price":1248000,"priceDisplay":"125만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"VIP2호","detail":"413.22m2(125평)","price":1152000,"priceDisplay":"115만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특2호","detail":"337.44m2(102평)","price":1032000,"priceDisplay":"103만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"","price":72000,"priceDisplay":"7만원"}]'::jsonb,
    price_range = '빈소 67~125만원 / 안치실 7만원'
WHERE id = '755769450';

-- 건양대학교병원 장례식장 (건양대학교병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"시설임대료","detail":"5호6호(40평형)/ 1일","price":480000,"priceDisplay":"48만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"시설임대료","detail":"2호3호(50평형)/ 1일","price":576000,"priceDisplay":"58만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"시설임대료","detail":"특202호(200평형)/ 1일","price":2280000,"priceDisplay":"228만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"시설임대료","detail":"1호(70평형)/ 1일","price":816000,"priceDisplay":"82만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"시설임대료","detail":"102호(100평형)/ 1일","price":1296000,"priceDisplay":"130만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"시설임대료","detail":"특201호 특101호(130평형)/ 1일","price":1560000,"priceDisplay":"156만원"},{"category":"안치실이용료","subCategory":"일반","name":"시설임대료","detail":"안치료 / 1일","price":72000,"priceDisplay":"7만원"}]'::jsonb,
    price_range = '빈소 48~228만원 / 안치실 7만원'
WHERE id = '1589754436';

-- 대전성모병원 장례식장 (가톨릭대학교대전성모병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실이용료","detail":"특3분향실/68평형/시간당34000원","price":816000,"priceDisplay":"82만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실이용료","detail":"특1분향실/90평형/시간당48000원","price":1152000,"priceDisplay":"115만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실이용료","detail":"8분향실/42평형/시간당20000원","price":480000,"priceDisplay":"48만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실이용료","detail":"VIP실/107평형/시간당54000원","price":1296000,"priceDisplay":"130만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실이용료","detail":"5분향실/49평형/시간당23000원","price":552000,"priceDisplay":"55만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실이용료","detail":"특2분향실/100평형/시간당52000원","price":1248000,"priceDisplay":"125만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실이용료","detail":"7분향실/68평형/시간당34000원","price":816000,"priceDisplay":"82만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실이용료","detail":"6분향실/49평형/시간당23000원","price":552000,"priceDisplay":"55만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"시간당3000원","price":72000,"priceDisplay":"7만원"}]'::jsonb,
    price_range = '빈소 48~130만원 / 안치실 7만원'
WHERE id = '17573798';

-- 그린장례문화원주식회사 (그린장례문화원주식회사)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장궁","detail":"2층 수용인원 1일 약180명","price":2700000,"priceDisplay":"270만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특201호","detail":"2층 수용인원 1일 약120명","price":1800000,"priceDisplay":"180만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특202호","detail":"2층 수용인원 1일 약120명","price":1800000,"priceDisplay":"180만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"VIP실","detail":"1층 수용인원 1일 약 120명","price":2000000,"priceDisplay":"200만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"일반실(301호302호303호305306호)","detail":"3층 수용인원 1일 약110명","price":1500000,"priceDisplay":"150만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"일반실(01호02호03호)","detail":"지하층 수용인원 1일 약70명","price":900000,"priceDisplay":"90만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"예궁","detail":"2층 수용인원 1일 약160명","price":2300000,"priceDisplay":"230만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1일기준","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 90~270만원 / 안치실 10만원'
WHERE id = '176';

-- 허병원장례식장 (허병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료(VIP실)","detail":"1실/24시간기준","price":1200000,"priceDisplay":"120만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료(특실)","detail":"1실 /24시간 기준","price":840000,"priceDisplay":"84만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료(1호실)","detail":"1실 /24시간기준","price":552000,"priceDisplay":"55만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실사용료","detail":"1실 /24시간기준","price":96000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 55~120만원 / 안치실 10만원'
WHERE id = '17277182';

-- 철원장례문화원 (철원장례문화원)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일80000/시간당 4000","price":80000,"priceDisplay":"8만원"}]'::jsonb,
    price_range = '안치실 8만원'
WHERE id = '168';

-- 금강장례식장 (금강장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장임대료(5호실)","detail":"1실(24시간기준)","price":976000,"priceDisplay":"98만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장임대료(1호실)","detail":"1실(24시간기준)","price":1504000,"priceDisplay":"150만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장임대료(2호실)","detail":"1실(24시간기준)","price":1056000,"priceDisplay":"106만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장임대료(6호실)","detail":"1실(24시간기준)","price":844000,"priceDisplay":"84만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장임대료(8호실)","detail":"1실(24시간기준)","price":654000,"priceDisplay":"65만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장임대료(3호실)","detail":"1실(24시간기준)","price":1003000,"priceDisplay":"100만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장임대료(7호실)","detail":"1실(24시간기준)","price":792000,"priceDisplay":"79만원"},{"category":"시설임대료","subCategory":"접객실","name":"접견실","detail":"일반실/시간당","price":25000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"접객실","name":"접견실","detail":"특실/시간당","price":35000,"priceDisplay":"4만원"},{"category":"시설임대료","subCategory":"접객실","name":"접견실통합","detail":"시간당","price":35000,"priceDisplay":"4만원"},{"category":"시설임대료","subCategory":"접객실","name":"특실","detail":"시간당","price":40000,"priceDisplay":"4만원"},{"category":"시설임대료","subCategory":"접객실","name":"무궁화국화실","detail":"시간당","price":30000,"priceDisplay":"3만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"시간당","price":3500,"priceDisplay":"3,500원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일(24시간기준)","price":150000,"priceDisplay":"15만원"},{"category":"안치실이용료","subCategory":"","name":"안치실","detail":"시간당","price":6000,"priceDisplay":"6,000원"}]'::jsonb,
    price_range = '빈소 3~150만원 / 안치실 0만원'
WHERE id = '9681604';

-- 산림조합 장성장례식장 (산림조합 장성장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"기타","name":"특 실  /  일반실","detail":"1일24시간","price":70000,"priceDisplay":"7만원"}]'::jsonb,
    price_range = '안치실 7만원'
WHERE id = '184';

-- 정선군사북장례식장 (정선군사북장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소.접객실.유족휴게실","detail":"156.96","price":336000,"priceDisplay":"34만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치냉장고","detail":"27.09","price":2500,"priceDisplay":"2,500원"}]'::jsonb,
    price_range = '빈소 34만원 / 안치실 0만원'
WHERE id = '169';

-- 효자장례타운 (효자장례타운)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일 기준","price":80000,"priceDisplay":"8만원"}]'::jsonb,
    price_range = '안치실 8만원'
WHERE id = '199';

-- 바른병원장례식장 (바른병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실 일반실","detail":"70평","price":600000,"priceDisplay":"60만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실 특실","detail":"80평","price":700000,"priceDisplay":"70만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실 사용료","detail":"1일/24시간 기준","price":96000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 60~70만원 / 안치실 10만원'
WHERE id = '12986081';

-- 큰사랑요양병원장례식장 (큰사랑요양병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실 특2호실","detail":"172m2 / 1시간 18750원","price":450000,"priceDisplay":"45만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실 VIP","detail":"240m2 / 1시간 25000원","price":600000,"priceDisplay":"60만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실 일반3호실","detail":"140m2 / 1시간 14583원","price":350000,"priceDisplay":"35만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실 특1호실","detail":"172m2 / 1시간 18750원","price":450000,"priceDisplay":"45만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"일당","price":60000,"priceDisplay":"6만원"}]'::jsonb,
    price_range = '빈소 35~60만원 / 안치실 6만원'
WHERE id = '26470209';

-- 성심장례식장 (성심장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소/접객실","detail":"8호실 231㎡70평/시간당 27000원","price":648000,"priceDisplay":"65만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소/접객실","detail":"VIP2호실 396㎡120평/시간당 45000원","price":1080000,"priceDisplay":"108만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소/접객실","detail":"5호실 231㎡70평/시간당 27000원","price":648000,"priceDisplay":"65만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소/접객실","detail":"VIP1호실 396㎡120평/시간당 45000원","price":1080000,"priceDisplay":"108만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소/접객실","detail":"7호실 231㎡70평/시간당 27000원","price":648000,"priceDisplay":"65만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소/접객실","detail":"6호실 231㎡70평/시간당 27000원","price":648000,"priceDisplay":"65만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소/접객실","detail":"VIP3호실 396㎡120평/시간당 45000원","price":1080000,"priceDisplay":"108만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"시간당 2000원","price":48000,"priceDisplay":"5만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실 사용료","detail":"","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 65~108만원 / 안치실 5만원'
WHERE id = '18848642';

-- 명품병원장례문화원 (명품병원장례문화원)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실 사용료","detail":"1시간","price":8500,"priceDisplay":"8,500원"}]'::jsonb,
    price_range = '안치실 1만원'
WHERE id = '175';

-- 일산백장례서비스(주) (일산백장례서비스(주))
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료 (245.38m²) 특17호","detail":"1일 / 24시간 기준","price":1380000,"priceDisplay":"138만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료 (200.72m²) 236호","detail":"1일 / 24시간 기준","price":792000,"priceDisplay":"79만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료 (197.98m²) 5호","detail":"1일 / 24시간 기준","price":924000,"priceDisplay":"92만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일 / 24시간 기준","price":96000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 79~138만원 / 안치실 10만원'
WHERE id = '171';

-- 수원시연화장 장례식장 (수원시연화장장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료(관외)","detail":"관외/1일기준","price":60000,"priceDisplay":"6만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료(관내)","detail":"관내/1일기준","price":45000,"priceDisplay":"5만원"}]'::jsonb,
    price_range = '안치실 5만원'
WHERE id = '12946335';

-- (주)광주국빈장례문화원 ((주)광주국빈장례문화원)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"301관 302관 401관 402관","detail":"입실~퇴실 100석","price":1700000,"priceDisplay":"170만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"201관 202관","detail":"입실~퇴실 100석","price":1600000,"priceDisplay":"160만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"203관 303관 403관","detail":"입실~퇴실 110석","price":2600000,"priceDisplay":"260만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"101관 102관","detail":"입실~퇴실 80석","price":1500000,"priceDisplay":"150만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실이용료","detail":"1일","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 150~260만원 / 안치실 10만원'
WHERE id = '177';

-- 가톨릭대학교 성빈센트병원 장례식장 (성빈센트병원 장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소 사용료(1일)","detail":"36평","price":564000,"priceDisplay":"56만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소 사용료(1일)","detail":"70평","price":1308000,"priceDisplay":"131만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소 사용료(1일)","detail":"37평","price":636000,"priceDisplay":"64만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소 사용료(1일)","detail":"56평","price":996000,"priceDisplay":"100만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소 사용료(1일)","detail":"60평","price":1104000,"priceDisplay":"110만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실 사용료","detail":"1일","price":96000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 56~131만원 / 안치실 10만원'
WHERE id = '8635458';

-- 목포성심장례문화원 (목포성심장례문화원)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향소 및 접객실","detail":"1일기준(오전12시부터 오후12시)","price":500000,"priceDisplay":"50만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향소 및 접객실","detail":"1일기준(오전12시부터 오후12시)","price":300000,"priceDisplay":"30만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향소 및 접객실","detail":"1일기준(오전12시부터 오후12시)","price":400000,"priceDisplay":"40만원"},{"category":"안치실이용료","subCategory":"일반","name":"고인 냉동.냉장  안치료","detail":"1일기준","price":70000,"priceDisplay":"7만원"}]'::jsonb,
    price_range = '빈소 30~50만원 / 안치실 7만원'
WHERE id = '183';

-- 정읍장례문화원 (정읍장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1일","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '안치실 10만원'
WHERE id = '203';

-- 고덕장례문화원 (고덕장례문화원)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"기타","name":"1일 90000","detail":"시간당","price":5000,"priceDisplay":"5,000원"}]'::jsonb,
    price_range = '안치실 1만원'
WHERE id = '207';

-- (주)모악장례문화원 ((주)모악장례문화원)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일","price":80000,"priceDisplay":"8만원"}]'::jsonb,
    price_range = '안치실 8만원'
WHERE id = '197';

-- 시티장례문화원 (시티장례문화원)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"특실 201호","detail":"1일 사용료","price":2200000,"priceDisplay":"220만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"303호","detail":"1일 사용료","price":900000,"priceDisplay":"90만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"VIP 202호","detail":"1일 사용료","price":3000000,"priceDisplay":"300만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특실 301호","detail":"1일 사용료","price":2200000,"priceDisplay":"220만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"302호","detail":"1일 사용료","price":900000,"priceDisplay":"90만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특실 101호","detail":"1일 사용료","price":1600000,"priceDisplay":"160만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일","price":80000,"priceDisplay":"8만원"}]'::jsonb,
    price_range = '빈소 90~300만원 / 안치실 8만원'
WHERE id = '202';

-- 쉴낙원 인천장례식장 (쉴낙원인천장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"13호실 (일)","detail":"","price":100000,"priceDisplay":"10만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"8호실 (일)","detail":"247㎡(75형평)","price":850000,"priceDisplay":"85만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"9호실 (일)","detail":"204㎡(62평형)","price":750000,"priceDisplay":"75만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"10호실 (일)","detail":"247㎡(75평형)","price":900000,"priceDisplay":"90만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"11호실 (일)","detail":"148㎡(45평형)","price":560000,"priceDisplay":"56만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특 7호실 (일)","detail":"330㎡(100평형)","price":1280000,"priceDisplay":"128만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"12호실 (일)","detail":"181㎡(55평형)","price":660000,"priceDisplay":"66만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"VIP - 1호실 (일)","detail":"495㎡(150평형)","price":1800000,"priceDisplay":"180만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특 6호실 (일)","detail":"330㎡(100평형)","price":1280000,"priceDisplay":"128만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"VIP - 2호실 (일)","detail":"495㎡(150평형)","price":1800000,"priceDisplay":"180만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"14호실 (일)","detail":"","price":100000,"priceDisplay":"10만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특 5호실 (일)","detail":"330㎡(100평형)","price":1280000,"priceDisplay":"128만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특 3호실 (일)","detail":"429㎡(130형평)","price":1550000,"priceDisplay":"155만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실 (일)","detail":"-","price":120000,"priceDisplay":"12만원"}]'::jsonb,
    price_range = '빈소 10~180만원 / 안치실 12만원'
WHERE id = '635392508';

-- 메트로병원 장례식장 (수성메트로병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1일(4000/1시간)","price":96000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '안치실 10만원'
WHERE id = '16098056';

-- (유)은파장례문화원 ((유)은파장례문화원)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향소","detail":"특실(210평)","price":79000,"priceDisplay":"8만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향소","detail":"준특실(164평)","price":70000,"priceDisplay":"7만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향소","detail":"VIP실(270평)","price":95000,"priceDisplay":"10만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향소","detail":"일반실(120평)","price":49000,"priceDisplay":"5만원"}]'::jsonb,
    price_range = '빈소 5~10만원'
WHERE id = '205';

-- 고려대학교안암병원장례식장 (고려대학교안암병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1시간당","price":4500,"priceDisplay":"4,500원"}]'::jsonb,
    price_range = '안치실 0만원'
WHERE id = '15789319';

-- 성월장례문화원 (성월장례문화원)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"기타","name":"1일 사용료","detail":"1시간=4000원","price":96000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '안치실 10만원'
WHERE id = '211';

-- 대구연세요양병원장례식장 (연세요양병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실(톡1호실특2호실)","detail":"1실 24시간기준(1시간 \\22500)","price":540000,"priceDisplay":"54만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"24시간기준(1시간 \\3000)","price":72000,"priceDisplay":"7만원"}]'::jsonb,
    price_range = '빈소 54만원 / 안치실 7만원'
WHERE id = '22676989';

-- 합천고려병원장례식장 (고려병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소+접객실 특3호","detail":"시간당","price":20000,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소+접객실 vip","detail":"시간당","price":30000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소+접객실 특1호","detail":"시간당","price":25000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소+접객실 특2호","detail":"시간당","price":23000,"priceDisplay":"2만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1일","price":120000,"priceDisplay":"12만원"}]'::jsonb,
    price_range = '빈소 2~3만원 / 안치실 12만원'
WHERE id = '219';

-- 영주 국화원장례식장 (영주 국화원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"301호 분향실","detail":"분향실 접객실 이용료 / 182m2 / 1시간","price":25000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"302호 분향실","detail":"분향실 접객실 이용료 / 149m2 / 1시간","price":21000,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"201호 분향실","detail":"분향실 접객실 이용료 / 182m2 / 1시간","price":25000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"VIP 분향실","detail":"분향실 접객실 이용료 / 331m2 / 1시간","price":42000,"priceDisplay":"4만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"202호 분향실","detail":"분향실 접객실 이용료 / 149m2 / 1시간","price":21000,"priceDisplay":"2만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실 사용료","detail":"24시간","price":80000,"priceDisplay":"8만원"}]'::jsonb,
    price_range = '빈소 2~4만원 / 안치실 8만원'
WHERE id = '2006387861';

-- 거창적십자병원장례식장 (거창적십자병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"102호 분향실 및 접견실 사용료","detail":"1일당","price":300000,"priceDisplay":"30만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특실 분향실 및 접견실 사용료","detail":"1일당","price":456000,"priceDisplay":"46만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"101호 분향실 및 접견실 사용료","detail":"1일당","price":408000,"priceDisplay":"41만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실 사용료","detail":"1일당","price":60000,"priceDisplay":"6만원"}]'::jsonb,
    price_range = '빈소 30~46만원 / 안치실 6만원'
WHERE id = '220';

-- 김해복음병원장례식장 (복음병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"2호실","detail":"1일 사용료","price":500000,"priceDisplay":"50만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"VIP실","detail":"1일사용료","price":800000,"priceDisplay":"80만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특실","detail":"1일사용료","price":600000,"priceDisplay":"60만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"1호실","detail":"1일사용료","price":500000,"priceDisplay":"50만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일 사용료","price":140000,"priceDisplay":"14만원"}]'::jsonb,
    price_range = '빈소 50~80만원 / 안치실 14만원'
WHERE id = '222';

-- 부산전문장례식장 (부산전문장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일","price":120000,"priceDisplay":"12만원"}]'::jsonb,
    price_range = '안치실 12만원'
WHERE id = '8218293';

-- 홍성추모공원 장례식장 (홍성추모공원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장임대료(일반)","detail":"1실/1시간기준","price":13500,"priceDisplay":"1만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장임대료(특)","detail":"1실/1시간기준","price":19000,"priceDisplay":"2만원"}]'::jsonb,
    price_range = '빈소 1~2만원'
WHERE id = '17570314';

-- 고성장례식장화라주식회사 (고성장례식장화라주식회사)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"일반","detail":"1","price":50000,"priceDisplay":"5만원"}]'::jsonb,
    price_range = '안치실 5만원'
WHERE id = '223';

-- 의령사랑병원장례식장 (의령사랑병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일","price":60000,"priceDisplay":"6만원"}]'::jsonb,
    price_range = '안치실 6만원'
WHERE id = '224';

-- 새고창장례식장 (새고창장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1시간(입실시간 기준)","price":3000,"priceDisplay":"3,000원"}]'::jsonb,
    price_range = '안치실 0만원'
WHERE id = '14650849';

-- 경산장례식장 (경산장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"6분향실","detail":"1시간","price":35000,"priceDisplay":"4만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"추가대실(3분향실과5분향실사이)","detail":"1시간","price":15000,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"5분향실","detail":"1시간","price":65000,"priceDisplay":"7만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"3분향실","detail":"1시간","price":65000,"priceDisplay":"7만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"VIP2분향실","detail":"1시간","price":80000,"priceDisplay":"8만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"VIP1 분향실","detail":"1시간","price":80000,"priceDisplay":"8만원"},{"category":"안치실이용료","subCategory":"일반","name":"1시간","detail":"1시간","price":6000,"priceDisplay":"6,000원"}]'::jsonb,
    price_range = '빈소 2~8만원 / 안치실 1만원'
WHERE id = '1887036428';

-- 의성성심요양병원장례식장 (성심요양병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실사용료","detail":"시간당(4.000원)","price":96000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '안치실 10만원'
WHERE id = '225';

-- (주)시민장례식장 ((주)시민장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1일","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '안치실 10만원'
WHERE id = '22729506';

-- 청주성모병원 장례식장 (청주성모병원 장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"특367호 78평형","detail":"24시간","price":640000,"priceDisplay":"64만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특1호 130평형","detail":"24시간","price":990000,"priceDisplay":"99만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"58호 68평형","detail":"24시간","price":550000,"priceDisplay":"55만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특2호 124평형","detail":"24시간","price":960000,"priceDisplay":"96만원"},{"category":"안치실이용료","subCategory":"일반","name":"시신 안치료","detail":"24시간","price":48000,"priceDisplay":"5만원"}]'::jsonb,
    price_range = '빈소 55~99만원 / 안치실 5만원'
WHERE id = '17573805';

-- 영주적십자병원장례식장 (영주적십자병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"123호실 (청소관리비)","detail":"1일","price":30000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특실 (청소관리비)","detail":"1일","price":40000,"priceDisplay":"4만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"3호실","detail":"43평","price":240000,"priceDisplay":"24만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"1호실","detail":"55평","price":300000,"priceDisplay":"30만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특실","detail":"75평","price":390000,"priceDisplay":"39만원"},{"category":"안치실이용료","subCategory":"일반","name":"감염성폐기물","detail":"1회","price":50000,"priceDisplay":"5만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"25평","price":85000,"priceDisplay":"9만원"}]'::jsonb,
    price_range = '빈소 3~39만원 / 안치실 5만원'
WHERE id = '226';

-- 벌교삼성병원장례식장 (벌교삼성병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실접객실(특실)","detail":"1일당","price":400000,"priceDisplay":"40만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실접객실(1분향소)","detail":"1일당","price":350000,"priceDisplay":"35만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실접객실","detail":"시간당","price":30000,"priceDisplay":"3만원"},{"category":"안치실이용료","subCategory":"일반","name":"고인안치료","detail":"1일당","price":50000,"priceDisplay":"5만원"}]'::jsonb,
    price_range = '빈소 3~40만원 / 안치실 5만원'
WHERE id = '7893608';

-- 강진장례식장 (강진장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"접객실사용료","detail":"1일","price":200000,"priceDisplay":"20만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실사용료","detail":"1일","price":50000,"priceDisplay":"5만원"}]'::jsonb,
    price_range = '빈소 20만원 / 안치실 5만원'
WHERE id = '16865923';

-- 브이아이피장례타운 ((유)브이아이피장례타운)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장임대료(VVIP101호)","detail":"2박3일/기준 2일계산(180석)","price":2600000,"priceDisplay":"260만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장임대료(VIP 502호)","detail":"2박3일/기준 2일계산(80석)","price":1600000,"priceDisplay":"160만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장임대료(VIP 202302501호)","detail":"2박3일/기준 2일계산(120석)","price":2000000,"priceDisplay":"200만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장임대료(VVIP 201301호)","detail":"2박3일/기준 2일계산(240석)","price":3000000,"priceDisplay":"300만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장임대료(1004호)","detail":"2박3일/기준 2일계산","price":800000,"priceDisplay":"80만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일기준","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 80~300만원 / 안치실 10만원'
WHERE id = '227';

-- 사비장례문화원 (사비장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"72.000(1일)","price":3000,"priceDisplay":"3,000원"}]'::jsonb,
    price_range = '안치실 0만원'
WHERE id = '17604351';

-- 정선장례식장 (정선장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"행사실(일반실 : 3실 보유)","detail":"분향실 휴계방 세면실 : 45㎡  (15000원/시간)","price":360000,"priceDisplay":"36만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"행사실(특실 : 1실 보유)","detail":"접객실(240석) 보조주방 집기 : 271㎡  (30000원/시간)","price":720000,"priceDisplay":"72만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"행사실(특별실 : 1실 보유)","detail":"분향실 접객실(24석) 보조주방 집기 : 99㎡  (8000원/시간)","price":192000,"priceDisplay":"19만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"행사실(특실 : 1실 보유)","detail":"분향실 휴계방 응접실 세면실 : 60㎡  (30000원/시간)","price":720000,"priceDisplay":"72만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"행사실(일반실 : 3실 보유)","detail":"접객실(120석) 보조주방 집기 : 186㎡  (1500원/시간)","price":360000,"priceDisplay":"36만원"}]'::jsonb,
    price_range = '빈소 19~72만원'
WHERE id = '1772082323';

-- 포항세명기독병원장례식장 (포항세명기독병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"4층 vip실","detail":"435㎡","price":1242000,"priceDisplay":"124만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"5층 특실","detail":"419㎡","price":1188000,"priceDisplay":"119만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"3층 1호실","detail":"217㎡","price":576000,"priceDisplay":"58만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"3층 2호실","detail":"217㎡","price":576000,"priceDisplay":"58만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"2층 중실","detail":"315㎡","price":894000,"priceDisplay":"89만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"6기","price":48000,"priceDisplay":"5만원"}]'::jsonb,
    price_range = '빈소 58~124만원 / 안치실 5만원'
WHERE id = '12200546';

-- (주)착한전문장례식장 ((주)착한전문장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1일","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '안치실 10만원'
WHERE id = '2067431919';

-- 보성장례식장 (보성장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실 및 접객실 특식","detail":"1 일","price":300000,"priceDisplay":"30만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실및 접객실  일반","detail":"1 일","price":150000,"priceDisplay":"15만원"}]'::jsonb,
    price_range = '빈소 15~30만원'
WHERE id = '1214183361';

-- 대천역전장례식장 (대천역전장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"기타","name":"안치실","detail":"일반(1일기준)","price":50000,"priceDisplay":"5만원"}]'::jsonb,
    price_range = '안치실 5만원'
WHERE id = '24343469';

-- 예산장례식장 (예산장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소임대료(무궁화1호실)","detail":"181.58㎡/1시간당요금산정","price":30000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소임대료(수국실)","detail":"250.66㎡/1시간당요금산정","price":30000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소임대료(무궁화2호실)","detail":"280.14㎡/1시간당요금산정","price":35000,"priceDisplay":"4만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"16.56㎡/1시간당요금산정","price":7000,"priceDisplay":"7,000원"}]'::jsonb,
    price_range = '빈소 3~4만원 / 안치실 1만원'
WHERE id = '10635532';

-- 참사랑장례식장 (참사랑장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"접객실","name":"시설사용료","detail":"접견실(시간당)","price":25000,"priceDisplay":"3만원"},{"category":"안치실이용료","subCategory":"기타","name":"고인분 모셔놓은 냉동고","detail":"1일기준","price":70000,"priceDisplay":"7만원"}]'::jsonb,
    price_range = '빈소 3만원 / 안치실 7만원'
WHERE id = '20402699';

-- 양천효병원장례식장 (양천효병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"2호 분향실  접객실","detail":"100㎡/ 1실/사용료/24시간 /기준","price":480000,"priceDisplay":"48만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"3호 분향실  접객실","detail":"90㎡/ 1일사용료/ 24시간 /기준","price":360000,"priceDisplay":"36만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"1호 분향실  접객실","detail":"150㎡/ 1일사용료 /24시간 /기준","price":600000,"priceDisplay":"60만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일/기준","price":96000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 36~60만원 / 안치실 10만원'
WHERE id = '18488641';

-- 중앙장례식장 (중앙장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"2층일반 분향실 1일24시간사용료(80평)","detail":"분향실접객실주방 상주휴게실 샤워실","price":480000,"priceDisplay":"48만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"2층특실분향실 1일24시간사용료(90평)","detail":"분향실접객실주방 상주휴게실 샤워실","price":576000,"priceDisplay":"58만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"3층VIP분향실 1일24시간사용료(150평)","detail":"분향실접객실주방상주휴게실 별도2실.tv샤워실","price":1096000,"priceDisplay":"110만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향소1일(특2호실특3호실)","detail":"120평","price":720000,"priceDisplay":"72만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향소1일(4호.5호)","detail":"60평","price":480000,"priceDisplay":"48만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료 분향 특1호실","detail":"1실/24시간 기준","price":1200000,"priceDisplay":"120만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료 분향 34호실","detail":"1실/24시간 기준","price":1200000,"priceDisplay":"120만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향소시간당(4호5호싷)","detail":"60평","price":20000,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향소시간당(특2호특3호)","detail":"120평","price":30000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료 분향 특2호실","detail":"1실/24시간 기준","price":1500000,"priceDisplay":"150만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료 분향 5호실","detail":"1실/24시간 기준","price":900000,"priceDisplay":"90만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일기준","price":50000,"priceDisplay":"5만원"},{"category":"안치실이용료","subCategory":"일반","name":"염습실사용료(자체입관포함)","detail":"1회","price":200000,"priceDisplay":"20만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"시간당","price":6000,"priceDisplay":"6,000원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실 1일 24시간 기준","detail":"안치 냉장고 사용료","price":72000,"priceDisplay":"7만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실1일","detail":"1일","price":120000,"priceDisplay":"12만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실시간당","detail":"시간","price":5000,"priceDisplay":"5,000원"}]'::jsonb,
    price_range = '빈소 2~150만원 / 안치실 1만원'
WHERE id = '8088670';

-- 갑을녹산병원장례식장 (갑을녹산병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"기타","name":"12시간이상~24시간미만 입원환자 30% 할인","detail":"안치실이용료(1일)","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '안치실 10만원'
WHERE id = '17605004';

-- 제일장례문화원 (제일장례문화원)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"1분향실","detail":"70평","price":500000,"priceDisplay":"50만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"2분향실","detail":"60평","price":500000,"priceDisplay":"50만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"3분향실","detail":"40평","price":300000,"priceDisplay":"30만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1일","price":80000,"priceDisplay":"8만원"}]'::jsonb,
    price_range = '빈소 30~50만원 / 안치실 8만원'
WHERE id = '27230362';

-- 인천가족공원장례식장 (인천가족공원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료 1일","detail":"","price":192000,"priceDisplay":"19만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료 시간당","detail":"","price":8000,"priceDisplay":"8,000원"}]'::jsonb,
    price_range = '안치실 1만원'
WHERE id = '1688174120';

-- 송현효병원 장례식장 (효병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실이용료","detail":"1실/1일","price":120000,"priceDisplay":"12만원"}]'::jsonb,
    price_range = '안치실 12만원'
WHERE id = '11132000';

-- 김천요양병원장례식장 (김천요양병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일","price":50000,"priceDisplay":"5만원"}]'::jsonb,
    price_range = '안치실 5만원'
WHERE id = '8242348';

-- 배성병원장례식장 (배성병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 분향실 임대료(V.I.P실)","detail":"24시간 기준 1시간 40000원","price":960000,"priceDisplay":"96만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 분향실 임대료(별실효실)","detail":"24시간 기준 1시간 27000원","price":648000,"priceDisplay":"65만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 분향실 임대료(대특실)","detail":"24시간 기준 1시간 31000원","price":744000,"priceDisplay":"74만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실안치료","detail":"24시간 기준 1시간 4000원","price":96000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 65~96만원 / 안치실 10만원'
WHERE id = '10395682';

-- 하귀농협장례식장 (하귀농협장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"101호분향실접객실 이용료","detail":"1일","price":500000,"priceDisplay":"50만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"101호분향실접객실 이용료","detail":"1시간","price":20800,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"201호분향실접객실 이용료","detail":"1일","price":500000,"priceDisplay":"50만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"202호분향실접객실 이용료","detail":"1시간","price":16600,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"202호분향실접객실 이용료","detail":"1일","price":400000,"priceDisplay":"40만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"302호분향실접객실 이용료","detail":"1시간","price":16600,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"302호분향실.접객실 이용료","detail":"1일","price":400000,"priceDisplay":"40만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"301호분향실접객실 이용료","detail":"1시간","price":20800,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"301호분향실접객실 이용료","detail":"1일","price":500000,"priceDisplay":"50만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"201호분향실접객실 이용료","detail":"1시간","price":20800,"priceDisplay":"2만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실 이용료","detail":"안치1구 1일","price":50000,"priceDisplay":"5만원"}]'::jsonb,
    price_range = '빈소 2~50만원 / 안치실 5만원'
WHERE id = '196337985';

-- 춘해병원장례식장 (춘해병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료1회","detail":"1일","price":150000,"priceDisplay":"15만원"}]'::jsonb,
    price_range = '안치실 15만원'
WHERE id = '12377254';

-- 여수강남요양병원장례식장 (여수강남요양병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실 특실","detail":"시간당 (분향실접객실유족실샤워실등)","price":47000,"priceDisplay":"5만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실 VIP","detail":"시간당(분향실접객실유족실샤워실등)","price":69000,"priceDisplay":"7만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"시간당","price":7000,"priceDisplay":"7,000원"}]'::jsonb,
    price_range = '빈소 5~7만원 / 안치실 1만원'
WHERE id = '977434696';

-- 동해동인병원장례식장 (동인병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소접객실상주휴개실샤워실등","detail":"60평 1시간","price":23000,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소접객실상주휴개실샤워실등","detail":"60평 1시간","price":23000,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소접객실상주휴개실샤워실등","detail":"90평 1시간","price":40000,"priceDisplay":"4만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실 사용료","detail":"1시간","price":5000,"priceDisplay":"5,000원"}]'::jsonb,
    price_range = '빈소 2~4만원 / 안치실 1만원'
WHERE id = '26442637';

-- 홍천군장례식장 (홍천군장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실(1시간)","detail":"1시간 관외","price":2000,"priceDisplay":"2,000원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실(1시간)","detail":"1시간 관내","price":1000,"priceDisplay":"1,000원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실(1일)","detail":"1일 관외","price":40000,"priceDisplay":"4만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실(1일)","detail":"1일 관내","price":20000,"priceDisplay":"2만원"}]'::jsonb,
    price_range = '안치실 0만원'
WHERE id = '825790721';

-- 의정부장례식장 (경기도의료원 의정부병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"안치료(1시간/ 3000원)","price":72000,"priceDisplay":"7만원"}]'::jsonb,
    price_range = '안치실 7만원'
WHERE id = '24847958';

-- 서울아산병원 장례식장 (서울아산병원 장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 빈소 임대료  (248㎡)","detail":"1실/24시간 기준","price":1980000,"priceDisplay":"198만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 빈소 임대료  (198㎡)지하","detail":"1실/24시간 기준","price":1480000,"priceDisplay":"148만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 빈소 임대료  (264㎡)지하","detail":"1실/24시간 기준","price":2080000,"priceDisplay":"208만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 빈소 임대료  (122㎡)지하","detail":"1실/24시간 기준","price":690000,"priceDisplay":"69만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 빈소 임대료  (314㎡)지하","detail":"1실/24시간 기준","price":2480000,"priceDisplay":"248만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 빈소 임대료  (331㎡)","detail":"1실/24시간 기준","price":2800000,"priceDisplay":"280만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 빈소 임대료  (264㎡)","detail":"1실/24시간 기준","price":2130000,"priceDisplay":"213만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장레식장 빈소 임대료  (561㎡)","detail":"1실/24시간 기준","price":4430000,"priceDisplay":"443만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 빈소 임대료  (132㎡)지하","detail":"1실/24시간 기준","price":750000,"priceDisplay":"75만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 빈소 임대료  (495㎡)","detail":"1실/24시간 기준","price":4050000,"priceDisplay":"405만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 빈소 임대료  (380㎡)","detail":"1실/24시간 기준","price":3110000,"priceDisplay":"311만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료- 대형","detail":"1일/24시간 기준","price":132000,"priceDisplay":"13만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료-중형","detail":"1일/24시간 기준","price":96000,"priceDisplay":"10만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료-소형","detail":"1일/24시간 기준","price":88800,"priceDisplay":"9만원"}]'::jsonb,
    price_range = '빈소 69~443만원 / 안치실 9만원'
WHERE id = '10496620';

-- 장흥우리병원중앙장례식장 (우리병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1시간","price":5000,"priceDisplay":"5,000원"}]'::jsonb,
    price_range = '안치실 1만원'
WHERE id = '11162634';

-- 증평현대장례식장 (증평현대장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"3층 빈소 및 접객실 포함(244.6m²)","detail":"1일","price":1000000,"priceDisplay":"100만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"1층 빈소 및 접객실 포함(49.5m²)","detail":"1일","price":900000,"priceDisplay":"90만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"2층 빈소 및 접객실 포함(244.6m²)","detail":"1일","price":1200000,"priceDisplay":"120만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1일 24시간 기준","price":120000,"priceDisplay":"12만원"}]'::jsonb,
    price_range = '빈소 90~120만원 / 안치실 12만원'
WHERE id = '26915008';

-- 하동장례식장 (하동장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실및 접객실 /1호실 사용료","detail":"1일(12시간 이상 24시간 미만)","price":400000,"priceDisplay":"40만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실및 접객실 / 2호/ 3호실","detail":"1일(12시간 이상 24시간 미만)","price":400000,"priceDisplay":"40만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실 사용료","detail":"1일(12시간 이상 24시간 미만)","price":80000,"priceDisplay":"8만원"}]'::jsonb,
    price_range = '빈소 40만원 / 안치실 8만원'
WHERE id = '11207935';

-- 하동우리들병원장례식장 (하동우리들병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실(2호)","detail":"1일 24시간","price":100000,"priceDisplay":"10만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실(특1호)","detail":"1일 24시간","price":200000,"priceDisplay":"20만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일 24시간","price":50000,"priceDisplay":"5만원"}]'::jsonb,
    price_range = '빈소 10~20만원 / 안치실 5만원'
WHERE id = '9548921';

-- 영등포장례식장 (영등포장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실및접객실사용료","detail":"1시간기준(55평형)","price":30000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실및접객실사용료","detail":"1시간기준(45평형)","price":25000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실및접객실사용료","detail":"1시간기준(110평형)","price":55000,"priceDisplay":"6만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실사용료","detail":"1시간기준","price":5000,"priceDisplay":"5,000원"}]'::jsonb,
    price_range = '빈소 3~6만원 / 안치실 1만원'
WHERE id = '14552163';

-- 통영서울병원장례식장 (통영서울병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소및 접객실 사용료","detail":"2빈소 1시간 기준","price":20000,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소및 접객실 사용료","detail":"특1호실 1시간 기준","price":23000,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소및 접객실 사용료","detail":"1빈소 1시간 기준","price":15000,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소및 접객실 사용료","detail":"VIP실   1시간 기준","price":30000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소및 접객실 사용료","detail":"특3호 1시간 기준","price":25000,"priceDisplay":"3만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실 사용료","detail":"안치실 1시간 기준","price":6000,"priceDisplay":"6,000원"}]'::jsonb,
    price_range = '빈소 2~3만원 / 안치실 1만원'
WHERE id = '12884046';

-- 영동병원장례식장 (시영의료재단 영동병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1일기준","price":60000,"priceDisplay":"6만원"}]'::jsonb,
    price_range = '안치실 6만원'
WHERE id = '9298234';

-- 쉴낙원 경기장례식장 (쉴낙원경기장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"특 6호실","detail":"463m2 (140평형)","price":1930000,"priceDisplay":"193만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"VIP 1호실","detail":"624m2 (189평형)","price":2730000,"priceDisplay":"273만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"9호실","detail":"248m2 (72평형)","price":960000,"priceDisplay":"96만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"8호실","detail":"305m2 (92평형)","price":1290000,"priceDisplay":"129만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"7호실","detail":"288m2 (87평형)","price":1190000,"priceDisplay":"119만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특 5호실","detail":"429m2 (130평형)","price":1830000,"priceDisplay":"183만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"VIP 2호실","detail":"797m2 (241평형)","price":3480000,"priceDisplay":"348만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특 3호실","detail":"333m2 (101평형)","price":1420000,"priceDisplay":"142만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"10호실","detail":"268m2 (81평형)","price":1090000,"priceDisplay":"109만원"},{"category":"시설임대료","subCategory":"접객실","name":"영결식장(추모서비스)","detail":"1회","price":400000,"priceDisplay":"40만원"},{"category":"시설임대료","subCategory":"접객실","name":"영결식장","detail":"1회","price":180000,"priceDisplay":"18만원"},{"category":"시설임대료","subCategory":"접객실","name":"게스트룸 특실","detail":"1일","price":60000,"priceDisplay":"6만원"},{"category":"시설임대료","subCategory":"접객실","name":"게스트룸 일반","detail":"1일","price":40000,"priceDisplay":"4만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1구","price":120000,"priceDisplay":"12만원"}]'::jsonb,
    price_range = '빈소 4~348만원 / 안치실 12만원'
WHERE id = '1112294625';

-- 거창한국병원장례식장 (한국병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일(24시간)","price":75000,"priceDisplay":"8만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실 사용료","detail":"1시간당","price":5000,"priceDisplay":"5,000원"},{"category":"안치실이용료","subCategory":"기타","name":"시설임대료","detail":"염습실 대여료","price":200000,"priceDisplay":"20만원"},{"category":"안치실이용료","subCategory":"기타","name":"시설임대료","detail":"안치실","price":72000,"priceDisplay":"7만원"}]'::jsonb,
    price_range = '안치실 1만원'
WHERE id = '163715858';

-- 메디힐장례식장 (메디힐병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실 사용료","detail":"1일사용료(24시간기준)","price":84000,"priceDisplay":"8만원"}]'::jsonb,
    price_range = '안치실 8만원'
WHERE id = '26786774';

-- 온양장례식장 (온양장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일 기준","price":192000,"priceDisplay":"19만원"}]'::jsonb,
    price_range = '안치실 19만원'
WHERE id = '16687823';

-- 교원예움 평택장례식장 (교원예움 평택장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실1일사용료 (201호실 80평)","detail":"빈소접객실.상주휴게실샤워실.주방","price":600000,"priceDisplay":"60만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실1일사용료 (203호실 140평)","detail":"빈소접객실.상주휴게실샤워실.주방","price":960000,"priceDisplay":"96만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실1일사용료 (202호실 160평)","detail":"빈소접객실.상주휴게실샤워실.주방","price":1200000,"priceDisplay":"120만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실1일사용료 101호실.102호실120평)","detail":"빈소접객실.상주휴게실샤워실.주방","price":840000,"priceDisplay":"84만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실1일사용료 (204호실 80평)","detail":"빈소접객실.상주휴게실샤워실.주방","price":600000,"priceDisplay":"60만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실 1일 사용료 301호실","detail":"빈소접객실상주휴게실주방","price":480000,"priceDisplay":"48만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실 1일 사용료 303호실","detail":"빈소접객실 상주휴게실주방","price":480000,"priceDisplay":"48만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실 1일 사용료 302호실","detail":"빈소접객실상주휴게실주방","price":480000,"priceDisplay":"48만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"냉장고사용료","price":96000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 48~120만원 / 안치실 10만원'
WHERE id = '8131868';

-- 다대수병원장례식장 (다대수병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소접객실","detail":"특102호 (50평)","price":480000,"priceDisplay":"48만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소접객실","detail":"특103호 (55평)","price":540000,"priceDisplay":"54만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소접객실","detail":"특101호 (60평)","price":590000,"priceDisplay":"59만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 48~59만원 / 안치실 10만원'
WHERE id = '786892523';

-- 하늘내린 도리안 (도리안장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실(관내)","detail":"1일(24시간)","price":50000,"priceDisplay":"5만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실(관외)","detail":"1일(24시간)","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '안치실 5만원'
WHERE id = '25083841';

-- 흥덕장례식장 (흥덕장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소 접객실 사용료","detail":"1시간","price":30000,"priceDisplay":"3만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1구 / 1일","price":70000,"priceDisplay":"7만원"}]'::jsonb,
    price_range = '빈소 3만원 / 안치실 7만원'
WHERE id = '8693508';

-- 쉴낙원 김포장례식장 (쉴낙원김포장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"7호실 (지하1층)","detail":"73평","price":750000,"priceDisplay":"75만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특6호실 (2층)","detail":"100평","price":1300000,"priceDisplay":"130만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특5호실 (2층)","detail":"76평","price":990000,"priceDisplay":"99만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"VIP-1호실 (1층)","detail":"177평","price":1930000,"priceDisplay":"193만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특2호실 (2층)","detail":"100평","price":1300000,"priceDisplay":"130만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특3호실 (2층)","detail":"76평","price":990000,"priceDisplay":"99만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"9호실 (지하1층)","detail":"88평","price":890000,"priceDisplay":"89만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"8호실 (지하1층)","detail":"106평","price":1190000,"priceDisplay":"119만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1일","price":120000,"priceDisplay":"12만원"}]'::jsonb,
    price_range = '빈소 75~193만원 / 안치실 12만원'
WHERE id = '8227394';

-- 한길장례식장 (한길장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료 사용료","detail":"1일 기준","price":80000,"priceDisplay":"8만원"}]'::jsonb,
    price_range = '안치실 8만원'
WHERE id = '97715921';

-- 구미천사요양병원장례식장 (구미천사요양병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"국화실","detail":"132m2(24시간)","price":600000,"priceDisplay":"60만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"VIP실","detail":"231m2(24시간)","price":800000,"priceDisplay":"80만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"목화실","detail":"132m2(24시간)","price":500000,"priceDisplay":"50만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1시간","price":4000,"priceDisplay":"4,000원"}]'::jsonb,
    price_range = '빈소 50~80만원 / 안치실 0만원'
WHERE id = '135417876';

-- 광적장례식장 (광적장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"기타","name":"30평","detail":"1시간","price":5000,"priceDisplay":"5,000원"}]'::jsonb,
    price_range = '안치실 1만원'
WHERE id = '23441138';

-- 합천추모공원장례식장 (합천추모공원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"","price":80000,"priceDisplay":"8만원"}]'::jsonb,
    price_range = '안치실 8만원'
WHERE id = '26927125';

-- 시흥우리장례식장 (시흥우리장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"(시간당)","price":5000,"priceDisplay":"5,000원"}]'::jsonb,
    price_range = '안치실 1만원'
WHERE id = '27524678';

-- 계명대학교동산병원백합원 (계명대학교동산병원백합원)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"1호 (170평형)","detail":"1일 (75000/1시간)","price":1800000,"priceDisplay":"180만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"2호 (70평형)","detail":"1일 (37500/1시간)","price":900000,"priceDisplay":"90만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"3호 (40평형)","detail":"1일 (21000/1시간)","price":504000,"priceDisplay":"50만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"8호 (45평형/가변형)","detail":"1일 (25000/1시간)","price":600000,"priceDisplay":"60만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"9호 (45평형/가변형)","detail":"1일 (25000/1시간)","price":600000,"priceDisplay":"60만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"6호 (45평형/가변형)","detail":"1일 (25000/1시간)","price":600000,"priceDisplay":"60만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"7호 (45평형/가변형)","detail":"1일 (25000/1시간)","price":600000,"priceDisplay":"60만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"10호 (50평형)","detail":"1일 (29000/1시간)","price":696000,"priceDisplay":"70만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"5호 (45평형)","detail":"1일 (25000/1시간)","price":600000,"priceDisplay":"60만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일 (3000/1시간)","price":72000,"priceDisplay":"7만원"}]'::jsonb,
    price_range = '빈소 50~180만원 / 안치실 7만원'
WHERE id = '1966229954';

-- 쉴낙원 오산동탄장례식장 (쉴낙원 오산동탄 장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"영결식장","detail":"1회","price":150000,"priceDisplay":"15만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"8호실","detail":"126평","price":690000,"priceDisplay":"69만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"6호실","detail":"102평","price":920000,"priceDisplay":"92만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"VIP 1호실","detail":"188평","price":1200000,"priceDisplay":"120만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특 3호실","detail":"137평","price":1130000,"priceDisplay":"113만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특 5호실","detail":"168평","price":1080000,"priceDisplay":"108만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"7호실","detail":"121평","price":960000,"priceDisplay":"96만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"VIP 2호실","detail":"214평","price":1290000,"priceDisplay":"129만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"9호실","detail":"132평","price":880000,"priceDisplay":"88만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1구","price":120000,"priceDisplay":"12만원"},{"category":"안치실이용료","subCategory":"염습실/입관실","name":"염습실","detail":"1회","price":300000,"priceDisplay":"30만원"}]'::jsonb,
    price_range = '빈소 15~129만원 / 안치실 12만원'
WHERE id = '1767839495';

-- 공주의료원장례식장 (공주의료원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"1일 임대료 시간당25000원","detail":"특2호 3호 5호실/70평/일","price":600000,"priceDisplay":"60만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"1일 임대료 시간당30000원","detail":"특1호실/80평/일","price":720000,"priceDisplay":"72만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"1일 임대료 시간당17000원","detail":"6호실/50평/일","price":408000,"priceDisplay":"41만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"1일 임대료 시간당10000원","detail":"7호실/35평/일","price":240000,"priceDisplay":"24만원"},{"category":"안치실이용료","subCategory":"일반","name":"1일 사용료","detail":"일/시간당(2000)","price":48000,"priceDisplay":"5만원"}]'::jsonb,
    price_range = '빈소 24~72만원 / 안치실 5만원'
WHERE id = '1676628749';

-- 군위농협장례식장 (군위농협장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"특실임대료","detail":"1시간당","price":35000,"priceDisplay":"4만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"2호실임대료","detail":"1시간당","price":20000,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"1호실임대료","detail":"1시간당","price":25000,"priceDisplay":"3만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일","price":60000,"priceDisplay":"6만원"}]'::jsonb,
    price_range = '빈소 2~4만원 / 안치실 6만원'
WHERE id = '11427439';

-- 원진녹색병원 장례식장 (원진녹색병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료","detail":"특 1일/24시간기준","price":900000,"priceDisplay":"90만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료","detail":"중 1일/24시간기준 2개호실","price":400000,"priceDisplay":"40만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료","detail":"소 1이/24시간기준","price":250000,"priceDisplay":"25만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료","detail":"대 1일/24시간기준","price":550000,"priceDisplay":"55만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료","detail":"vip일/24시간기준","price":1200000,"priceDisplay":"120만원"},{"category":"안치실이용료","subCategory":"기타","name":"안치관리비","detail":"1일/24시간 기준","price":150000,"priceDisplay":"15만원"}]'::jsonb,
    price_range = '빈소 25~120만원 / 안치실 15만원'
WHERE id = '9361345';

-- 하늘공원장례식장 (울산하늘공원(장례식장))
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 이용료","detail":"빈소(201~204호) 1실당(24시간기준)-관내","price":112000,"priceDisplay":"11만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 이용료","detail":"빈소(205호) 1실당(24시간기준)-관내","price":137000,"priceDisplay":"14만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 이용료","detail":"가족 휴게실(24시간기준)-관외","price":60000,"priceDisplay":"6만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 이용료","detail":"빈소(205호) 1실당(24시간기준)-관외","price":274000,"priceDisplay":"27만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 이용료","detail":"가족 휴게실(24시간기준)-관내","price":30000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 이용료","detail":"빈소(201~204호) 1실당(24시간기준)-관외","price":224000,"priceDisplay":"22만원"},{"category":"안치실이용료","subCategory":"일반","name":"장례식장 이용료","detail":"안치실 1구당(24시간기준)-관내","price":40000,"priceDisplay":"4만원"},{"category":"안치실이용료","subCategory":"일반","name":"장례식장 이용료","detail":"안치실 1구당(24시간기준)-관외","price":80000,"priceDisplay":"8만원"}]'::jsonb,
    price_range = '빈소 3~27만원 / 안치실 4만원'
WHERE id = '831919971';

-- 효사랑병원 장례식장 (구례효사랑병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실.접객실","detail":"1일","price":480000,"priceDisplay":"48만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1일","price":80000,"priceDisplay":"8만원"}]'::jsonb,
    price_range = '빈소 48만원 / 안치실 8만원'
WHERE id = '9368776';

-- 현대병원장례식장 (광탄현대병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"","name":"안치료","detail":"시간당","price":4000,"priceDisplay":"4,000원"}]'::jsonb,
    price_range = '안치실 0만원'
WHERE id = '11203494';

-- 이담장례식장 (이담 장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료(특13호실)","detail":"35000원/시간","price":35000,"priceDisplay":"4만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 추가 임대료(특2호실)","detail":"25000원/시간","price":25000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료(일반실)","detail":"15000원/시간","price":15000,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 추가 임대료(특   실)","detail":"25000원/시간","price":25000,"priceDisplay":"3만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"5000원/시간","price":5000,"priceDisplay":"5,000원"}]'::jsonb,
    price_range = '빈소 2~4만원 / 안치실 1만원'
WHERE id = '235444830';

-- 금사장례식장 (금사장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"염습실/입관실","name":"1일 100000원","detail":"","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '안치실 10만원'
WHERE id = '1494916482';

-- 동일죽장례식장 (동일죽장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소/접객실","detail":"100평","price":600000,"priceDisplay":"60만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소/접객실","detail":"80평","price":700000,"priceDisplay":"70만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소/접객실","detail":"40평","price":300000,"priceDisplay":"30만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"","price":70000,"priceDisplay":"7만원"}]'::jsonb,
    price_range = '빈소 30~70만원 / 안치실 7만원'
WHERE id = '349509791';

-- 동국대학교경주병원장례식장 (동국대학교경주병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"6호실(18형)","detail":"빈소(접객실)사용료","price":216000,"priceDisplay":"22만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"5호실(48형)","detail":"빈소(접객실)사용료","price":500000,"priceDisplay":"50만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특실1호(170형)","detail":"빈소(접객실)사용료","price":1650000,"priceDisplay":"165만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특실3호(64형)","detail":"빈소(접객실)사용료","price":700000,"priceDisplay":"70만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특실2호(75형)","detail":"빈소(접객실)사용료","price":900000,"priceDisplay":"90만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1실/1일","price":72000,"priceDisplay":"7만원"},{"category":"안치실이용료","subCategory":"기타","name":"안치실","detail":"안치자","price":20000,"priceDisplay":"2만원"}]'::jsonb,
    price_range = '빈소 22~165만원 / 안치실 2만원'
WHERE id = '13106556';

-- 한양대학교 구리병원 장례식장 (한양대학교구리병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"특1호실/1일","detail":"100평형","price":792000,"priceDisplay":"79만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"2호실/1일","detail":"80평현","price":600000,"priceDisplay":"60만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"3호실/1일","detail":"60평형","price":480000,"priceDisplay":"48만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특5호실/1일","detail":"120평형","price":960000,"priceDisplay":"96만원"},{"category":"안치실이용료","subCategory":"기타","name":"안치실","detail":"1시간","price":4000,"priceDisplay":"4,000원"}]'::jsonb,
    price_range = '빈소 48~96만원 / 안치실 0만원'
WHERE id = '14650779';

-- 보성아산병원장례식장 (보성아산병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"기타","name":"안치에 대한 장례 행위","detail":"시간당","price":5000,"priceDisplay":"5,000원"}]'::jsonb,
    price_range = '안치실 1만원'
WHERE id = '10374597';

-- 연세대학교 강남장례식장 (연세대학교 강남장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1실/1일","price":88800,"priceDisplay":"9만원"}]'::jsonb,
    price_range = '안치실 9만원'
WHERE id = '14650915';

-- 송산장례식장 (송산장례문화원)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"2층 VIP실","detail":"1일","price":1100000,"priceDisplay":"110만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"3층 매화실","detail":"1일","price":800000,"priceDisplay":"80만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"1층 특실","detail":"1일","price":1000000,"priceDisplay":"100만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"3층 국화실","detail":"1일","price":800000,"priceDisplay":"80만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실이용료","detail":"1일","price":120000,"priceDisplay":"12만원"}]'::jsonb,
    price_range = '빈소 80~110만원 / 안치실 12만원'
WHERE id = '7955878';

-- 강진의료원장례식장 (강진의료원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일/24시간 기준(시간당 2100원)","price":50000,"priceDisplay":"5만원"}]'::jsonb,
    price_range = '안치실 5만원'
WHERE id = '19687367';

-- 오천삼성병원장례식장 (삼성병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실 1일","detail":"시간당 4000","price":96000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '안치실 10만원'
WHERE id = '8380259';

-- 영천국화원전문장례식장 (영천국화원전문장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"VIP실","detail":"826 (m2)","price":1320000,"priceDisplay":"132만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특201호","detail":"495 (m2)","price":1080000,"priceDisplay":"108만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"101호","detail":"132 (m2)","price":240000,"priceDisplay":"24만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"202호","detail":"330 (m2)","price":840000,"priceDisplay":"84만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"203호","detail":"264 (m2)","price":720000,"priceDisplay":"72만원"},{"category":"안치실이용료","subCategory":"일반","name":"고인 안치료","detail":"1일","price":96000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 24~132만원 / 안치실 10만원'
WHERE id = '1311787419';

-- 강동성심병원장례식장 (강동성심병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"시신안치료","price":72000,"priceDisplay":"7만원"}]'::jsonb,
    price_range = '안치실 7만원'
WHERE id = '8596577';

-- 위더스요양병원장례식장 (위더스요양병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"기타","name":"일치실","detail":"","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '안치실 10만원'
WHERE id = '6627157';

-- 칠곡경북대학교병원장례식장 (경북대학교병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"102호(일반실)","detail":"1일(69㎡/13750/1시간)","price":330000,"priceDisplay":"33만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특206호(준특실)","detail":"1일(169㎡/31500/1시간)","price":756000,"priceDisplay":"76만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특205호(특실)","detail":"1일(248㎡/43000/1시간)","price":1032000,"priceDisplay":"103만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특104호(준특실)","detail":"1일(160㎡/29500/1시간)","price":708000,"priceDisplay":"71만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특101호(특실)","detail":"1일(248㎡/43000/1시간)","price":1032000,"priceDisplay":"103만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"103호(일반실)","detail":"1일(80㎡/15750/1시간)","price":378000,"priceDisplay":"38만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"208호(일반실)","detail":"1일(87㎡/17750/1시간)","price":426000,"priceDisplay":"43만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특209호(특실)","detail":"1일(248㎡/43000/1시간)","price":1032000,"priceDisplay":"103만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"207호(일반실)","detail":"1일(69㎡/13750/1시간)","price":330000,"priceDisplay":"33만원"}]'::jsonb,
    price_range = '빈소 33~103만원'
WHERE id = '25083805';

-- 문요양병원장례식장 (문요양병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"특1호실 약115평","detail":"분향실접객실상주전용(휴게실샤워실화장실)주방","price":900000,"priceDisplay":"90만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특2호실 약75평","detail":"분향실접객실상주전용(휴게실샤워실화장실)주방","price":700000,"priceDisplay":"70만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"3호실 약45평","detail":"분향실접객실상주전용(휴게실샤워실화장실)주방","price":540000,"priceDisplay":"54만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실 1일","detail":"안치료","price":90000,"priceDisplay":"9만원"}]'::jsonb,
    price_range = '빈소 54~90만원 / 안치실 9만원'
WHERE id = '27415056';

-- 진도한국병원 장례식장 (한국병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일(24시간)","price":75000,"priceDisplay":"8만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실 사용료","detail":"1시간당","price":5000,"priceDisplay":"5,000원"},{"category":"안치실이용료","subCategory":"기타","name":"시설임대료","detail":"염습실 대여료","price":200000,"priceDisplay":"20만원"},{"category":"안치실이용료","subCategory":"기타","name":"시설임대료","detail":"안치실","price":72000,"priceDisplay":"7만원"}]'::jsonb,
    price_range = '안치실 1만원'
WHERE id = '14650752';

-- 건국대학교병원장례식장 (건국대학교병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"101호 빈소임대료","detail":"181.8㎡ / 지하1층 / 24시간 기준","price":912000,"priceDisplay":"91만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"102호 빈소임대료","detail":"148.7㎡ / 지하2층 / 24시간 기준","price":768000,"priceDisplay":"77만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"204호 빈소임대료","detail":"128.9㎡ / 지하2층 / 24시간 기준","price":648000,"priceDisplay":"65만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"203호 빈소임대료","detail":"185㎡ / 지하2층 / 24시간 기준","price":1008000,"priceDisplay":"101만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"103104호 빈소임대료","detail":"138.8㎡ / 지하1층 / 24시간 기준","price":744000,"priceDisplay":"74만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"205호 빈소임대료","detail":"148.7㎡ / 지하2층 / 24시간 기준","price":840000,"priceDisplay":"84만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"201202호 빈소임대료","detail":"241.3㎡ / 지하2층 / 24시간 기준","price":1440000,"priceDisplay":"144만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"24시간 기준","price":79200,"priceDisplay":"8만원"}]'::jsonb,
    price_range = '빈소 65~144만원 / 안치실 8만원'
WHERE id = '9675681';

-- 순창군보건의료원장례식장 (순창군보건의료원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"시설사용료(관외) 안치료포함","detail":"관외","price":250000,"priceDisplay":"25만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"시설사용료(관내) 안치료포함","detail":"관내","price":200000,"priceDisplay":"20만원"},{"category":"안치실이용료","subCategory":"일반","name":"시신만 안치할 경우","detail":"안치실만 사용할 경우","price":50000,"priceDisplay":"5만원"}]'::jsonb,
    price_range = '빈소 20~25만원 / 안치실 5만원'
WHERE id = '7968120';

-- 빛가람종합병원장례식장 (빛가람장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실 사용료","detail":"1호/1시간","price":10000,"priceDisplay":"1만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실 사용료","detail":"2호/1시간","price":10000,"priceDisplay":"1만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1시간","price":6000,"priceDisplay":"6,000원"}]'::jsonb,
    price_range = '빈소 1만원 / 안치실 1만원'
WHERE id = '1996349372';

-- 예천농협장례식장 (예천농협장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료(302호)132.m2","detail":"1실/24시간기준","price":288000,"priceDisplay":"29만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료(특실)264m2","detail":"1실/24시간기준","price":480000,"priceDisplay":"48만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료(201202호)198m2","detail":"1실/24시간기준","price":384000,"priceDisplay":"38만원"},{"category":"안치실이용료","subCategory":"일반","name":"장례식장 임대료(안치료)","detail":"1실/24시간기준","price":72000,"priceDisplay":"7만원"}]'::jsonb,
    price_range = '빈소 29~48만원 / 안치실 7만원'
WHERE id = '10062565';

-- 남원장례식장 (남원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실 사용료","detail":"1일","price":80000,"priceDisplay":"8만원"}]'::jsonb,
    price_range = '안치실 8만원'
WHERE id = '8884478';

-- 쉴낙원 서울장례식장 (쉴낙원서울장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1구","price":120000,"priceDisplay":"12만원"}]'::jsonb,
    price_range = '안치실 12만원'
WHERE id = '315701556';

-- 왜관병원장례식장 (왜관병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"기타","name":"고인 안치","detail":"24시간","price":96000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '안치실 10만원'
WHERE id = '850019887';

-- 서울의료원 장례식장 (서울특별시 서울의료원 장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료1","detail":"1시간당","price":3000,"priceDisplay":"3,000원"}]'::jsonb,
    price_range = '안치실 0만원'
WHERE id = '25083848';

-- 인천적십자병원장례식장 (인천적십자병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"기타","name":"안치비용","detail":"1일/24시간 기준","price":120000,"priceDisplay":"12만원"}]'::jsonb,
    price_range = '안치실 12만원'
WHERE id = '16156976';

-- 대구시민전문장례식장 (대구시민전문장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"103호(52평/76석)","detail":"171.9m2","price":696000,"priceDisplay":"70만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특101호(100평/144석)","detail":"330.6m2","price":1272000,"priceDisplay":"127만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"202호(30평/24석)","detail":"99.0m2","price":324000,"priceDisplay":"32만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"VIP  301호(155평/166석)","detail":"512.4m2","price":1488000,"priceDisplay":"149만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특 201호(95평/136석)","detail":"314.0m2","price":1080000,"priceDisplay":"108만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"102호(73평/108석)","detail":"241.3m2","price":888000,"priceDisplay":"89만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"VIP 501호(155평/166석)","detail":"512.4m2","price":1488000,"priceDisplay":"149만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"99.0m2","price":72000,"priceDisplay":"7만원"}]'::jsonb,
    price_range = '빈소 32~149만원 / 안치실 7만원'
WHERE id = '240827141';

-- 영덕전문장례식장 (영덕전문장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"특실(90평)","detail":"빈소접객실휴게실화장실샤워실/시간당","price":30000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"201호(60평)","detail":"빈소접객실휴게실화장실샤워실/시간당","price":25000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"VIP실(100평)","detail":"빈소접객실휴게실화장실샤워실/시간당","price":35000,"priceDisplay":"4만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"예비분향실(30평)","detail":"빈소접객실휴게실화장실/시간당","price":20000,"priceDisplay":"2만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"시간당","price":6000,"priceDisplay":"6,000원"}]'::jsonb,
    price_range = '빈소 2~4만원 / 안치실 1만원'
WHERE id = '11256214';

-- 굿모닝병원장례식장 (굿모닝병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소임대료(201호)","detail":"1일/24시간","price":200000,"priceDisplay":"20만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소임대료(103호)","detail":"1일/24시간","price":450000,"priceDisplay":"45만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소임대료(101호)","detail":"1일/24시간","price":550000,"priceDisplay":"55만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소임대료(105호)","detail":"1일/24시간","price":350000,"priceDisplay":"35만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소임대료(102호)","detail":"1일/24시간","price":550000,"priceDisplay":"55만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일","price":120000,"priceDisplay":"12만원"}]'::jsonb,
    price_range = '빈소 20~55만원 / 안치실 12만원'
WHERE id = '8219795';

-- 김천제일병원장례식장 (김천제일병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"일반345호실 ( 99㎡ )","detail":"1시간","price":27500,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특1호실 ( 182㎡ )","detail":"귀빈실 상주휴게실 샤워실 화장실","price":600000,"priceDisplay":"60만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특2호실 ( 132㎡ )","detail":"1시간","price":36000,"priceDisplay":"4만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특2호실 ( 132㎡ )","detail":"상주휴게실 샤워실 화장실","price":432000,"priceDisplay":"43만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특1호실 ( 182㎡ )","detail":"1시간","price":50000,"priceDisplay":"5만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"일반34호실 추가 대실( 99㎡ )","detail":"1일","price":240000,"priceDisplay":"24만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"일반345호실 ( 99㎡ )","detail":"상주휴게실 샤워실 화장실","price":330000,"priceDisplay":"33만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1시간","price":5000,"priceDisplay":"5,000원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1일(12시간이상)","price":60000,"priceDisplay":"6만원"}]'::jsonb,
    price_range = '빈소 3~60만원 / 안치실 1만원'
WHERE id = '10204916';

-- 정다운 장례식장 (정다운 장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"특실","detail":"빈소+접객실(1일기준)","price":400000,"priceDisplay":"40만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"일반실","detail":"빈소+접객실(1일기준)","price":300000,"priceDisplay":"30만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실(3일1회기준)","detail":"1회초과시 1일5만원","price":150000,"priceDisplay":"15만원"}]'::jsonb,
    price_range = '빈소 30~40만원 / 안치실 15만원'
WHERE id = '1479168265';

-- 거창장례식장 (거창장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"2층 특2호실","detail":"1일(60평)","price":500000,"priceDisplay":"50만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"1층 특실","detail":"1일(80평)","price":700000,"priceDisplay":"70만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"2층 특실","detail":"1일(80평)","price":700000,"priceDisplay":"70만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"3층 VIP실","detail":"1일(100평)","price":900000,"priceDisplay":"90만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1일","price":80000,"priceDisplay":"8만원"}]'::jsonb,
    price_range = '빈소 50~90만원 / 안치실 8만원'
WHERE id = '8681531';

-- 강북전문장례식장 (강북전문장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소사용료(301호)","detail":"24시간","price":450000,"priceDisplay":"45만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소사용료(특실VIP실)","detail":"24시간","price":1000000,"priceDisplay":"100만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소사용료(302호)","detail":"24시간","price":650000,"priceDisplay":"65만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"24시간","price":80000,"priceDisplay":"8만원"}]'::jsonb,
    price_range = '빈소 45~100만원 / 안치실 8만원'
WHERE id = '545205841';

-- 남도장례식장 (남도장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료(70평)","detail":"1실(24시간 기준)","price":650000,"priceDisplay":"65만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료(30평)","detail":"1실(24시간 기준)","price":480000,"priceDisplay":"48만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료사용료","detail":"(24시간기준)","price":72000,"priceDisplay":"7만원"}]'::jsonb,
    price_range = '빈소 48~65만원 / 안치실 7만원'
WHERE id = '18546303';

-- 근로복지공단 태백병원장례식장 (근로복지공단 태백병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치고(관내)","detail":"1시간1500(24시간기준)","price":36000,"priceDisplay":"4만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치고(관외)","detail":"1시간20(24시간기준)","price":48000,"priceDisplay":"5만원"}]'::jsonb,
    price_range = '안치실 4만원'
WHERE id = '23421821';

-- 울산병원장례식장 (울산병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일/24시간 기준","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '안치실 10만원'
WHERE id = '15674982';

-- 동서천 장례식장 (동서천 장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장임대료(특실)","detail":"1일/24시간","price":600000,"priceDisplay":"60만원"}]'::jsonb,
    price_range = '빈소 60만원'
WHERE id = '1906550170';

-- 세안종합병원장례식장 (세안종합병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장특실분향실사용료","detail":"특실24시간","price":400000,"priceDisplay":"40만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실사용료","detail":"1실24시간","price":70000,"priceDisplay":"7만원"}]'::jsonb,
    price_range = '빈소 40만원 / 안치실 7만원'
WHERE id = '17841358';

-- 순천중앙병원장례식장 (순천중앙병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"2호실","detail":"시간","price":2100,"priceDisplay":"2,100원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"1호실 특실","detail":"시간","price":27000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"2호실","detail":"일","price":500000,"priceDisplay":"50만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"1호실 특실","detail":"일","price":650000,"priceDisplay":"65만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"일","price":50000,"priceDisplay":"5만원"},{"category":"안치실이용료","subCategory":"일반","name":"수시(초염)","detail":"회","price":100000,"priceDisplay":"10만원"},{"category":"안치실이용료","subCategory":"일반","name":"염습비","detail":"회","price":300000,"priceDisplay":"30만원"}]'::jsonb,
    price_range = '빈소 0~65만원 / 안치실 5만원'
WHERE id = '25083558';

-- 포천영북농협장례식장 (영북농협장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"접객실및분향실사용료+청소비5만","detail":"시간당","price":20000,"priceDisplay":"2만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실사용료","detail":"시간당","price":4500,"priceDisplay":"4,500원"}]'::jsonb,
    price_range = '빈소 2만원 / 안치실 0만원'
WHERE id = '26423294';

-- 안동전문장례식장 (안동전문장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"기타","name":"안치실","detail":"1일","price":70000,"priceDisplay":"7만원"}]'::jsonb,
    price_range = '안치실 7만원'
WHERE id = '659386309';

-- (주)금성장례식장 ((주)금성장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료(1호)","detail":"1실/24시간/3일간","price":1500000,"priceDisplay":"150만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료(3호)","detail":"1실/24시간/3일간","price":900000,"priceDisplay":"90만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료(2호)","detail":"1실/24시간/3일간","price":1200000,"priceDisplay":"120만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일","price":80000,"priceDisplay":"8만원"}]'::jsonb,
    price_range = '빈소 90~150만원 / 안치실 8만원'
WHERE id = '580476947';

-- 혜민병원장례식장 (혜민병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"시설 임대료(빈소및접객실)","detail":"2호실3호실","price":720000,"priceDisplay":"72만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"시설 임대료(빈소및접객실)","detail":"1호실","price":960000,"priceDisplay":"96만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"시설임대료(빈소및접객실)","detail":"5호실","price":480000,"priceDisplay":"48만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일 1구당","price":84000,"priceDisplay":"8만원"}]'::jsonb,
    price_range = '빈소 48~96만원 / 안치실 8만원'
WHERE id = '25083624';

-- 연천군보건의료원 장례식장 (연천군장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 분향실(특대실)","detail":"1실/24시간 기준","price":325000,"priceDisplay":"33만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 분향실(특실)","detail":"1실/24시간 기준","price":260000,"priceDisplay":"26만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 분향실(일반)","detail":"1실/24시간 기준","price":130000,"priceDisplay":"13만원"},{"category":"안치실이용료","subCategory":"일반","name":"장례식장 안치료","detail":"1실/24시간 기준","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 13~33만원 / 안치실 10만원'
WHERE id = '10656218';

-- 명지병원장례식장 (예산명지병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '안치실 10만원'
WHERE id = '9446663';

-- 송탄장례식장 (송탄장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"기타","name":"고인 안치비","detail":"1시간","price":3000,"priceDisplay":"3,000원"}]'::jsonb,
    price_range = '안치실 0만원'
WHERE id = '19567479';

-- 영덕효요양병원장례식장 (영덕효요양병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"101호(40평)","detail":"접객실상주휴게실화장실+샤워장 / 시간당","price":22000,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특실(60평)","detail":"빈소 / 3일기준","price":300000,"priceDisplay":"30만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"102호(30평)","detail":"접객실상주휴게실화장실+샤워장 / 시간당","price":20000,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"102호(30평)","detail":"접객실상주휴게실화장실+샤워장 / 1일","price":480000,"priceDisplay":"48만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특실(60평)","detail":"접객실상주휴게실화장실+샤워장 / 1일","price":576000,"priceDisplay":"58만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"101호(40평)","detail":"접객실상주휴게실화장실+샤워장 / 1일","price":528000,"priceDisplay":"53만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특실(60평)","detail":"접객실상주휴게실화장실+샤워장 / 시간당","price":24000,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"102호(30평)","detail":"빈소 / 3일기준","price":200000,"priceDisplay":"20만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"101호(40평)","detail":"빈소 / 3일기준","price":250000,"priceDisplay":"25만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일","price":144000,"priceDisplay":"14만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"시간당","price":6000,"priceDisplay":"6,000원"}]'::jsonb,
    price_range = '빈소 2~58만원 / 안치실 1만원'
WHERE id = '17856904';

-- 강릉아산병원장례식장 (강릉아산병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소임대료(264㎡)","detail":"가족실접객실분향실/시간당","price":25000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소임대료(198㎡)","detail":"가족실접객실분향실/시간당","price":16000,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소임대료(264㎡)","detail":"가족실접객실분향실/시간당","price":23000,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소임대료(330㎡)","detail":"가족실접객실분향실/시간당","price":35000,"priceDisplay":"4만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소임대료(264㎡)","detail":"가족실접객실분향실/시간당","price":23000,"priceDisplay":"2만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"시간당","price":5000,"priceDisplay":"5,000원"}]'::jsonb,
    price_range = '빈소 2~4만원 / 안치실 1만원'
WHERE id = '10126530';

-- 서요양병원장례식장 (서요양병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실 101호","detail":"약 50평(30000/1시간)","price":720000,"priceDisplay":"72만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실 103호","detail":"약 43평(25000/1시간)","price":600000,"priceDisplay":"60만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실 102호","detail":"약 30평(20000/1시간)","price":480000,"priceDisplay":"48만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"3000원/1시간","price":72000,"priceDisplay":"7만원"}]'::jsonb,
    price_range = '빈소 48~72만원 / 안치실 7만원'
WHERE id = '9080338';

-- 쉴낙원 포항제일장례식장 (포항제일장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"안치실1일","price":50000,"priceDisplay":"5만원"}]'::jsonb,
    price_range = '안치실 5만원'
WHERE id = '12515348';

-- 속초보광병원장례식장 (속초보광병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향소(특실)","detail":"시간당","price":10000,"priceDisplay":"1만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향소(일반)","detail":"시간당","price":5000,"priceDisplay":"5,000원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"접객소(일반)","detail":"시간당","price":10000,"priceDisplay":"1만원"},{"category":"시설임대료","subCategory":"접객실","name":"접객소(특실)","detail":"시간당","price":15000,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"접객실","name":"접객소(VIP실)","detail":"시간당","price":25000,"priceDisplay":"3만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"시간당","price":2700,"priceDisplay":"2,700원"}]'::jsonb,
    price_range = '빈소 1~3만원 / 안치실 0만원'
WHERE id = '21775592';

-- 우주장례식장 (우주장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일기준","price":60000,"priceDisplay":"6만원"}]'::jsonb,
    price_range = '안치실 6만원'
WHERE id = '11171853';

-- 서해안장례식장 (서해안장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"203호 분양소접객실사용료","detail":"1일","price":200000,"priceDisplay":"20만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일(냉장)","price":70000,"priceDisplay":"7만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일(냉동)","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 20만원 / 안치실 7만원'
WHERE id = '143548540';

-- 영광장례식장 (영광장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"제2 객실료","detail":"1일","price":400000,"priceDisplay":"40만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"제1 객실료","detail":"1일","price":500000,"priceDisplay":"50만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"제4 객실료","detail":"1일","price":400000,"priceDisplay":"40만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"제3  객실료","detail":"1일","price":400000,"priceDisplay":"40만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 40~50만원 / 안치실 10만원'
WHERE id = '8438009';

-- 대성장례식장 (대성장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실사용료/3일","detail":"","price":300000,"priceDisplay":"30만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료/1일","detail":"냉장실","price":50000,"priceDisplay":"5만원"}]'::jsonb,
    price_range = '안치실 5만원'
WHERE id = '8266783';

-- 한림병원장례식장 (한림병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1시간당","price":5000,"priceDisplay":"5,000원"}]'::jsonb,
    price_range = '안치실 1만원'
WHERE id = '9580078';

-- 당진중앙장례식장 (당진중앙장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"1호실","detail":"24시간 264㎡(80평)","price":400000,"priceDisplay":"40만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"별관","detail":"24시간 396㎡(120평)","price":600000,"priceDisplay":"60만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"예식실","detail":"1회","price":100000,"priceDisplay":"10만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"2호실","detail":"24시간 142㎡(45평)","price":300000,"priceDisplay":"30만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특실","detail":"24시간 297㎡(90평)","price":500000,"priceDisplay":"50만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일/24시간","price":150000,"priceDisplay":"15만원"}]'::jsonb,
    price_range = '빈소 10~60만원 / 안치실 15만원'
WHERE id = '8593596';

-- 영산포농협장례식장 (영산포농협장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1일기준(100000원)","price":300000,"priceDisplay":"30만원"}]'::jsonb,
    price_range = '안치실 30만원'
WHERE id = '733836801';

-- 강릉아나병원장례식장 (강릉아나병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"접객실","name":"접객실(일반실)","detail":"1시간","price":6000,"priceDisplay":"6,000원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1시간","price":3000,"priceDisplay":"3,000원"}]'::jsonb,
    price_range = '빈소 1만원 / 안치실 0만원'
WHERE id = '21126690';

-- 북신안농협장례식장 (북신안농협장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실 사용료","detail":"시간단위로 계산","price":15000,"priceDisplay":"2만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일단위 계산","price":70000,"priceDisplay":"7만원"}]'::jsonb,
    price_range = '빈소 2만원 / 안치실 7만원'
WHERE id = '25121562';

-- 서울현대요양병원장례식장 (서울현대요양병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소사용료(접객실료포함)","detail":"80평형(264㎡/1일시간당/40000원)","price":960000,"priceDisplay":"96만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소사용료(접객실료포함)","detail":"60평형(198㎡/1일시간당/35000원","price":840000,"priceDisplay":"84만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"성인(14세이상)(1일시간당/4000원)","price":96000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 84~96만원 / 안치실 10만원'
WHERE id = '18645827';

-- 고성장례식장 (고성장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실","detail":"","price":6000,"priceDisplay":"6,000원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"","price":3500,"priceDisplay":"3,500원"}]'::jsonb,
    price_range = '빈소 1만원 / 안치실 0만원'
WHERE id = '26097738';

-- 대구파티마병원장례식장 (대구파티마병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실(특실)","detail":"약 165 ㎡  1일(24000/1시간)","price":570000,"priceDisplay":"57만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실(일반)","detail":"약 132 ㎡  1일(18000/1시간)","price":430000,"priceDisplay":"43만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실(일반)","detail":"약 118.8 ㎡ 1일(15000/1시간)","price":340000,"priceDisplay":"34만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실(귀빈실)","detail":"약 495 ㎡  1일(49000/1시간)","price":1160000,"priceDisplay":"116만원"}]'::jsonb,
    price_range = '빈소 34~116만원'
WHERE id = '14650764';

-- 순창장례식장 (순창장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1회","price":80000,"priceDisplay":"8만원"}]'::jsonb,
    price_range = '안치실 8만원'
WHERE id = '7968123';

-- 진주시민장례식장 ((주)시민장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1일","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '안치실 10만원'
WHERE id = '1308538615';

-- 효사랑장례식장 (구례효사랑병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실.접객실","detail":"1일","price":480000,"priceDisplay":"48만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1일","price":80000,"priceDisplay":"8만원"}]'::jsonb,
    price_range = '빈소 48만원 / 안치실 8만원'
WHERE id = '18286400';

-- 낙원장례식장 (낙원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"냉동실 사용료","detail":"","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '안치실 10만원'
WHERE id = '18057480';

-- 동해전문장례식장 (동해전문장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"시간당","price":3000,"priceDisplay":"3,000원"}]'::jsonb,
    price_range = '안치실 0만원'
WHERE id = '8942832';

-- 호반병원장례식장 (호반병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"시간당","price":3000,"priceDisplay":"3,000원"}]'::jsonb,
    price_range = '안치실 0만원'
WHERE id = '9623481';

-- 양지요양병원장례식장 (양지요양병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실(1호실)                            1일","detail":"227 ㎡(59평형)","price":700000,"priceDisplay":"70만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실(특실)                             1일","detail":"323 ㎡(98평형)","price":900000,"priceDisplay":"90만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실(3호실)                             1일","detail":"172 ㎡(52평형)","price":600000,"priceDisplay":"60만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실(2호실)                            1일","detail":"185 ㎡(56평형)","price":700000,"priceDisplay":"70만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실                                      1일","detail":"시간당 4000","price":96000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 60~90만원 / 안치실 10만원'
WHERE id = '25424010';

-- 구미제일요양병원장례식장 (구미제일요양병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"특실","detail":"184.61m2","price":39000,"priceDisplay":"4만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"1호실","detail":"122.8m2","price":26000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"2호실","detail":"163.35m2","price":31000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"3호실","detail":"60.76m2","price":13000,"priceDisplay":"1만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1hour","price":4000,"priceDisplay":"4,000원"}]'::jsonb,
    price_range = '빈소 1~4만원 / 안치실 0만원'
WHERE id = '1284605136';

-- 한서장례식장 (한서장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"시간당","price":8000,"priceDisplay":"8,000원"}]'::jsonb,
    price_range = '안치실 1만원'
WHERE id = '15575339';

-- 구룡장례식장 (구룡장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"구룡 4빈소","detail":"접객실 사용료(1일)","price":360000,"priceDisplay":"36만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"구룡 2빈소","detail":"접객실 사용료(1일)","price":552000,"priceDisplay":"55만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"구룡 1빈소","detail":"접객실 사용료(1일)","price":552000,"priceDisplay":"55만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"구룡 3빈소","detail":"접객실 사용료(1일)","price":480000,"priceDisplay":"48만원"},{"category":"안치실이용료","subCategory":"일반","name":"영안실","detail":"안치    사용료(1일)","price":72000,"priceDisplay":"7만원"}]'::jsonb,
    price_range = '빈소 36~55만원 / 안치실 7만원'
WHERE id = '27487484';

-- 규암농협장례식장 (규암농협장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일","price":72000,"priceDisplay":"7만원"}]'::jsonb,
    price_range = '안치실 7만원'
WHERE id = '1185973546';

-- 배방장례식장 (배방장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일 기준","price":120000,"priceDisplay":"12만원"}]'::jsonb,
    price_range = '안치실 12만원'
WHERE id = '13111128';

-- 효성병원 장례식장 (효성병원 장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"24시간","price":50000,"priceDisplay":"5만원"}]'::jsonb,
    price_range = '안치실 5만원'
WHERE id = '9414559';

-- 김천의료원장례식장 (김천의료원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"특 301호 (174.77㎡)","detail":"접객실분양실상주휴게실(시간당46000)","price":550000,"priceDisplay":"55만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"102호 (135.74㎡)","detail":"접객실분양실상주휴게실(시간당30000)","price":350000,"priceDisplay":"35만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특 202호 (174.77㎡)","detail":"접객실분양실상주휴게실(시간당42000)","price":500000,"priceDisplay":"50만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"101호 (105.30㎡)","detail":"접객실분양실상주휴게실(시간당21000)","price":250000,"priceDisplay":"25만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특 201호 (210.73㎡)","detail":"접객실분양실상주휴게실(시간당50000)","price":600000,"priceDisplay":"60만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"시간당 4200","price":50000,"priceDisplay":"5만원"}]'::jsonb,
    price_range = '빈소 25~60만원 / 안치실 5만원'
WHERE id = '1872121391';

-- 김제장례식장 (김제장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"특실","detail":"100 평","price":35000,"priceDisplay":"4만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"별관","detail":"141 평","price":45000,"priceDisplay":"5만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"2층","detail":"50평","price":30000,"priceDisplay":"3만원"}]'::jsonb,
    price_range = '빈소 3~5만원'
WHERE id = '8240014';

-- (주)원지산청장례식장 ((주)원지산청장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"24시간","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '안치실 10만원'
WHERE id = '956412797';

-- 의성전문장례식장 (의성전문장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"특실","detail":"130㎡/시간당 : 25.000원","price":600000,"priceDisplay":"60만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"일반실","detail":"90㎡/ 시간당 : 20.000원","price":480000,"priceDisplay":"48만원"},{"category":"안치실이용료","subCategory":"일반","name":"고인안치","detail":"안치실(20㎡)/ 시간당: 5000원","price":120000,"priceDisplay":"12만원"}]'::jsonb,
    price_range = '빈소 48~60만원 / 안치실 12만원'
WHERE id = '23857707';

-- 천안하늘공원장례식장 (천안하늘공원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1시간","price":6000,"priceDisplay":"6,000원"}]'::jsonb,
    price_range = '안치실 1만원'
WHERE id = '17014409';

-- 밀양병원장례식장 (밀양병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '안치실 10만원'
WHERE id = '10403979';

-- 하양전문장례식장 (하양전문장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실(일반실1)","detail":"101호","price":20000,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실(일반23)","detail":"202호 302호","price":25000,"priceDisplay":"3만원"}]'::jsonb,
    price_range = '빈소 2~3만원'
WHERE id = '21845414';

-- 괴산장례식장 (괴산장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"접객실","name":"국화접객실","detail":"1일","price":700000,"priceDisplay":"70만원"},{"category":"시설임대료","subCategory":"접객실","name":"백합1실","detail":"1일","price":750000,"priceDisplay":"75만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일","price":150000,"priceDisplay":"15만원"}]'::jsonb,
    price_range = '빈소 70~75만원 / 안치실 15만원'
WHERE id = '8211263';

-- 남천안장례식장 (남천안 장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소임대료","detail":"일반실 50평 (165㎡)","price":20000,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소임대료","detail":"VIP실 100평 (330㎡)","price":35000,"priceDisplay":"4만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소임대료","detail":"특실 70평 (232㎡)","price":30000,"priceDisplay":"3만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실사용료","detail":"시간당 계산 (10㎡)","price":5000,"priceDisplay":"5,000원"}]'::jsonb,
    price_range = '빈소 2~4만원 / 안치실 1만원'
WHERE id = '1339264190';

-- 가남베스트장례식장 (가남베스트장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소+접객실","detail":"시간","price":18000,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소+접객실","detail":"시간","price":30000,"priceDisplay":"3만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치냉장","detail":"시간","price":3000,"priceDisplay":"3,000원"}]'::jsonb,
    price_range = '빈소 2~3만원 / 안치실 0만원'
WHERE id = '11386505';

-- 다인농협장례식장 (다인농협장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장사용료(1호실)","detail":"1일기준","price":408000,"priceDisplay":"41만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장사용료(2호실)","detail":"1일기준","price":360000,"priceDisplay":"36만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1일기준","price":120000,"priceDisplay":"12만원"}]'::jsonb,
    price_range = '빈소 36~41만원 / 안치실 12만원'
WHERE id = '1114089140';

-- 삼신전문장례식장 (삼신전문장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일","price":150000,"priceDisplay":"15만원"}]'::jsonb,
    price_range = '안치실 15만원'
WHERE id = '8388383';

-- 연세대학교 원주장례식장 (연세대학교 원주장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소사용료(206㎡)","detail":"1실/1시간 기준","price":43000,"priceDisplay":"4만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소사용료(100㎟)","detail":"1실/1시간 기준","price":11000,"priceDisplay":"1만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소사용료(160㎡)","detail":"1실/1시간 기준","price":27000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소사용료(126㎡)","detail":"1실/1시간 기준","price":16000,"priceDisplay":"2만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1실/1시간 기준","price":3300,"priceDisplay":"3,300원"}]'::jsonb,
    price_range = '빈소 1~4만원 / 안치실 0만원'
WHERE id = '14650865';

-- 관인농협장례식장 (관인농협장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장임대료","detail":"장례건(1일)당(1일추가당10만원)","price":600000,"priceDisplay":"60만원"},{"category":"안치실이용료","subCategory":"일반","name":"장례식장안치료","detail":"1일","price":108000,"priceDisplay":"11만원"}]'::jsonb,
    price_range = '빈소 60만원 / 안치실 11만원'
WHERE id = '9687782';

-- 군산장례식장 (군산장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실 이용료(특실150평)","detail":"시간당 / MOU업체 50%D/C","price":65000,"priceDisplay":"7만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실 이용료(일반실80평)","detail":"시간당 / MOU업체 50%D/C","price":40000,"priceDisplay":"4만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"시간당","price":10000,"priceDisplay":"1만원"}]'::jsonb,
    price_range = '빈소 4~7만원 / 안치실 1만원'
WHERE id = '11033999';

-- 창녕군공설장례식장 (창녕군공설장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료(대)","detail":"1실 24시간 기준 12시간 미만일 경우 반일 징수","price":100000,"priceDisplay":"10만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료(소)","detail":"1실 24시간 기준 12시간 미만일 경우 반일 징수","price":50000,"priceDisplay":"5만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1실 24시간 기준 12시간 미만일 경우 반일 징수","price":50000,"priceDisplay":"5만원"}]'::jsonb,
    price_range = '빈소 5~10만원 / 안치실 5만원'
WHERE id = '8080326';

-- 예드림장례식장 (예드림장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료","detail":"2호실 / 1시간 기준","price":35000,"priceDisplay":"4만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료","detail":"특1호실/ 1시간 기준","price":40000,"priceDisplay":"4만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료","detail":"5호실 / 1시간 기준","price":25000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료","detail":"3호실 / 1시간 기준","price":30000,"priceDisplay":"3만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1구/24시간 기준","price":140000,"priceDisplay":"14만원"}]'::jsonb,
    price_range = '빈소 3~4만원 / 안치실 14만원'
WHERE id = '20491325';

-- 중앙병원장례식장 ((주)중앙병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료","detail":"30평-1일24시간 기준","price":400000,"priceDisplay":"40만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료","detail":"70평-1일24시간 기준","price":720000,"priceDisplay":"72만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료","detail":"70평-1일24시간 기준","price":760000,"priceDisplay":"76만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료","detail":"95평-1일24시간 기준","price":960000,"priceDisplay":"96만원"}]'::jsonb,
    price_range = '빈소 40~96만원'
WHERE id = '9431648';

-- 조암장례식장 (조암장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"102호","detail":"30m2","price":240000,"priceDisplay":"24만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"202203호","detail":"80평","price":840000,"priceDisplay":"84만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"101 201호","detail":"150평","price":1440000,"priceDisplay":"144만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일","price":96000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 24~144만원 / 안치실 10만원'
WHERE id = '1388476337';

-- 새웅상요양병원장례식장 (새웅상요양병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"3호별관","detail":"25평","price":350000,"priceDisplay":"35만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"2호실","detail":"60평","price":450000,"priceDisplay":"45만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"1호실","detail":"60평","price":450000,"priceDisplay":"45만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실이용료","detail":"시간당4166원","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 35~45만원 / 안치실 10만원'
WHERE id = '26431235';

-- 한림정낭장례예식장 (한림정낭장례예식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1구/1일","price":50000,"priceDisplay":"5만원"}]'::jsonb,
    price_range = '안치실 5만원'
WHERE id = '24942464';

-- 도민장례식장 (도민장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"6호실 1일사용료(25000원/시간)","detail":"165㎡.빈소접객실상주휴게실1상주샤워실1주방","price":600000,"priceDisplay":"60만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"VIP3분향소 1일사용료(45000원/시간)","detail":"495㎡.빈소접객실상주휴게실3상주샤워실2주방","price":1080000,"priceDisplay":"108만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"VIP2분향소 1일사용료 (45000원/시간)","detail":"495㎡.빈소접객실상주휴게실3상주샤워실2주방","price":1080000,"priceDisplay":"108만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"VIP5분향소 1일사용료(35000원/시간)","detail":"330㎡.빈소접객실상주휴게실2상주샤워실2주방","price":840000,"priceDisplay":"84만원"},{"category":"안치실이용료","subCategory":"기타","name":"안치냉장고사용료(4000원/시간)","detail":"","price":96000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 60~108만원 / 안치실 10만원'
WHERE id = '1553057399';

-- 경안장례식장 (경안장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료 (A형)","detail":"시간당 41660 * 24시간","price":1000000,"priceDisplay":"100만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료 (B형)","detail":"시간당 30000 * 24시간","price":720000,"priceDisplay":"72만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료 (C형)","detail":"시간당 17916 * 24시간","price":430000,"priceDisplay":"43만원"}]'::jsonb,
    price_range = '빈소 43~100만원'
WHERE id = '14526271';

-- 김해시민장례식장 (김해시민장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"","name":"특501호실","detail":"상주 휴게실 1개 응접실1개 분향소 접객실 (180평) 1일/24시간","price":2340000,"priceDisplay":"234만원"}]'::jsonb,
    price_range = '안치실 234만원'
WHERE id = '1251812206';

-- 성균관대학교 삼성창원병원 장례식장 (삼성창원병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료(287m² 2실)","detail":"1일/24시간기준","price":680400,"priceDisplay":"68만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료(119m² 1실)","detail":"1일/24시간기준","price":235200,"priceDisplay":"24만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료(40m² 1실 대기실)","detail":"1일/24시간기준","price":90000,"priceDisplay":"9만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료(330m² 1실)","detail":"1일/24시간기준","price":984000,"priceDisplay":"98만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료(231m² 1실)","detail":"1일/24시간기준","price":540000,"priceDisplay":"54만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일/24시간기준","price":60000,"priceDisplay":"6만원"}]'::jsonb,
    price_range = '빈소 9~98만원 / 안치실 6만원'
WHERE id = '8964803';

-- 울산국화원장례식장 ((주)울산국화원장례식장 북울산지점)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소/접객실 [VIP2] 125평/100석","detail":"1일 / 24시간","price":960000,"priceDisplay":"96만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소/접객실 [특실] 85평/30석","detail":"1일 / 24시간","price":750000,"priceDisplay":"75만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소/접객실 [VIP1] 125평/100석","detail":"1일 / 24시간","price":960000,"priceDisplay":"96만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1일 / 24시간","price":120000,"priceDisplay":"12만원"}]'::jsonb,
    price_range = '빈소 75~96만원 / 안치실 12만원'
WHERE id = '26468682';

-- 신가병원 장례식장 (신가병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실(일반실)","detail":"1일/24시간기준","price":500000,"priceDisplay":"50만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실(특실)","detail":"1일/24시간기준","price":600000,"priceDisplay":"60만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1실/24시간기준","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 50~60만원 / 안치실 10만원'
WHERE id = '9187832';

-- 서정리장례식장 (서정리장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"냉장안치료","detail":"1일","price":90000,"priceDisplay":"9만원"}]'::jsonb,
    price_range = '안치실 9만원'
WHERE id = '27162345';

-- 안양장례식장 (안양장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일","price":120000,"priceDisplay":"12만원"}]'::jsonb,
    price_range = '안치실 12만원'
WHERE id = '9115429';

-- 예천장례식장 (예천장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"시간당","price":4170,"priceDisplay":"4,170원"}]'::jsonb,
    price_range = '안치실 0만원'
WHERE id = '10637488';

-- 교원예움 포항국화원장례식장 (포항국화원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"접객실","name":"특실8호 접객실","detail":"60석 / 1일 (좌식기준 80석)","price":660000,"priceDisplay":"66만원"},{"category":"시설임대료","subCategory":"접객실","name":"특실9호 접객실","detail":"60석 / 1일 (좌식기준 80석)","price":660000,"priceDisplay":"66만원"},{"category":"시설임대료","subCategory":"접객실","name":"특실7호 접객실","detail":"60석 / 1일 (좌식기준 80석)","price":660000,"priceDisplay":"66만원"},{"category":"시설임대료","subCategory":"접객실","name":"VIP3호 접객실","detail":"120석 / 1일 (좌식기준 168석)","price":1230000,"priceDisplay":"123만원"},{"category":"시설임대료","subCategory":"접객실","name":"MVG 접객실","detail":"250석 / 1일 (좌식기준 350석)","price":2400000,"priceDisplay":"240만원"},{"category":"시설임대료","subCategory":"접객실","name":"VIP5호 접객실","detail":"100석 / 1일 (좌식기준 140석)","price":1020000,"priceDisplay":"102만원"},{"category":"시설임대료","subCategory":"접객실","name":"VIP6호 접객실","detail":"122석 / 1일 (좌식기준 170석)","price":1260000,"priceDisplay":"126만원"},{"category":"시설임대료","subCategory":"접객실","name":"VIP2호 접객실","detail":"110석 / 1일 (좌식기준 154석)","price":1140000,"priceDisplay":"114만원"},{"category":"시설임대료","subCategory":"접객실","name":"VIP1호 접객실","detail":"88석 / 1일 (좌식기준 124석)","price":900000,"priceDisplay":"90만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1일","price":50000,"priceDisplay":"5만원"},{"category":"안치실이용료","subCategory":"염습실/입관실","name":"염습실 사용료","detail":"1회","price":200000,"priceDisplay":"20만원"}]'::jsonb,
    price_range = '빈소 66~240만원 / 안치실 5만원'
WHERE id = '1115026216';

-- 경북대학교병원장례식장 (경북대학교병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"102호(일반실)","detail":"1일(69㎡/13750/1시간)","price":330000,"priceDisplay":"33만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특206호(준특실)","detail":"1일(169㎡/31500/1시간)","price":756000,"priceDisplay":"76만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특205호(특실)","detail":"1일(248㎡/43000/1시간)","price":1032000,"priceDisplay":"103만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특104호(준특실)","detail":"1일(160㎡/29500/1시간)","price":708000,"priceDisplay":"71만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특101호(특실)","detail":"1일(248㎡/43000/1시간)","price":1032000,"priceDisplay":"103만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"103호(일반실)","detail":"1일(80㎡/15750/1시간)","price":378000,"priceDisplay":"38만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"208호(일반실)","detail":"1일(87㎡/17750/1시간)","price":426000,"priceDisplay":"43만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특209호(특실)","detail":"1일(248㎡/43000/1시간)","price":1032000,"priceDisplay":"103만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"207호(일반실)","detail":"1일(69㎡/13750/1시간)","price":330000,"priceDisplay":"33만원"}]'::jsonb,
    price_range = '빈소 33~103만원'
WHERE id = '17092809';

-- 제천노인장례식장 (제천노인병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"시간당","price":1500,"priceDisplay":"1,500원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일","price":36000,"priceDisplay":"4만원"}]'::jsonb,
    price_range = '안치실 0만원'
WHERE id = '21451559';

-- 대한장례식장 (대한장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"","name":"안치료","detail":"1일(80000) 1시간(33000)","price":80000,"priceDisplay":"8만원"}]'::jsonb,
    price_range = '안치실 8만원'
WHERE id = '10320704';

-- 고성영락원장례식장 (고성영락원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"특3호특4호특5호","detail":"98평 (1일기준)","price":990000,"priceDisplay":"99만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특2호실","detail":"78평 (1일기준)","price":890000,"priceDisplay":"89만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1일기준","price":50000,"priceDisplay":"5만원"}]'::jsonb,
    price_range = '빈소 89~99만원 / 안치실 5만원'
WHERE id = '587613891';

-- 혜원성모병원장례식장 (혜원성모병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"","name":"고인 냉장 안치료","detail":"1일 사용료","price":96000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '안치실 10만원'
WHERE id = '10984874';

-- 청하요양병원장례식장 (청하요양병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1시간: 8.500원","price":120000,"priceDisplay":"12만원"}]'::jsonb,
    price_range = '안치실 12만원'
WHERE id = '26430236';

-- 조은금강병원장례식장 (금강병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"접객실","name":"2분향소","detail":"접객실(시간당)","price":10000,"priceDisplay":"1만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"안치료(시간당)","price":3000,"priceDisplay":"3,000원"}]'::jsonb,
    price_range = '빈소 1만원 / 안치실 0만원'
WHERE id = '10002283';

-- (주)광양장례식장 ((주)광양장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"접객실","name":"객실(대)","detail":"1일","price":50000,"priceDisplay":"5만원"},{"category":"시설임대료","subCategory":"접객실","name":"객실(중)","detail":"1일","price":40000,"priceDisplay":"4만원"},{"category":"안치실이용료","subCategory":"","name":"안치실","detail":"1일","price":200000,"priceDisplay":"20만원"}]'::jsonb,
    price_range = '빈소 4~5만원 / 안치실 20만원'
WHERE id = '8777821';

-- 영광종합병원장례식장 (영광종합병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"접객실","name":"234호관","detail":"1일당(시간당 55000원)","price":400000,"priceDisplay":"40만원"},{"category":"시설임대료","subCategory":"접객실","name":"1호관","detail":"1일당(시간당 70000원)","price":600000,"priceDisplay":"60만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실이용료","detail":"1일당","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 40~60만원 / 안치실 10만원'
WHERE id = '20195876';

-- 순천향대학교 서울병원 장례식장 (순천향장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"VIP분향소 빈소.접객실 사용료","detail":"1일 기준","price":800000,"priceDisplay":"80만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"2분향소 빈소.접객실 사용료","detail":"1일 기준","price":400000,"priceDisplay":"40만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특분향소 빈소.접객실 사용료","detail":"1일 기준","price":700000,"priceDisplay":"70만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"3분향소 빈소.접객실 사용료","detail":"1일 기준","price":200000,"priceDisplay":"20만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"1분향소 빈소.접객실 사용료","detail":"1일 기준","price":500000,"priceDisplay":"50만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일 기준","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 20~80만원 / 안치실 10만원'
WHERE id = '7965611';

-- 예천권병원장례식장 (예천권병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장임대료(특 실)-3호실","detail":"1실/24시간기준","price":450000,"priceDisplay":"45만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료 (일반실)-2호실","detail":"1실/24시간 기준","price":350000,"priceDisplay":"35만원"}]'::jsonb,
    price_range = '빈소 35~45만원'
WHERE id = '9891080';

-- 전라남도순천의료원 장례식장 (순천의료원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"사체안치료","detail":"1일 사용료","price":50000,"priceDisplay":"5만원"},{"category":"안치실이용료","subCategory":"일반","name":"사체안치료","detail":"시간당 사용료","price":2100,"priceDisplay":"2,100원"}]'::jsonb,
    price_range = '안치실 0만원'
WHERE id = '11121275';

-- 한중프라임장례식장 (프라임장례원)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소사용료(일반실)","detail":"40평형/1일기준 (12시간 이상)","price":300000,"priceDisplay":"30만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소사용료(특실)","detail":"100평형/1일기준 (12시간 이상)","price":800000,"priceDisplay":"80만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소사용료(일반실)","detail":"90평형/1일기준 (12시간 이상)","price":700000,"priceDisplay":"70만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일","price":125000,"priceDisplay":"13만원"}]'::jsonb,
    price_range = '빈소 30~80만원 / 안치실 13만원'
WHERE id = '8638504';

-- (주)한빛장례식장 ((주)한빛장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"특실 1","detail":"261.90 m2 (132석) / 1일","price":1200000,"priceDisplay":"120만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특실 2","detail":"224.62 m2 (99석) / 1일","price":1000000,"priceDisplay":"100만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"VIP 2","detail":"327.91 m2 (163석) / 1일","price":1300000,"priceDisplay":"130만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"VIP 1","detail":"318.30 m2 (198석) / 1일","price":1400000,"priceDisplay":"140만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1일","price":80000,"priceDisplay":"8만원"}]'::jsonb,
    price_range = '빈소 100~140만원 / 안치실 8만원'
WHERE id = '15843684';

-- 횡성장례문화센터 (횡성장례문화센터)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소임대료","detail":"1시간당","price":10000,"priceDisplay":"1만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실이용료","detail":"1시간당","price":5000,"priceDisplay":"5,000원"}]'::jsonb,
    price_range = '빈소 1만원 / 안치실 1만원'
WHERE id = '92';

-- 김화장례문화원 (김화장례문화원)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"특2호실(분향실포함 조합원할인)","detail":"247m2 (75평형)","price":600000,"priceDisplay":"60만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"일반1호실(분향실포함 조합원할인)","detail":"115m2(35평형)","price":350000,"priceDisplay":"35만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특1호실(분향실포함 조합원할인)","detail":"297m2 (90평형)","price":750000,"priceDisplay":"75만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 35~75만원 / 안치실 10만원'
WHERE id = '90';

-- 서안동농협장례식장 (서안동농협장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"301호(특실)","detail":"96평","price":960000,"priceDisplay":"96만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"203호","detail":"80평","price":800000,"priceDisplay":"80만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"302호","detail":"68평","price":680000,"priceDisplay":"68만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"201호202호","detail":"46평","price":460000,"priceDisplay":"46만원"}]'::jsonb,
    price_range = '빈소 46~96만원'
WHERE id = '531348631';

-- 강남병원장례식장 (강남병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장임대료(일반실)","detail":"1실/24시간기준","price":312000,"priceDisplay":"31만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장임대료(특실-b)","detail":"1실/24시간기준","price":456000,"priceDisplay":"46만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장임대료(특실-a)","detail":"1실/24시간기준","price":576000,"priceDisplay":"58만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실 사용료","detail":"1일 /24시간기준","price":72000,"priceDisplay":"7만원"}]'::jsonb,
    price_range = '빈소 31~58만원 / 안치실 7만원'
WHERE id = '14650809';

-- 대한병원장례식장 (대한병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"로비사용","detail":"24시간 사용료","price":200000,"priceDisplay":"20만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"제5호실","detail":"24시간 사용료","price":530000,"priceDisplay":"53만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특2호실","detail":"24시간 사용료","price":750000,"priceDisplay":"75만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특1호실","detail":"24시간 사용료","price":850000,"priceDisplay":"85만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"제3호실","detail":"24시간 사용료","price":480000,"priceDisplay":"48만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"24시간 사용료","price":90000,"priceDisplay":"9만원"}]'::jsonb,
    price_range = '빈소 20~85만원 / 안치실 9만원'
WHERE id = '10312259';

-- 목포시의료원장례식장 (목포시의료원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"1호실(67평)","detail":"분향실접객실상주휴게실샤워실주방","price":400000,"priceDisplay":"40만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"2호실(61평)","detail":"분향실접객실상주휴게실샤워실주방","price":400000,"priceDisplay":"40만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"1+2호실(120평)","detail":"분향실접객실상주휴게실샤워실주방","price":600000,"priceDisplay":"60만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"안치냉장고 사용료","price":50000,"priceDisplay":"5만원"}]'::jsonb,
    price_range = '빈소 40~60만원 / 안치실 5만원'
WHERE id = '983951137';

-- 남해전문장례식장 (남해전문장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실사용료(2호)","detail":"1시간당","price":20000,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실 사용료(1호)","detail":"1시간당","price":25000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실(3호)","detail":"1시간당","price":15000,"priceDisplay":"2만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1시간당","price":4000,"priceDisplay":"4,000원"}]'::jsonb,
    price_range = '빈소 2~3만원 / 안치실 0만원'
WHERE id = '8880155';

-- 마량장례식장 (마량장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실 사용료","detail":"","price":60000,"priceDisplay":"6만원"}]'::jsonb,
    price_range = '안치실 6만원'
WHERE id = '11469936';

-- 진영전문장례식장 (진영전문장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"기타","name":"득실","detail":"24시간","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '안치실 10만원'
WHERE id = '23352864';

-- 양주한국병원 장례문화원 (양주한국병원장례문화원 주식회사)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일/24시간기준","price":240000,"priceDisplay":"24만원"}]'::jsonb,
    price_range = '안치실 24만원'
WHERE id = '622095104';

-- 제주그린장례식장 (제주그린장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일","price":50000,"priceDisplay":"5만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일","price":50000,"priceDisplay":"5만원"}]'::jsonb,
    price_range = '안치실 5만원'
WHERE id = '27457824';

-- 조치원장례식장 (조치원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"고인 안치실","detail":"하루 24시간 사용료","price":5000,"priceDisplay":"5,000원"}]'::jsonb,
    price_range = '안치실 1만원'
WHERE id = '8511566';

-- 의성중부농협장례식장 (의성중부농협장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실 접객실","detail":"1 분향실 접객실","price":600000,"priceDisplay":"60만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실 접객실","detail":"2 분향실 접객식","price":480000,"priceDisplay":"48만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"안치실","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 48~60만원 / 안치실 10만원'
WHERE id = '136';

-- 중앙대학교병원장례식장 (중앙대학교병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료 (200㎡)","detail":"1실/24시간 기준","price":1488000,"priceDisplay":"149만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료 (180㎡)","detail":"1실/24시간 기준","price":1200000,"priceDisplay":"120만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료 (304㎡)","detail":"1실/24시간 기준","price":2256000,"priceDisplay":"226만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료 (276㎡)","detail":"1실/24시간 기준","price":2016000,"priceDisplay":"202만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료 (213㎡)","detail":"1실/24시간 기준","price":1488000,"priceDisplay":"149만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료 (203㎡)","detail":"1실/24시간 기준","price":1488000,"priceDisplay":"149만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료 (170㎡)","detail":"1실/24시간 기준","price":1080000,"priceDisplay":"108만원"},{"category":"안치실이용료","subCategory":"일반","name":"장례식장 안치","detail":"1실 / 24시간 기준","price":96000,"priceDisplay":"10만원"},{"category":"안치실이용료","subCategory":"일반","name":"장례식장 안치","detail":"1실 / 1시간 기준","price":4000,"priceDisplay":"4,000원"}]'::jsonb,
    price_range = '빈소 108~226만원 / 안치실 0만원'
WHERE id = '14650826';

-- 새통영병원장례식장 (새통영병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"특5호","detail":"시간당","price":15000,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"vip1실","detail":"시간당","price":25000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특3호","detail":"시간당","price":18000,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특2호","detail":"시간당","price":20000,"priceDisplay":"2만원"}]'::jsonb,
    price_range = '빈소 2~3만원'
WHERE id = '7930011';

-- 봉화장례식장 (봉화장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실3호실","detail":"1실/24시간기준시간당","price":30000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실2호실","detail":"1실/24시간 기준시간당","price":30000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실특1호실","detail":"1실/24시간기준시간당","price":35000,"priceDisplay":"4만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1실/24시간기준시간당","price":8000,"priceDisplay":"8,000원"}]'::jsonb,
    price_range = '빈소 3~4만원 / 안치실 1만원'
WHERE id = '139';

-- 송정사랑병원장례식장 (송정사랑병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"냉동실(안치실)","detail":"안치실(1일)","price":50000,"priceDisplay":"5만원"}]'::jsonb,
    price_range = '안치실 5만원'
WHERE id = '141';

-- k병원장례식장 예지원 (k병원장례식장 예지원)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"101호","detail":"80평","price":948000,"priceDisplay":"95만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"102호","detail":"50평","price":708000,"priceDisplay":"71만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"103호","detail":"100평","price":1320000,"priceDisplay":"132만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"203호","detail":"80평","price":948000,"priceDisplay":"95만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"202호","detail":"60평","price":828000,"priceDisplay":"83만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"201호","detail":"80평","price":948000,"priceDisplay":"95만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"","price":96000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 71~132만원 / 안치실 10만원'
WHERE id = '143';

-- 파주보람장례식장 (파주보람장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"시신안치료","detail":"1일","price":60000,"priceDisplay":"6만원"}]'::jsonb,
    price_range = '안치실 6만원'
WHERE id = '14650780';

-- 대청병원 장례식장 (대청병원 장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"시간","price":3000,"priceDisplay":"3,000원"}]'::jsonb,
    price_range = '안치실 0만원'
WHERE id = '1379518168';

-- 나주종합병원장례식장 (나주종합병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장임대료","detail":"1일","price":400000,"priceDisplay":"40만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실이용료","detail":"1일","price":75000,"priceDisplay":"8만원"}]'::jsonb,
    price_range = '빈소 40만원 / 안치실 8만원'
WHERE id = '21959442';

-- 자굴산장례식장 (자굴산장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"접객실 분향실 1일","detail":"VIP","price":650000,"priceDisplay":"65만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"접객실 분향실 1일","detail":"2층 특1실특2실","price":450000,"priceDisplay":"45만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실이용료","detail":"1일","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 45~65만원 / 안치실 10만원'
WHERE id = '20423097';

-- 정읍사랑병원장례식장 (정읍사랑병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1시간당","price":5000,"priceDisplay":"5,000원"}]'::jsonb,
    price_range = '안치실 1만원'
WHERE id = '8067190';

-- 동주병원장례식장 (동주병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"기타","name":"안치실","detail":"1일(시간당/5000)","price":120000,"priceDisplay":"12만원"}]'::jsonb,
    price_range = '안치실 12만원'
WHERE id = '150';

-- 울산영락원 (울산영락원)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소접객실(일반실102호/85평)","detail":"1일/24시간","price":510000,"priceDisplay":"51만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소접객실(특실501호/120평)","detail":"1일/24시간","price":840000,"priceDisplay":"84만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소접객실(일반실101호/65평)","detail":"1일/24시간","price":390000,"priceDisplay":"39만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소접객실(특실201호/90평)","detail":"1일/24시간","price":630000,"priceDisplay":"63만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소접객실(VIP실203호/160평)","detail":"1일/24시간","price":1120000,"priceDisplay":"112만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소접객실(특실202호/110평)","detail":"1일/24시간","price":770000,"priceDisplay":"77만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소접객실(VIP실301호/200평)","detail":"1일/24시간","price":1400000,"priceDisplay":"140만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소접객실(VIP실302호/180평)","detail":"1일/24시간","price":1260000,"priceDisplay":"126만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소접객실(VIP실100호/110평)","detail":"1일/24시간","price":770000,"priceDisplay":"77만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1일/24시간","price":120000,"priceDisplay":"12만원"}]'::jsonb,
    price_range = '빈소 39~140만원 / 안치실 12만원'
WHERE id = '151';

-- 국제성모장례식장 (국제성모장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소사용료(m²)","detail":"280","price":1200000,"priceDisplay":"120만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소사용료(m²)","detail":"132","price":552000,"priceDisplay":"55만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소사용료(m²)","detail":"247","price":1080000,"priceDisplay":"108만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소사용료(m²)","detail":"495","price":2280000,"priceDisplay":"228만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소사용료(m²)","detail":"760","price":3624000,"priceDisplay":"362만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소사용료(m²)","detail":"330","price":1512000,"priceDisplay":"151만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소사용료(m²)","detail":"231","price":960000,"priceDisplay":"96만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소사용료(m²)","detail":"198","price":792000,"priceDisplay":"79만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실 임대료","detail":"안치료","price":120000,"priceDisplay":"12만원"}]'::jsonb,
    price_range = '빈소 55~362만원 / 안치실 12만원'
WHERE id = '152';

-- 인천삼성장례문화원 (인천삼성장례문화원)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"기타","name":"지하","detail":"시간당","price":5000,"priceDisplay":"5,000원"}]'::jsonb,
    price_range = '안치실 1만원'
WHERE id = '153';

-- 철원병원장례식장 (원병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소/접객실 임대료","detail":"특실 1일/24시간기준","price":840000,"priceDisplay":"84만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소/접객실 임대료","detail":"일반 1일/24시간기준","price":480000,"priceDisplay":"48만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"환경관리비","detail":"1인기준","price":30000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소/접객실 임대료","detail":"중실 1일/24시간기준","price":552000,"priceDisplay":"55만원"},{"category":"안치실이용료","subCategory":"기타","name":"안치관리비","detail":"1일/24시간기준","price":120000,"priceDisplay":"12만원"}]'::jsonb,
    price_range = '빈소 3~84만원 / 안치실 12만원'
WHERE id = '11256692';

-- 우리장례식장 (우리장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실사용료","detail":"1일","price":96000,"priceDisplay":"10만원"},{"category":"안치실이용료","subCategory":"염습실/입관실","name":"안치료","detail":"1일","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '안치실 10만원'
WHERE id = '18716712';

-- 탄현베스트장례식장 (베스트장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"특1호실- 247m2(1층)","detail":"빈소임대료 / 1일","price":1080000,"priceDisplay":"108만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"금강실- 115m2","detail":"빈소임대료 / 1일","price":600000,"priceDisplay":"60만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특2호실- 247m2(2층)","detail":"빈소임대료 / 1일","price":1080000,"priceDisplay":"108만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특3호실- 247m2(2층)","detail":"빈소임대료 / 1일","price":1080000,"priceDisplay":"108만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"염습실","detail":"염습실임대료 1일","price":400000,"priceDisplay":"40만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"한라실- 184m2","detail":"빈소임대료 / 1일","price":840000,"priceDisplay":"84만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실이용료","detail":"안치실이용료/시간","price":3000,"priceDisplay":"3,000원"}]'::jsonb,
    price_range = '빈소 40~108만원 / 안치실 0만원'
WHERE id = '8111240';

-- 김녕농협 장례문화센터 (김녕농협 장례문화센터)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"접객실분향실","detail":"시간당","price":10000,"priceDisplay":"1만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치냉장고","detail":"시간당(2000원)","price":2000,"priceDisplay":"2,000원"}]'::jsonb,
    price_range = '빈소 1만원 / 안치실 0만원'
WHERE id = '158';

-- 제천서울병원장례식장 (제천서울병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료 24시간","detail":"하루기준","price":60000,"priceDisplay":"6만원"}]'::jsonb,
    price_range = '안치실 6만원'
WHERE id = '159';

-- 자연병원장례식장 (자연병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일 24시간 기준","price":150000,"priceDisplay":"15만원"}]'::jsonb,
    price_range = '안치실 15만원'
WHERE id = '1426957657';

-- 단양군립노인요양병원장례식장 (단양군립노인요양병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"1일 접객실","detail":"1일 시간당3.000원","price":70000,"priceDisplay":"7만원"},{"category":"안치실이용료","subCategory":"일반","name":"1일 안치실","detail":"1일 시간당1.700원","price":40000,"priceDisplay":"4만원"}]'::jsonb,
    price_range = '빈소 7만원 / 안치실 4만원'
WHERE id = '9697598';

-- 진천제일장례식장 (진천제일장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일/24시간 기준","price":50000,"priceDisplay":"5만원"}]'::jsonb,
    price_range = '안치실 5만원'
WHERE id = '160';

-- 참사랑병원장례식장 (참사랑장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"접객실","name":"시설사용료","detail":"접견실(시간당)","price":25000,"priceDisplay":"3만원"},{"category":"안치실이용료","subCategory":"기타","name":"고인분 모셔놓은 냉동고","detail":"1일기준","price":70000,"priceDisplay":"7만원"}]'::jsonb,
    price_range = '빈소 3만원 / 안치실 7만원'
WHERE id = '161';

-- 농협장례문화원 (농협장례문화원)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"203호","detail":"133 m2 / 일","price":528000,"priceDisplay":"53만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"202호","detail":"163 m2 / 일","price":600000,"priceDisplay":"60만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"201호","detail":"243.21 m2 / 일","price":840000,"priceDisplay":"84만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"101호","detail":"243.21 m2 / 일","price":840000,"priceDisplay":"84만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일","price":72000,"priceDisplay":"7만원"}]'::jsonb,
    price_range = '빈소 53~84만원 / 안치실 7만원'
WHERE id = '163';

-- 송원장례문화원 (송원장례문화원)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"2호실","detail":"","price":840000,"priceDisplay":"84만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실 이용료","detail":"","price":5000,"priceDisplay":"5,000원"}]'::jsonb,
    price_range = '빈소 84만원 / 안치실 1만원'
WHERE id = '164';

-- 통영전문장례식장 (통영전문장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"시간당","price":6000,"priceDisplay":"6,000원"}]'::jsonb,
    price_range = '안치실 1만원'
WHERE id = '26045225';

-- 시화병원 장례식장 (시화병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일(시간당5000)","price":120000,"priceDisplay":"12만원"}]'::jsonb,
    price_range = '안치실 12만원'
WHERE id = '8435275';

-- 맑은샘병원장례식장 (맑은샘병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '안치실 10만원'
WHERE id = '22537416';

-- 순천향대학교부천병원 장례식장 (순천향장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"VIP분향소 빈소.접객실 사용료","detail":"1일 기준","price":800000,"priceDisplay":"80만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"2분향소 빈소.접객실 사용료","detail":"1일 기준","price":400000,"priceDisplay":"40만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특분향소 빈소.접객실 사용료","detail":"1일 기준","price":700000,"priceDisplay":"70만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"3분향소 빈소.접객실 사용료","detail":"1일 기준","price":200000,"priceDisplay":"20만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"1분향소 빈소.접객실 사용료","detail":"1일 기준","price":500000,"priceDisplay":"50만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일 기준","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 20~80만원 / 안치실 10만원'
WHERE id = '8436907';

-- 괴정병원장례식장 (괴정병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"특실분향소 임대료","detail":"1일(12시간이상)","price":820000,"priceDisplay":"82만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"일반실분향소 202호 임대료","detail":"1실(12시간이상)","price":480000,"priceDisplay":"48만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"일반실분향소 201호 임대료","detail":"1실(12시간이상)","price":530000,"priceDisplay":"53만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실 임대료","detail":"1실1일기준","price":150000,"priceDisplay":"15만원"}]'::jsonb,
    price_range = '빈소 48~82만원 / 안치실 15만원'
WHERE id = '16666435';

-- 다사랑중앙병원 장례식장 (다사랑중앙병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"안치실","price":5000,"priceDisplay":"5,000원"}]'::jsonb,
    price_range = '안치실 1만원'
WHERE id = '488200260';

-- 삼성서울병원장례식장 (삼성서울병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료(213.6㎡)A형","detail":"1실/24시간 기준","price":1632000,"priceDisplay":"163만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료(270.6㎡)","detail":"1실/24시간 기준","price":2112000,"priceDisplay":"211만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료(562.0㎡)","detail":"1실/24시간 기준","price":4500000,"priceDisplay":"450만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료(213.6㎡)B형","detail":"1실/24시간 기준","price":1728000,"priceDisplay":"173만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료(119.0㎡)","detail":"1실/24시간 기준","price":720000,"priceDisplay":"72만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료(196.8㎡)","detail":"1실/24시간 기준","price":1512000,"priceDisplay":"151만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1실/24시간 기준","price":96000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 72~450만원 / 안치실 10만원'
WHERE id = '17573849';

-- 함안하늘공원장례식장 (하늘공원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소접객실","detail":"1일","price":480000,"priceDisplay":"48만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1일","price":72000,"priceDisplay":"7만원"}]'::jsonb,
    price_range = '빈소 48만원 / 안치실 7만원'
WHERE id = '161303743';

-- 영천영락원장례식장 (영천영락원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"고인안치(일)","price":60000,"priceDisplay":"6만원"}]'::jsonb,
    price_range = '안치실 6만원'
WHERE id = '279855844';

-- 수성연도실 (수성연도실)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"연도실 사용료","detail":"1일","price":432000,"priceDisplay":"43만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실 사용료","detail":"1일","price":72000,"priceDisplay":"7만원"}]'::jsonb,
    price_range = '빈소 43만원 / 안치실 7만원'
WHERE id = '145';

-- 송도하나장례문화원 (송도하나장례문화원)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일","price":120000,"priceDisplay":"12만원"}]'::jsonb,
    price_range = '안치실 12만원'
WHERE id = '155';

-- 녹색병원 장례식장 (면목녹색병원 장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"1.2.3.5호","detail":"1시간","price":40000,"priceDisplay":"4만원"},{"category":"안치실이용료","subCategory":"일반","name":"","detail":"24시간","price":240000,"priceDisplay":"24만원"}]'::jsonb,
    price_range = '빈소 4만원 / 안치실 24만원'
WHERE id = '16068131';

-- 용인평온의숲 장례식장 (용인 평온의 숲장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료시간당 4170원","detail":"1일  /(관외) 관내의배","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '안치실 10만원'
WHERE id = '26446776';

-- 원자력병원장례식장 (원자력병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료","detail":"196.10㎡/ 24시간 사용","price":960000,"priceDisplay":"96만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료","detail":"231.20㎡/24시간 사용","price":1080000,"priceDisplay":"108만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료","detail":"121.61㎡/24시간 사용","price":552000,"priceDisplay":"55만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료","detail":"안치료/24시간 사용","price":72000,"priceDisplay":"7만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료","detail":"187.57/24시간 사용","price":912000,"priceDisplay":"91만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료","detail":"137.68㎡/24시간 사용","price":696000,"priceDisplay":"70만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료","detail":"123.61㎡/24시간 사용","price":648000,"priceDisplay":"65만원"}]'::jsonb,
    price_range = '빈소 7~108만원'
WHERE id = '17093539';

-- 언양병원장례식장 (언양병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실 사용료","detail":"1일","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '안치실 10만원'
WHERE id = '11319507';

-- 대구전문장례식장 (대구전문장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일/24시간기준","price":72000,"priceDisplay":"7만원"}]'::jsonb,
    price_range = '안치실 7만원'
WHERE id = '14650899';

-- 만평장례식장 (만평장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향접객실 사용료 (B103)","detail":"1일/ 약 100명 수용","price":1000000,"priceDisplay":"100만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향접객실 사용료 (101)","detail":"1일/ 약 250명 수용","price":1900000,"priceDisplay":"190만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향접객실 사용료 (302)","detail":"1일/ 약 180명 수용","price":1500000,"priceDisplay":"150만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향접객실 사용료 (202)","detail":"1일/ 약 180명 수용","price":1500000,"priceDisplay":"150만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향접객실 사용료 (301)","detail":"1일/ 약 130명 수용","price":1500000,"priceDisplay":"150만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향접객실 사용료 (201)","detail":"1일/ 약 250명 수용","price":1900000,"priceDisplay":"190만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향접객실 사용료 (303)","detail":"1일/ 약 120명 수용","price":1500000,"priceDisplay":"150만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향 접객실 사용료(102)","detail":"1일/약 80명 수용","price":800000,"priceDisplay":"80만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일 기준","price":150000,"priceDisplay":"15만원"}]'::jsonb,
    price_range = '빈소 80~190만원 / 안치실 15만원'
WHERE id = '19772584';

-- 울산중앙병원 장례식장 (중앙병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장(임대료)","detail":"1실 (24시간기준)","price":450000,"priceDisplay":"45만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실사용료","detail":"1회","price":300000,"priceDisplay":"30만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료(임대료)","detail":"1실 (24시간기준)","price":70000,"priceDisplay":"7만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"사용료 1일/24시간기준","price":120000,"priceDisplay":"12만원"},{"category":"안치실이용료","subCategory":"","name":"안치료","detail":"시간당","price":3000,"priceDisplay":"3,000원"}]'::jsonb,
    price_range = '빈소 45만원 / 안치실 0만원'
WHERE id = '14676040';

-- (주)안면도장례식장 ((주)안면도장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"VIP실","detail":"320 m2  (97평형)(1시간당)","price":20000,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"귀빈실","detail":"264 m2 (80평형)(1시간당)","price":20000,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특1호실","detail":"264 m2 (80평형)(1시간당)","price":15000,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특2호실","detail":"280 m2 (85평형)(1시간당)","price":15000,"priceDisplay":"2만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"안치부터 발인까지 1시간당","price":3000,"priceDisplay":"3,000원"}]'::jsonb,
    price_range = '빈소 2~2만원 / 안치실 0만원'
WHERE id = '27379964';

-- 영양전문장례식장 (영양전문장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실사용료","detail":"1실24시간기준","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '안치실 10만원'
WHERE id = '11791404';

-- 영광농협장례식장 (영광농협장례식장(영광낙원장례식장))
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일","price":60000,"priceDisplay":"6만원"}]'::jsonb,
    price_range = '안치실 6만원'
WHERE id = '18260492';

-- 강원대학교병원장례식장 (강원대학교병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"사용료5호실","detail":"109㎡ 빈소 가족실 접객실 시간당","price":10000,"priceDisplay":"1만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"사용료2호실","detail":"286㎡ 빈소 가족실 접객실 접견실 시간당","price":35000,"priceDisplay":"4만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"사용료3호실","detail":"149㎡ 빈소 가족실 접객실 접견실 시간당","price":18000,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"사용료7호실","detail":"109㎡ 빈소 가족실 접객실 시간당","price":10000,"priceDisplay":"1만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"사용료6호실","detail":"109㎡ 빈소 가족실 접객실 접견실 시간당","price":12000,"priceDisplay":"1만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"사용료1호실","detail":"232 ㎡ 빈소 가족실 접객실 시간당","price":25000,"priceDisplay":"3만원"},{"category":"안치실이용료","subCategory":"일반","name":"사용료안치료","detail":"1시간","price":2000,"priceDisplay":"2,000원"}]'::jsonb,
    price_range = '빈소 1~4만원 / 안치실 0만원'
WHERE id = '17572052';

-- 메리놀병원장례식장 (메리놀병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치 냉장실","detail":"안치료","price":150000,"priceDisplay":"15만원"}]'::jsonb,
    price_range = '안치실 15만원'
WHERE id = '17578470';

-- 중앙요양병원 장례식장 (나주중앙요양병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"접객실","name":"접객실","detail":"1일","price":400000,"priceDisplay":"40만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 40만원 / 안치실 10만원'
WHERE id = '1225280704';

-- 청십자병원장례식장 (청십자병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일비용","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '안치실 10만원'
WHERE id = '14650837';

-- 부산대학교병원장례식장 (부산대학교병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"특1호실","detail":"114.66㎡ / 12시간 기준 /시간당 30000","price":350000,"priceDisplay":"35만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"5호실","detail":"86.30㎡ / 12시간 기준 /시간당 20000","price":234000,"priceDisplay":"23만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"2호실","detail":"83.97㎡ / 12시간 기준 /시간당 17000","price":200000,"priceDisplay":"20만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"3호실","detail":"93.21㎡ / 12시간 기준 /시간당 21000","price":252000,"priceDisplay":"25만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료(일반)","detail":"1일(12시간 이상 24간 미만 적용) / 시간당 4800","price":98600,"priceDisplay":"10만원"},{"category":"안치실이용료","subCategory":"기타","name":"안치료(수급자)","detail":"3일 무료 / 이후 1일당 3750","price":3750,"priceDisplay":"3,750원"}]'::jsonb,
    price_range = '빈소 20~35만원 / 안치실 0만원'
WHERE id = '9043159';

-- 영덕아산병원 장례식장 (영덕아산병원)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소사용료(특1호)","detail":"40평형(빈소접객실상주휴게실)","price":384000,"priceDisplay":"38만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소사용료(특23호)","detail":"50평형(빈소접객실상주휴게실)","price":480000,"priceDisplay":"48만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"","price":96000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 38~48만원 / 안치실 10만원'
WHERE id = '2072153038';

-- 새로운장례식장 (새로운장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소+접객실","detail":"50평형(202호302호)/1일기준","price":480000,"priceDisplay":"48만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소+접객실","detail":"80평형(지층특실)/1일기준","price":720000,"priceDisplay":"72만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소+접객실","detail":"55평형(101호)/1일기준","price":520000,"priceDisplay":"52만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소+접객실","detail":"65평형(201호301호)/1일기준","price":660000,"priceDisplay":"66만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일기준","price":60000,"priceDisplay":"6만원"}]'::jsonb,
    price_range = '빈소 48~72만원 / 안치실 6만원'
WHERE id = '16914695';

-- 삼천포서울병원장례식장 (삼천포서울병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실사용료","detail":"1일","price":96000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '안치실 10만원'
WHERE id = '23375451';

-- 노원을지대학교병원장례식장 (노원을지대학교병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장임대료(5호)","detail":"1실/24시간기준(139㎡)B2F","price":720000,"priceDisplay":"72만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장임대료(10호)","detail":"1실/24시간기준(116㎡)B3F","price":480000,"priceDisplay":"48만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장임대료(6호)","detail":"1실/24시간기준(149㎡)B2F","price":960000,"priceDisplay":"96만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장임대료(9호)","detail":"1실/24시간기준(149㎡)B3F","price":696000,"priceDisplay":"70만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장임대료(2호)","detail":"1실/24시간기준(238㎡)B2F","price":1320000,"priceDisplay":"132만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장임대료(1호)","detail":"1실/24시간기준(324㎡)B2F","price":1560000,"priceDisplay":"156만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장임대료(378호)","detail":"1실/24시간기준(149㎡)B2F","price":888000,"priceDisplay":"89만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1실/24시간기준","price":84000,"priceDisplay":"8만원"}]'::jsonb,
    price_range = '빈소 48~156만원 / 안치실 8만원'
WHERE id = '10667300';

-- 경희병원장례식장 (경희병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"2빈소사용료","detail":"분양실1일접객실1일","price":700000,"priceDisplay":"70만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"1빈소사용료","detail":"분향실1일접객실1실","price":700000,"priceDisplay":"70만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일","price":150000,"priceDisplay":"15만원"}]'::jsonb,
    price_range = '빈소 70만원 / 안치실 15만원'
WHERE id = '16520007';

-- 창원시립상복공원장례식장 (창원시립상복공원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소 및 접객실(12호실)","detail":"33평/40명(1일) 관외기준/12시간미만은0.5일","price":272500,"priceDisplay":"27만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소 및 접객실(12호실)","detail":"33평/40명(1일) 관내기준/12시간미만은0.5일","price":196200,"priceDisplay":"20만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소 및 접객실(910호실)","detail":"50평/70명(1일) 관외기준/12시간미만은0.5일","price":407500,"priceDisplay":"41만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소 및 접객실(910호실)","detail":"50평/70명(1일) 관내기준/12시간미만은0.5일","price":293400,"priceDisplay":"29만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소 및 접객실(8호실)","detail":"68평/90명(1일) 관외기준/12시간미만은0.5일","price":562500,"priceDisplay":"56만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소 및 접객실(8호실)","detail":"68평/90명(1일) 관내기준/12시간미만은0.5일","price":405000,"priceDisplay":"41만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소 및 접객실(67호실)","detail":"34평/40명(1일) 관외기준/12시간미만은0.5일","price":280000,"priceDisplay":"28만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소 및 접객실(67호실)","detail":"34평/40명(1일) 관내기준/12시간미만은0.5일","price":201600,"priceDisplay":"20만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소 및 접객실(5호실)","detail":"70평/90명(1일) 관외기준/12시간미만은0.5일","price":572500,"priceDisplay":"57만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소 및 접객실(5호실)","detail":"70평/90명(1일) 관내기준/12시간미만은0.5일","price":412200,"priceDisplay":"41만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소 및 접객실(4호실)","detail":"35평/40명(1일) 관외기준/12시간미만은0.5일","price":287500,"priceDisplay":"29만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소 및 접객실(4호실)","detail":"35평/40명(1일) 관내기준/12시간미만은0.5일","price":207000,"priceDisplay":"21만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소 및 접객실(3호실)","detail":"67평/90명(1일) 관외기준/12시간미만은0.5일","price":550000,"priceDisplay":"55만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소 및 접객실(3호실)","detail":"67평/90명(1일) 관내기준/12시간미만은0.5일","price":396000,"priceDisplay":"40만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1구(1일) 관내기준","price":40000,"priceDisplay":"4만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1구(1일) 관외기준","price":70000,"priceDisplay":"7만원"}]'::jsonb,
    price_range = '빈소 20~57만원 / 안치실 4만원'
WHERE id = '26447222';

-- 청주시장례식장 (청주시장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실 (1일)","detail":"청주","price":30000,"priceDisplay":"3만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실 (1일)","detail":"관외","price":50000,"priceDisplay":"5만원"}]'::jsonb,
    price_range = '안치실 3만원'
WHERE id = '25083601';

-- 중앙U병원장례식장 (중앙U병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1실 24시간 기준","price":150000,"priceDisplay":"15만원"}]'::jsonb,
    price_range = '안치실 15만원'
WHERE id = '10088915';

-- 의성제일병원 장례식장 (의성제일장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"시신안치실","detail":"시간당 4000원","price":96000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '안치실 10만원'
WHERE id = '836888606';

-- 아산충무병원 국화원 (아산충무병원 국화원)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소/접객실","detail":"1호 2호실 3호실(시간당)","price":30000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소/접객실","detail":"특실(시간당)","price":35000,"priceDisplay":"4만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1시간","price":7000,"priceDisplay":"7,000원"}]'::jsonb,
    price_range = '빈소 3~4만원 / 안치실 1만원'
WHERE id = '416906628';

-- 경북도립노인전문요양병원 장례식장 (문요양병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"특1호실 약115평","detail":"분향실접객실상주전용(휴게실샤워실화장실)주방","price":900000,"priceDisplay":"90만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특2호실 약75평","detail":"분향실접객실상주전용(휴게실샤워실화장실)주방","price":700000,"priceDisplay":"70만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"3호실 약45평","detail":"분향실접객실상주전용(휴게실샤워실화장실)주방","price":540000,"priceDisplay":"54만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실 1일","detail":"안치료","price":90000,"priceDisplay":"9만원"}]'::jsonb,
    price_range = '빈소 54~90만원 / 안치실 9만원'
WHERE id = '468526445';

-- 국제성모병원 장례식장 (국제성모장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소사용료(m²)","detail":"280","price":1200000,"priceDisplay":"120만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소사용료(m²)","detail":"132","price":552000,"priceDisplay":"55만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소사용료(m²)","detail":"247","price":1080000,"priceDisplay":"108만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소사용료(m²)","detail":"495","price":2280000,"priceDisplay":"228만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소사용료(m²)","detail":"760","price":3624000,"priceDisplay":"362만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소사용료(m²)","detail":"330","price":1512000,"priceDisplay":"151만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소사용료(m²)","detail":"231","price":960000,"priceDisplay":"96만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소사용료(m²)","detail":"198","price":792000,"priceDisplay":"79만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실 임대료","detail":"안치료","price":120000,"priceDisplay":"12만원"}]'::jsonb,
    price_range = '빈소 55~362만원 / 안치실 12만원'
WHERE id = '27126806';

-- 서해장례문화원 (서해장례문화원)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"특1호실","detail":"60평1시간","price":30000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특2호실","detail":"100평1시간","price":35000,"priceDisplay":"4만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특3호실","detail":"100평1시간","price":35000,"priceDisplay":"4만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실 냉장고","detail":"안치후발인까지","price":270000,"priceDisplay":"27만원"}]'::jsonb,
    price_range = '빈소 3~4만원 / 안치실 27만원'
WHERE id = '179';

-- 원광종합병원 장례식장 (원광종합병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"3호실","detail":"1실 24시간 기준.60평","price":480000,"priceDisplay":"48만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"2호실","detail":"1실 24시간 기준.80평","price":720000,"priceDisplay":"72만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"1호실","detail":"1실 24시간 기준.110평","price":840000,"priceDisplay":"84만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특실","detail":"1실 24시간 기준.150평","price":960000,"priceDisplay":"96만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"VIP실","detail":"1실 24시간 기준.160평","price":1200000,"priceDisplay":"120만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일.24시간기준","price":120000,"priceDisplay":"12만원"}]'::jsonb,
    price_range = '빈소 48~120만원 / 안치실 12만원'
WHERE id = '848221651';

-- 영암농협장례식장 (영암농협장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1일","price":80000,"priceDisplay":"8만원"}]'::jsonb,
    price_range = '안치실 8만원'
WHERE id = '1758140490';

-- 강산병원장례식장 (강산병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소임대료","detail":"특실 1일 사용료","price":600000,"priceDisplay":"60만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소임대료","detail":"12호실","price":350000,"priceDisplay":"35만원"},{"category":"안치실이용료","subCategory":"일반","name":"고인 안치료","detail":"1일","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 35~60만원 / 안치실 10만원'
WHERE id = '14650792';

-- 메디힐병원장례식장 (메디힐병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실 사용료","detail":"1일사용료(24시간기준)","price":84000,"priceDisplay":"8만원"}]'::jsonb,
    price_range = '안치실 8만원'
WHERE id = '8159664';

-- 새천년장례식장 (새천년장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실(201호 301호)","detail":"98평형   24시간","price":1512000,"priceDisplay":"151만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실(202호 302호)","detail":"36평형  24시간","price":672000,"priceDisplay":"67만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실(203호 303호)","detail":"52평형   24시간","price":984000,"priceDisplay":"98만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일 단위 (시간당 7000)","price":168000,"priceDisplay":"17만원"}]'::jsonb,
    price_range = '빈소 67~151만원 / 안치실 17만원'
WHERE id = '7929699';

-- 인천연세병원장례식장 (연세병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"1호실","detail":"70평형","price":840000,"priceDisplay":"84만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"2호실","detail":"50평형","price":720000,"priceDisplay":"72만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"시간당","price":4000,"priceDisplay":"4,000원"}]'::jsonb,
    price_range = '빈소 72~84만원 / 안치실 0만원'
WHERE id = '14076672';

-- 세광병원장례식장 (세광병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소 및 접객실 사용료","detail":"특실 (3일중 1일적용)","price":600000,"priceDisplay":"60만원"}]'::jsonb,
    price_range = '빈소 60만원'
WHERE id = '7954848';

-- S병원 장례식장 (DS병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1실/24시간 기준","price":108000,"priceDisplay":"11만원"}]'::jsonb,
    price_range = '안치실 11만원'
WHERE id = '11318030';

-- (주)구례장례식장 ((주)구례장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실사용료","detail":"1일 80000원 / 시간당 3300원","price":80000,"priceDisplay":"8만원"}]'::jsonb,
    price_range = '안치실 8만원'
WHERE id = '189';

-- 옥곡장례식장 (옥곡장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"객실및분향소  일반실","detail":"1시간","price":52000,"priceDisplay":"5만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"객실및분향소  특실","detail":"1시간","price":67000,"priceDisplay":"7만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1시간","price":8000,"priceDisplay":"8,000원"}]'::jsonb,
    price_range = '빈소 5~7만원 / 안치실 1만원'
WHERE id = '191';

-- 삼목장례프리드 (삼목장례프리드)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"101호기준","detail":"2박3일기준","price":1000000,"priceDisplay":"100만원"},{"category":"안치실이용료","subCategory":"일반","name":"영안실 사용료","detail":"2박3일기준","price":200000,"priceDisplay":"20만원"}]'::jsonb,
    price_range = '빈소 100만원 / 안치실 20만원'
WHERE id = '193';

-- 해남군산림조합장례식장 (해남군 산림조합장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"접객실","name":"접객실 2호3호(3일장)","detail":"60평","price":500000,"priceDisplay":"50만원"},{"category":"시설임대료","subCategory":"접객실","name":"접객실1호(3일장)","detail":"80평","price":700000,"priceDisplay":"70만원"},{"category":"시설임대료","subCategory":"접객실","name":"별관 VIP실(3일장)","detail":"120평","price":1500000,"priceDisplay":"150만원"}]'::jsonb,
    price_range = '빈소 50~150만원'
WHERE id = '194';

-- 국화원장례식장 ((주)울산국화원장례식장 북울산지점)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소/접객실 [VIP2] 125평/100석","detail":"1일 / 24시간","price":960000,"priceDisplay":"96만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소/접객실 [특실] 85평/30석","detail":"1일 / 24시간","price":750000,"priceDisplay":"75만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소/접객실 [VIP1] 125평/100석","detail":"1일 / 24시간","price":960000,"priceDisplay":"96만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1일 / 24시간","price":120000,"priceDisplay":"12만원"}]'::jsonb,
    price_range = '빈소 75~96만원 / 안치실 12만원'
WHERE id = '16279924';

-- 옥천농협장례식장 (옥천농협장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"","name":"안치실사용료","detail":"1일","price":60000,"priceDisplay":"6만원"}]'::jsonb,
    price_range = '안치실 6만원'
WHERE id = '8020005';

-- 계명대학교대구동산병원장례식장 (계명대학교대구동산병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"101호","detail":"1일 (시간28.750/1시간)","price":690000,"priceDisplay":"69만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"201호","detail":"1일 (시간26.000/1시간)","price":624000,"priceDisplay":"62만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"203호","detail":"1일 (시간16.000/1시간)","price":384000,"priceDisplay":"38만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"202호","detail":"1일 (시간16.000/1시간)","price":384000,"priceDisplay":"38만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"102호","detail":"1일 (시간23.000/1시간)","price":552000,"priceDisplay":"55만원"}]'::jsonb,
    price_range = '빈소 38~69만원'
WHERE id = '25083503';

-- 황산장례문화원 (황산장례문화원)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료(특)","detail":"1실/24시간 기준","price":800000,"priceDisplay":"80만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료(일반)","detail":"1실/24시간 기준","price":600000,"priceDisplay":"60만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료(지하)","detail":"1실/24시간 기준","price":250000,"priceDisplay":"25만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실사용료","detail":"1일당","price":50000,"priceDisplay":"5만원"},{"category":"안치실이용료","subCategory":"일반","name":"시설사용료(안치료)","detail":"1일당","price":50000,"priceDisplay":"5만원"}]'::jsonb,
    price_range = '빈소 5~80만원 / 안치실 5만원'
WHERE id = '209';

-- 부림요양병원장례식장 (부림요양병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1시간","price":4000,"priceDisplay":"4,000원"}]'::jsonb,
    price_range = '안치실 0만원'
WHERE id = '2066571776';

-- (유)성인천장례식장 ((유)성인천장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1일","price":150000,"priceDisplay":"15만원"}]'::jsonb,
    price_range = '안치실 15만원'
WHERE id = '9136576';

-- 한마음병원장례식장 (창원한마음병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"2호(85평72석)유족대기실1개","detail":"280.991736m2","price":650000,"priceDisplay":"65만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특실(150평108석)응접실1유족대기실2개","detail":"495.867769m2","price":1300000,"priceDisplay":"130만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"3호(60평52석)유족대기실1개","detail":"198.347107m2","price":400000,"priceDisplay":"40만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"4호(60평48석)유족대기실1개","detail":"198.347107m2","price":400000,"priceDisplay":"40만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"VIP(250평220석)응접실1유족대기실2개","detail":"826.446281m2","price":1800000,"priceDisplay":"180만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"1호(90평84석)유족대기실1개","detail":"297.520661m2","price":700000,"priceDisplay":"70만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1일 시간요금 4000원","price":96000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 40~180만원 / 안치실 10만원'
WHERE id = '9577059';

-- 한성병원 장례예식장 (한성병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실 사용료(7층 특분향실)","detail":"약60평(25000원/시간)","price":600000,"priceDisplay":"60만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실 사용료(8층VIP분향실)","detail":"약100평(37500원/시간)","price":900000,"priceDisplay":"90만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실 사용료(9층VIP분향실)","detail":"약100평(37500원/시간)","price":900000,"priceDisplay":"90만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치기 사용료(관외외국인*2배)","detail":"1일","price":50000,"priceDisplay":"5만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실 사용료","detail":"일","price":96000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 60~90만원 / 안치실 5만원'
WHERE id = '11588210';

-- 호남장례식장 (호남장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"시간/안치료","detail":"1일/시간","price":6000,"priceDisplay":"6,000원"}]'::jsonb,
    price_range = '안치실 1만원'
WHERE id = '17189983';

-- 강남요양병원 장례식장 (여수강남요양병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실 특실","detail":"시간당 (분향실접객실유족실샤워실등)","price":47000,"priceDisplay":"5만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실 VIP","detail":"시간당(분향실접객실유족실샤워실등)","price":69000,"priceDisplay":"7만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"시간당","price":7000,"priceDisplay":"7,000원"}]'::jsonb,
    price_range = '빈소 5~7만원 / 안치실 1만원'
WHERE id = '609053243';

-- 성심요양병원장례식장 (성심요양병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실사용료","detail":"시간당(4.000원)","price":96000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '안치실 10만원'
WHERE id = '16579862';

-- 대구기독병원장례식장 (대구기독병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실 사용료","detail":"특 1호실","price":816000,"priceDisplay":"82만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실 사용료","detail":"2호실","price":528000,"priceDisplay":"53만원"}]'::jsonb,
    price_range = '빈소 53~82만원'
WHERE id = '19711054';

-- 대구요양병원장례식장 (대구요양병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"","name":"안치료","detail":"6.6","price":96000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '안치실 10만원'
WHERE id = '1761476330';

-- 대송장례식장 (대송장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 빈소 임대료(vip룸)","detail":"1실/1일","price":900000,"priceDisplay":"90만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 빈소 임대료(특1호)","detail":"1실/1일","price":900000,"priceDisplay":"90만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 빈소 임대료(2호)","detail":"1실/1일","price":700000,"priceDisplay":"70만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 빈소 임대료(5호)","detail":"1실/1일","price":500000,"priceDisplay":"50만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 빈소 임대료(특6호)","detail":"1실/1일","price":800000,"priceDisplay":"80만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 50~90만원 / 안치실 10만원'
WHERE id = '10245652';

-- 첨단요양병원장례식장 (첨단요양병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"24시간 기준 1시간 4000원","price":96000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '안치실 10만원'
WHERE id = '744441946';

-- 에스중앙병원 장례식장 (중앙병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장(임대료)","detail":"1실 (24시간기준)","price":450000,"priceDisplay":"45만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실사용료","detail":"1회","price":300000,"priceDisplay":"30만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료(임대료)","detail":"1실 (24시간기준)","price":70000,"priceDisplay":"7만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"사용료 1일/24시간기준","price":120000,"priceDisplay":"12만원"},{"category":"안치실이용료","subCategory":"","name":"안치료","detail":"시간당","price":3000,"priceDisplay":"3,000원"}]'::jsonb,
    price_range = '빈소 45만원 / 안치실 0만원'
WHERE id = '19355717';

-- 경기도의료원 수원병원 장례식장 (경기도의료원 수원병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실사용료","detail":"1일","price":72000,"priceDisplay":"7만원"}]'::jsonb,
    price_range = '안치실 7만원'
WHERE id = '11956649';

-- 경주하늘마루장례식장 (경주하늘마루장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실사용료","detail":"1일(24시간)","price":80000,"priceDisplay":"8만원"}]'::jsonb,
    price_range = '안치실 8만원'
WHERE id = '25083821';

-- 창원한마음병원장례식장 (창원한마음병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"2호(85평72석)유족대기실1개","detail":"280.991736m2","price":650000,"priceDisplay":"65만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특실(150평108석)응접실1유족대기실2개","detail":"495.867769m2","price":1300000,"priceDisplay":"130만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"3호(60평52석)유족대기실1개","detail":"198.347107m2","price":400000,"priceDisplay":"40만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"4호(60평48석)유족대기실1개","detail":"198.347107m2","price":400000,"priceDisplay":"40만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"VIP(250평220석)응접실1유족대기실2개","detail":"826.446281m2","price":1800000,"priceDisplay":"180만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"1호(90평84석)유족대기실1개","detail":"297.520661m2","price":700000,"priceDisplay":"70만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1일 시간요금 4000원","price":96000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 40~180만원 / 안치실 10만원'
WHERE id = '272618285';

-- 구미푸른요양병원장례식장 (구미푸른요양병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"특실","detail":"약 50평","price":672000,"priceDisplay":"67만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"1호실","detail":"약 30평","price":528000,"priceDisplay":"53만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"VIP 실","detail":"약 70평","price":840000,"priceDisplay":"84만원"},{"category":"안치실이용료","subCategory":"일반","name":"고인 안치료","detail":"1일","price":96000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 53~84만원 / 안치실 10만원'
WHERE id = '1112100387';

-- 화천군공설장례식장 (화천군공설장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소/접객실","detail":"사용료-관내(시간당)","price":2083,"priceDisplay":"2,083원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소/접객실","detail":"사용료-관외(시간당)","price":4166,"priceDisplay":"4,166원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"사용료-관외(시간당)","price":4166,"priceDisplay":"4,166원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"사용료-관내(시간당)","price":2083,"priceDisplay":"2,083원"}]'::jsonb,
    price_range = '빈소 0~0만원 / 안치실 0만원'
WHERE id = '11560375';

-- 국화원전문장례식장 (선산 국화원 전문 장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"준특실 (60평)","detail":"198㎡","price":660000,"priceDisplay":"66만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"vip실 (150평)","detail":"495㎡","price":1104000,"priceDisplay":"110만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특실 ( 100평)","detail":"330㎡","price":816000,"priceDisplay":"82만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"일반실 (45평)","detail":"148㎡","price":504000,"priceDisplay":"50만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일","price":96000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 50~110만원 / 안치실 10만원'
WHERE id = '994063643';

-- 탄금장례식장 (탄금장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일기준`","price":84000,"priceDisplay":"8만원"}]'::jsonb,
    price_range = '안치실 8만원'
WHERE id = '755865403';

-- 성가롤로병원장례식장 (성가롤로병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실접객실사용료(VIP실)","detail":"145평형(시간)","price":41667,"priceDisplay":"4만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실접객실사용료(156호실)","detail":"80평형(시간)","price":25000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실접객실사용료(3호실)","detail":"50평형(시간)","price":14533,"priceDisplay":"1만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실접객실사용료(2호특실)","detail":"130평형(시간)","price":37500,"priceDisplay":"4만원"},{"category":"안치실이용료","subCategory":"일반","name":"고인 안치실","detail":"1일당","price":70000,"priceDisplay":"7만원"}]'::jsonb,
    price_range = '빈소 1~4만원 / 안치실 7만원'
WHERE id = '9170852';

-- 경기도의료원 안성병원 장례식장 (경기도의료원 안성병원장례식장(휴업))
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"3분향실(대실)","detail":"사용료(1시간당)78평","price":27000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"12분향실(특실)","detail":"사용료(1시간당)100평","price":30000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"8분향실(소형)","detail":"사용료(1시간당)28평","price":15000,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"567분향실(일반실)","detail":"사용료(1시간당)58평","price":25000,"priceDisplay":"3만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"안치료(1시간당)","price":3000,"priceDisplay":"3,000원"}]'::jsonb,
    price_range = '빈소 2~3만원 / 안치실 0만원'
WHERE id = '7817465';

-- 고성제일요양병원장례식장 (고성제일요양병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"특   실   2   호","detail":"1시간 29167원 205m2","price":700000,"priceDisplay":"70만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"VIP호실","detail":"1시간 41250원 330m2","price":990000,"priceDisplay":"99만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특    실  1  호","detail":"1시간 3666원 280m2","price":880000,"priceDisplay":"88만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일","price":80000,"priceDisplay":"8만원"}]'::jsonb,
    price_range = '빈소 70~99만원 / 안치실 8만원'
WHERE id = '1970146127';

-- (주)장례식장아시아드 ((주)장례식장아시아드)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"5층 1호실    ( 75평형)","detail":"분향실 접객실 상주방 샤워실 화장실","price":600000,"priceDisplay":"60만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"3층 VIP호실 (140평형)","detail":"분향실 접객실 귀빈실 상주방 샤워실 화장실","price":1190000,"priceDisplay":"119만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"6층 2호실    ( 65평형)","detail":"분향실 접객실 상주방 샤워실 화장실","price":450000,"priceDisplay":"45만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"2층 VIP호실 (140평형)","detail":"분향실 접객실 귀빈실 상주방 샤워실 화장실","price":1190000,"priceDisplay":"119만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"5층 2호실    ( 65평형)","detail":"분향실 접객실 상주방 샤워실 화장실","price":450000,"priceDisplay":"45만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"6층 1호실    ( 75평형)","detail":"분향실 접객실 상주방 샤워실 화장실","price":600000,"priceDisplay":"60만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"7층 1호실    ( 65평형)","detail":"분향실 접객실 상주방 샤워실 화장실","price":450000,"priceDisplay":"45만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1일 기준","price":150000,"priceDisplay":"15만원"}]'::jsonb,
    price_range = '빈소 45~119만원 / 안치실 15만원'
WHERE id = '25485582';

-- 의왕시티병원 장례식장 (시티병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"특  실 (시간당 45000원)","detail":"80평/1일/접객실분향실상주휴게실 포함","price":1080000,"priceDisplay":"108만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"2호실 (시간당 25000원)","detail":"38평/1일/접객실분향실상주휴게실 포함","price":600000,"priceDisplay":"60만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"1호실 (시간당 35000원)","detail":"60평/1일/접객실분향실상주휴게실 포함","price":840000,"priceDisplay":"84만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료 1일 (24시간)","detail":"1시간 5000원","price":120000,"priceDisplay":"12만원"}]'::jsonb,
    price_range = '빈소 60~108만원 / 안치실 12만원'
WHERE id = '19364863';

-- 분당제생병원 장례식장 (분당제생병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1시간","price":3500,"priceDisplay":"3,500원"}]'::jsonb,
    price_range = '안치실 0만원'
WHERE id = '9983325';

-- 세민병원장례식장 (세민병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"일반 분향실","detail":"1일","price":552000,"priceDisplay":"55만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특 분향실","detail":"1일","price":792000,"priceDisplay":"79만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일/24시간 기준","price":100000,"priceDisplay":"10만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1일","price":96000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 55~79만원 / 안치실 10만원'
WHERE id = '14650839';

-- 시영의료재단 영동병원장례식장 (시영의료재단 영동병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1일기준","price":60000,"priceDisplay":"6만원"}]'::jsonb,
    price_range = '안치실 6만원'
WHERE id = '174';

-- 공생병원장례식장 (공생병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"접객실","detail":"480000/30000(40평)","price":480000,"priceDisplay":"48만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실","detail":"150000/10000(12평)","price":150000,"priceDisplay":"15만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1실","price":200000,"priceDisplay":"20만원"}]'::jsonb,
    price_range = '빈소 15~48만원 / 안치실 20만원'
WHERE id = '8203866';

-- 전주시민장례문화원 ((주)시민장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1일","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '안치실 10만원'
WHERE id = '204';

-- 영주자인병원 장례식장 (자인병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소및접객실임대료","detail":"1일기준","price":500000,"priceDisplay":"50만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실이용료","detail":"1일기준","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 50만원 / 안치실 10만원'
WHERE id = '20507820';

-- 새금산병원장례식장 (새금산병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"접객실","name":"특1호실-접객실","detail":"168 ㎡ 시간당","price":28000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"접객실","name":"일반실(34호실)-접객실","detail":"96 ㎡ 시간당","price":23000,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"접객실","name":"특2호실-접객실","detail":"144 ㎡ 시간당","price":26000,"priceDisplay":"3만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"시간당","price":3000,"priceDisplay":"3,000원"}]'::jsonb,
    price_range = '빈소 2~3만원 / 안치실 0만원'
WHERE id = '10510640';

-- 안덕장례식장 (안덕장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일","price":50000,"priceDisplay":"5만원"}]'::jsonb,
    price_range = '안치실 5만원'
WHERE id = '18353626';

-- 울릉군보건의료원장례식장 (울릉군보건의료원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일 (1시간당 1000원)","price":24000,"priceDisplay":"2만원"}]'::jsonb,
    price_range = '안치실 2만원'
WHERE id = '25415613';

-- 강진군산림조합추모관장례식장 (강진군산림조합추모관장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"안치료(1일기준)","price":50000,"priceDisplay":"5만원"}]'::jsonb,
    price_range = '안치실 5만원'
WHERE id = '187';

-- 서울특별시보라매병원장례식장 (서울특별시보라매병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소/접객실/휴게실","detail":"1호실(163㎡)","price":737800,"priceDisplay":"74만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소/접객실/휴게실","detail":"5~8호실(162㎡)","price":691300,"priceDisplay":"69만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소/접객실/휴게실","detail":"2~4호실(189㎡)","price":808000,"priceDisplay":"81만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"서울특별시 조례(수가적용)","price":95370,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 69~81만원 / 안치실 10만원'
WHERE id = '14629909';

-- 연세에스병원장례식장 (에스병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료(전체)","detail":"1일 24시간 기준","price":1100000,"priceDisplay":"110만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료(각)","detail":"11일 24시간 기준(장애인수급자 국가유공자 30","price":672000,"priceDisplay":"67만원"},{"category":"안치실이용료","subCategory":"기타","name":"안치실","detail":"1일 24시간 기준","price":96000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 67~110만원 / 안치실 10만원'
WHERE id = '9419837';

-- 고령영생병원장례식장 (고령영생병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실및접견실사용료(제3분향실)","detail":"1실/24시간기준","price":300000,"priceDisplay":"30만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실및접견실사용료(제2분향실)","detail":"1실/24시간기준","price":400000,"priceDisplay":"40만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실및접견실사용료(특실)","detail":"1실/24시간기준","price":600000,"priceDisplay":"60만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일기준","price":120000,"priceDisplay":"12만원"}]'::jsonb,
    price_range = '빈소 30~60만원 / 안치실 12만원'
WHERE id = '26445532';

-- 안동농협장례식장 (서안동농협장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"301호(특실)","detail":"96평","price":960000,"priceDisplay":"96만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"203호","detail":"80평","price":800000,"priceDisplay":"80만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"302호","detail":"68평","price":680000,"priceDisplay":"68만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"201호202호","detail":"46평","price":460000,"priceDisplay":"46만원"}]'::jsonb,
    price_range = '빈소 46~96만원'
WHERE id = '47349240';

-- 양산부산대학교병원 장례식장 (부산대학교병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"특1호실","detail":"114.66㎡ / 12시간 기준 /시간당 30000","price":350000,"priceDisplay":"35만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"5호실","detail":"86.30㎡ / 12시간 기준 /시간당 20000","price":234000,"priceDisplay":"23만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"2호실","detail":"83.97㎡ / 12시간 기준 /시간당 17000","price":200000,"priceDisplay":"20만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"3호실","detail":"93.21㎡ / 12시간 기준 /시간당 21000","price":252000,"priceDisplay":"25만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료(일반)","detail":"1일(12시간 이상 24간 미만 적용) / 시간당 4800","price":98600,"priceDisplay":"10만원"},{"category":"안치실이용료","subCategory":"기타","name":"안치료(수급자)","detail":"3일 무료 / 이후 1일당 3750","price":3750,"priceDisplay":"3,750원"}]'::jsonb,
    price_range = '빈소 20~35만원 / 안치실 0만원'
WHERE id = '104599373';

-- 대구의료원 국화원 장례식장 (대구의료원 국화원 장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실(vip실 301호)","detail":"1일(45830/1시간) 462㎡(140평)","price":1100000,"priceDisplay":"110만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실(특실 302호)","detail":"1일(41660/1시간) 377㎡(114평)","price":1000000,"priceDisplay":"100만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실(일반실 206/306호)","detail":"1일(12500/1시간) 132㎡(40평)","price":300000,"priceDisplay":"30만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실(vip실 201호)","detail":"1일(50000/1시간) 499㎡(150평)","price":1200000,"priceDisplay":"120만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실(특실 202호)","detail":"1일(37500/1시간) 314㎡(95평)","price":900000,"priceDisplay":"90만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실(일반실 203호)","detail":"1일(33330/1시간) 297㎡(90평)","price":800000,"priceDisplay":"80만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실(일반실 205/305호)","detail":"1일(16660/1시간) 155㎡(47평)","price":400000,"priceDisplay":"40만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실(일반실 303호)","detail":"1일(27080/1시간) 248㎡(74평)","price":650000,"priceDisplay":"65만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일(3.000/1시간)","price":72000,"priceDisplay":"7만원"}]'::jsonb,
    price_range = '빈소 30~120만원 / 안치실 7만원'
WHERE id = '10267106';

-- BHS한서병원장례식장 (BHS한서병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"기타","name":"입관실사용료","detail":"1회","price":200000,"priceDisplay":"20만원"},{"category":"안치실이용료","subCategory":"기타","name":"냉장","detail":"1일","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '안치실 10만원'
WHERE id = '9165697';

-- 학교법인영산학원시민장례식장 (학교법인영산학원시민장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"시간 5.000원(1일 기준)","price":120000,"priceDisplay":"12만원"}]'::jsonb,
    price_range = '안치실 12만원'
WHERE id = '180';

-- 임실 중앙장례식장 (임실 중앙장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일","price":50000,"priceDisplay":"5만원"}]'::jsonb,
    price_range = '안치실 5만원'
WHERE id = '9416381';

-- 그랜드부민장례식장 (그랜드부민장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료 사용료","detail":"1구/시간","price":2500,"priceDisplay":"2,500원"}]'::jsonb,
    price_range = '안치실 0만원'
WHERE id = '9577060';

-- BHS동래한서요양병원 장례식장 (서요양병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실 101호","detail":"약 50평(30000/1시간)","price":720000,"priceDisplay":"72만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실 103호","detail":"약 43평(25000/1시간)","price":600000,"priceDisplay":"60만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실 102호","detail":"약 30평(20000/1시간)","price":480000,"priceDisplay":"48만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"3000원/1시간","price":72000,"priceDisplay":"7만원"}]'::jsonb,
    price_range = '빈소 48~72만원 / 안치실 7만원'
WHERE id = '14608319';

-- 경찰병원장례식장 (경찰병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료(171.90㎡)","detail":"1실/24시간 기준","price":895200,"priceDisplay":"90만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료(99.17㎡)","detail":"1실/24시간 기준","price":458400,"priceDisplay":"46만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료(200.4㎡)","detail":"1실/24시간 기준","price":1044000,"priceDisplay":"104만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료(105.79㎡)","detail":"1실/24시간 기준","price":492000,"priceDisplay":"49만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1실/24시간 기준","price":60000,"priceDisplay":"6만원"}]'::jsonb,
    price_range = '빈소 46~104만원 / 안치실 6만원'
WHERE id = '8191145';

-- 진도군산림조합직영추모관장례식장 (진도군산림조합직영추모관장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"기타","name":"안치실 사용료","detail":"3일장","price":150000,"priceDisplay":"15만원"}]'::jsonb,
    price_range = '안치실 15만원'
WHERE id = '181';

-- 남양주시 원병원장례식장 (원병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소/접객실 임대료","detail":"특실 1일/24시간기준","price":840000,"priceDisplay":"84만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소/접객실 임대료","detail":"일반 1일/24시간기준","price":480000,"priceDisplay":"48만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"환경관리비","detail":"1인기준","price":30000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소/접객실 임대료","detail":"중실 1일/24시간기준","price":552000,"priceDisplay":"55만원"},{"category":"안치실이용료","subCategory":"기타","name":"안치관리비","detail":"1일/24시간기준","price":120000,"priceDisplay":"12만원"}]'::jsonb,
    price_range = '빈소 3~84만원 / 안치실 12만원'
WHERE id = '154077586';

-- 동국대학교일산병원 장례식장 (동국대학교일산장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"안치료 / 일","price":96000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '안치실 10만원'
WHERE id = '10746269';

-- 한림대학교 한강성심병원 장례식장 (한강성심병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"3호(264㎡ 80평)","detail":"1실/24시간 기준","price":960000,"priceDisplay":"96만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"2호(264㎡ 80평)","detail":"1실/24시간 기준","price":960000,"priceDisplay":"96만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"VIP 1호(396㎡ 120평)","detail":"1실/24시간 기준","price":1680000,"priceDisplay":"168만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"6호(99㎡ 30평)","detail":"1실/24시간 기준","price":408000,"priceDisplay":"41만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"5호(231㎡ 70평)","detail":"1실/24시간 기준","price":840000,"priceDisplay":"84만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1실/24시간 기준","price":144000,"priceDisplay":"14만원"}]'::jsonb,
    price_range = '빈소 41~168만원 / 안치실 14만원'
WHERE id = '12216118';

-- 송정장례식장 (송정장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실(시간 4167)","detail":"1일(2~3일장 / 2일 적용)","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '안치실 10만원'
WHERE id = '12166550';

-- 김제새만금장례식장 (새만금장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"기타","name":"안치실","detail":"1일","price":50000,"priceDisplay":"5만원"}]'::jsonb,
    price_range = '안치실 5만원'
WHERE id = '8350971';

-- 인제대학교상계백병원장례식장 (백병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"기타","name":"안치실","detail":"특수사체 / 1시간","price":10000,"priceDisplay":"1만원"},{"category":"안치실이용료","subCategory":"기타","name":"안치실","detail":"일반사체 / 1시간","price":8000,"priceDisplay":"8,000원"}]'::jsonb,
    price_range = '안치실 1만원'
WHERE id = '17021771';

-- 흥해경희요양병원장례식장 (흥해경희요양병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"24시간/일","price":96000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '안치실 10만원'
WHERE id = '10965700';

-- 21C한일병원장례식장 (21C한일병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"특실(분향실+상주실+접객실)","detail":"1일","price":700000,"priceDisplay":"70만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"고급(분향실+상주실+접객실)","detail":"1일","price":500000,"priceDisplay":"50만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실이용료","detail":"1일","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 50~70만원 / 안치실 10만원'
WHERE id = '8521773';

-- 안동병원장례식장 (안동병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료","detail":"45평형 1실 5호","price":450000,"priceDisplay":"45만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료","detail":"70평형 1실 8호","price":600000,"priceDisplay":"60만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료","detail":"40평형 2실 3.7호","price":400000,"priceDisplay":"40만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료","detail":"90평형 1실 2호","price":700000,"priceDisplay":"70만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료","detail":"130평형 1실 10호(특1호)","price":990000,"priceDisplay":"99만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료","detail":"90평형 1실 9호(특2호)","price":750000,"priceDisplay":"75만원"},{"category":"안치실이용료","subCategory":"기타","name":"안치실이용료","detail":"안치실료","price":70000,"priceDisplay":"7만원"}]'::jsonb,
    price_range = '빈소 40~99만원 / 안치실 7만원'
WHERE id = '10587154';

-- 양산서울요양병원장례식장 (양산서울요양병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"고인 안치료","detail":"1일","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '안치실 10만원'
WHERE id = '1303697772';

-- 홍성의료원장례식장 (홍성의료원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 빈소사용료 (3호실)","detail":"15㎡   (1시간당 요금산정)","price":10000,"priceDisplay":"1만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 빈소사용료 (특실)","detail":"276㎡ (1시간당 요금산정)","price":40000,"priceDisplay":"4만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 빈소사용료 (1호실)","detail":"120㎡ (1시간당 요금산정)","price":17000,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 빈소사용료 (국화난초)","detail":"210㎡ (1시간당 요금산정)","price":30000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 빈소사용료 (2호실)","detail":"160㎡ (1시간당 요금산정)","price":24000,"priceDisplay":"2만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료(안치냉장고)","detail":"1시간당 요금산정","price":3500,"priceDisplay":"3,500원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료(감염)","detail":"1일","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 1~4만원 / 안치실 0만원'
WHERE id = '9609223';

-- 보정장례식장 (보정장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실 및 접객실","detail":"80평(1일)","price":660000,"priceDisplay":"66만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실 및 접객실","detail":"100평(1일)","price":780000,"priceDisplay":"78만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실 및 접객실","detail":"160평(1일)","price":960000,"priceDisplay":"96만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1일","price":90000,"priceDisplay":"9만원"}]'::jsonb,
    price_range = '빈소 66~96만원 / 안치실 9만원'
WHERE id = '8326378';

-- 행복한병원장례식장 (행복한병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"특실","detail":"30평","price":300000,"priceDisplay":"30만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"vip 2호","detail":"80평","price":600000,"priceDisplay":"60만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"vip1호","detail":"80평","price":600000,"priceDisplay":"60만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료/감염성위험시신","detail":"1일","price":150000,"priceDisplay":"15만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일","price":60000,"priceDisplay":"6만원"}]'::jsonb,
    price_range = '빈소 30~60만원 / 안치실 6만원'
WHERE id = '1134153909';

-- 나주한국병원장례식장 (나주한국병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"접객실","name":"접객실","detail":"1일","price":400000,"priceDisplay":"40만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 40만원 / 안치실 10만원'
WHERE id = '10191123';

-- 함평장례식장 (함평장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1일","price":80000,"priceDisplay":"8만원"}]'::jsonb,
    price_range = '안치실 8만원'
WHERE id = '9569906';

-- 성서요양병원장례식장 (서요양병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실 101호","detail":"약 50평(30000/1시간)","price":720000,"priceDisplay":"72만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실 103호","detail":"약 43평(25000/1시간)","price":600000,"priceDisplay":"60만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실 102호","detail":"약 30평(20000/1시간)","price":480000,"priceDisplay":"48만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"3000원/1시간","price":72000,"priceDisplay":"7만원"}]'::jsonb,
    price_range = '빈소 48~72만원 / 안치실 7만원'
WHERE id = '18446554';

-- 순천한국병원장례식장 (순천한국병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실및 접객실 시간당 임대료","detail":"vip실(150평)가족방 및 샤워실. 화장실","price":50000,"priceDisplay":"5만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실 및 접객실 시간당 임대료","detail":"3호실(70평)가족방.샤워실.화장실","price":37500,"priceDisplay":"4만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실  및 접객실 시간당 임대료","detail":"2호실(70평)가족방.샤워실.화장실","price":37500,"priceDisplay":"4만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실 및 접객실 시간당 임대료(지하)","detail":"6호실(50평)가족방.샤워실.화장실","price":20800,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실 및 접객실 시간당 임대료(지하)","detail":"5호실(60평)가족방.샤워실.화장실","price":25000,"priceDisplay":"3만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1일24시간(시간당2916)","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 2~5만원 / 안치실 10만원'
WHERE id = '8591058';

-- 주식회사구민장례식장 (주식회사구민장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"고인 1일 안치요금","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '안치실 10만원'
WHERE id = '17091691';

-- 굿뉴스요양병원장례식장 (굿뉴스요양병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"특실(분향+유족+접객)","detail":"분향실+접객실+유족실(샤워실)","price":700000,"priceDisplay":"70만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"고급(분향+유족+접객)","detail":"분향실+접객실+유족실(샤워실)","price":500000,"priceDisplay":"50만원"}]'::jsonb,
    price_range = '빈소 50~70만원'
WHERE id = '10227042';

-- 경남요양병원장례식장 (경남요양병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"특2호실","detail":"1일","price":180000,"priceDisplay":"18만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특1호실","detail":"1일","price":200000,"priceDisplay":"20만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"일반실","detail":"1일","price":100000,"priceDisplay":"10만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1일(관외)","price":120000,"priceDisplay":"12만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1일(관내)","price":60000,"priceDisplay":"6만원"}]'::jsonb,
    price_range = '빈소 10~20만원 / 안치실 6만원'
WHERE id = '8785238';

-- 분당서울대학교병원 장례식장 (분당서울대학교병원 장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료","detail":"49평(1실/24시간 기준)","price":936000,"priceDisplay":"94만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료","detail":"35평(1실/24시간 기준)","price":504000,"priceDisplay":"50만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료","detail":"80평(1실/24시간 기준)","price":1656000,"priceDisplay":"166만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료","detail":"54평(1실/24시간 기준)","price":1080000,"priceDisplay":"108만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료","detail":"47평(1실/24시간 기준)","price":900000,"priceDisplay":"90만원"},{"category":"안치실이용료","subCategory":"일반","name":"장례식장 안치료","detail":"(3.125 / 1시간 기준)","price":75000,"priceDisplay":"8만원"}]'::jsonb,
    price_range = '빈소 50~166만원 / 안치실 8만원'
WHERE id = '13559585';

-- 한결장례식장 (한결장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일 24시간 기준","price":84000,"priceDisplay":"8만원"}]'::jsonb,
    price_range = '안치실 8만원'
WHERE id = '27222877';

-- 김제 중앙병원 장례식장 (중앙병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장(임대료)","detail":"1실 (24시간기준)","price":450000,"priceDisplay":"45만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실사용료","detail":"1회","price":300000,"priceDisplay":"30만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료(임대료)","detail":"1실 (24시간기준)","price":70000,"priceDisplay":"7만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"사용료 1일/24시간기준","price":120000,"priceDisplay":"12만원"},{"category":"안치실이용료","subCategory":"","name":"안치료","detail":"시간당","price":3000,"priceDisplay":"3,000원"}]'::jsonb,
    price_range = '빈소 45만원 / 안치실 0만원'
WHERE id = '22378485';

-- 충주의료원장례식장 (충주의료원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일 기준","price":60000,"priceDisplay":"6만원"}]'::jsonb,
    price_range = '안치실 6만원'
WHERE id = '17489739';

-- 대동병원장례식장 (대동병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"1호실","detail":"165m2 (50평) - 12시간기준 / 시간당 42000원","price":500000,"priceDisplay":"50만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"6호실","detail":"181m2 (55평) - 12시간기준 / 시간당 46000원","price":550000,"priceDisplay":"55만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"5호실","detail":"198m2 (60평) - 12시간기준 / 시간당 50000원","price":600000,"priceDisplay":"60만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"3호실","detail":"165m2 (50평) - 12시간기준 / 시간당 42000원","price":500000,"priceDisplay":"50만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"2호실","detail":"165m2 (50평) - 12시간기준 / 시간당 42000원","price":500000,"priceDisplay":"50만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"7호실","detail":"181m2 (55평) - 12시간기준 / 시간당 46000원","price":550000,"priceDisplay":"55만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"VIP실","detail":"297m2 (90평) - 12시간기준 / 시간당 75000원","price":900000,"priceDisplay":"90만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실 이용료","detail":"1일 100000원 / 시간당 8000원","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 50~90만원 / 안치실 10만원'
WHERE id = '17273895';

-- 연세대학교 용인장례식장 (연세대학교 용인장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1실/ 24시간 기준","price":88800,"priceDisplay":"9만원"}]'::jsonb,
    price_range = '안치실 9만원'
WHERE id = '897363072';

-- 농협연합장례식장 (농협연합장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"국화실","detail":"시간당 (조합원 무료)","price":15000,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"목련실(40평형)","detail":"시간당 (조합원 무료)","price":20000,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"vip실(60평형)","detail":"시간당 (조합원 무료)","price":25000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료 80평형(264.46m²) 1개소","detail":"1실 / 24시간 기준 (1시간당 25000원)","price":600000,"priceDisplay":"60만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료 63평형(208.26m²) 2개소","detail":"1실 / 24시간 기준 (1시간당 20000원)","price":480000,"priceDisplay":"48만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"백합실(40평형)","detail":"시간당 (조합원 무료)","price":20000,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료 49평형(161.98m²) 4개소","detail":"1실 / 24시간 기준 (1시간당 16000원)","price":384000,"priceDisplay":"38만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실 사용료 (1구당)","detail":"1실 / 24시간 기준 (1시간당 5000원)","price":120000,"priceDisplay":"12만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"시간당","price":8000,"priceDisplay":"8,000원"}]'::jsonb,
    price_range = '빈소 2~60만원 / 안치실 1만원'
WHERE id = '10218023';

-- 동광양장례식장 (동광양장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"일반실(70평) 2실/50% 할인 18주년","detail":"시간","price":42000,"priceDisplay":"4만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특실 (100평) 3실 /50% 할인 18주년","detail":"시간","price":50000,"priceDisplay":"5만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"일","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 4~5만원 / 안치실 10만원'
WHERE id = '8639170';

-- 경상국립대학교병원장례식장 (경상국립대학교병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"102호","detail":"시간당","price":29200,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"101호","detail":"1일당","price":900000,"priceDisplay":"90만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"101호","detail":"시간당","price":37500,"priceDisplay":"4만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"102호","detail":"1일당","price":700000,"priceDisplay":"70만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"201호","detail":"시간당","price":21000,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"201호","detail":"1일당","price":500000,"priceDisplay":"50만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"205호","detail":"시간당","price":11000,"priceDisplay":"1만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"202.203204206207호","detail":"시간당","price":14340,"priceDisplay":"1만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"202.203204206207호","detail":"1일당","price":344000,"priceDisplay":"34만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"205호","detail":"1일당","price":264000,"priceDisplay":"26만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"시간당","price":7000,"priceDisplay":"7,000원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일당","price":80000,"priceDisplay":"8만원"}]'::jsonb,
    price_range = '빈소 1~90만원 / 안치실 1만원'
WHERE id = '13565708';

-- 이대서울병원장례식장 (이대서울병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소임대료(306.0 ㎡)","detail":"1실/24시간 기준","price":2448000,"priceDisplay":"245만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소임대료(495.0 ㎡)","detail":"1실/24시간 기준","price":3888000,"priceDisplay":"389만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소임대료(495.0 ㎡)","detail":"1실/24시간 기준","price":3480000,"priceDisplay":"348만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소임대료(284.0 ㎡)","detail":"1실/24시간 기준","price":2280000,"priceDisplay":"228만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소임대료(165.9 ㎡)","detail":"1실/24시간 기준","price":1200000,"priceDisplay":"120만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소임대료(151.4 ㎡)","detail":"1실/24시간 기준","price":960000,"priceDisplay":"96만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1실/24시간 기준","price":96000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 96~389만원 / 안치실 10만원'
WHERE id = '1644308240';

-- 추모원장례식장 (추모원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실+접객실","detail":"1일","price":720000,"priceDisplay":"72만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실사용료","detail":"1일","price":96000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 72만원 / 안치실 10만원'
WHERE id = '16256416';

-- 서귀포의료원장례식장 (서귀포의료원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"시간당(원외빈소사용)","price":6700,"priceDisplay":"6,700원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"시간당(원내빈소사용)","price":3350,"priceDisplay":"3,350원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"원외빈소사용(1일당)","price":80000,"priceDisplay":"8만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"원내빈소사용(1일당)","price":40000,"priceDisplay":"4만원"}]'::jsonb,
    price_range = '안치실 0만원'
WHERE id = '21768647';

-- 건국대학교충주병원장례식장 (건국대학교충주병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"37평","detail":"분향소+접객실+상주휴게실","price":354000,"priceDisplay":"35만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"61평","detail":"분향소+접객실+상주휴게실","price":522000,"priceDisplay":"52만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"42평","detail":"분향소+접객실+상주휴게실","price":389000,"priceDisplay":"39만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"90평","detail":"분향소+접객실+상주휴게실","price":680000,"priceDisplay":"68만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"안치료","price":50000,"priceDisplay":"5만원"}]'::jsonb,
    price_range = '빈소 35~68만원 / 안치실 5만원'
WHERE id = '15926496';

-- 사하구민장례식장 (사하구민장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"501호 (90평)","detail":"298  m2","price":600000,"priceDisplay":"60만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"301호 (90평)","detail":"298  m2","price":600000,"priceDisplay":"60만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"VIP실(140평)","detail":"463  m2","price":960000,"priceDisplay":"96만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"302호 (90평)","detail":"298  m2","price":600000,"priceDisplay":"60만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"502호 (90평)","detail":"298  m2","price":600000,"priceDisplay":"60만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실이용료","detail":"1일","price":120000,"priceDisplay":"12만원"}]'::jsonb,
    price_range = '빈소 60~96만원 / 안치실 12만원'
WHERE id = '334337270';

-- 영암효병원장례식장 (영암효병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"고인 냉장 안치료","detail":"1실","price":90000,"priceDisplay":"9만원"}]'::jsonb,
    price_range = '안치실 9만원'
WHERE id = '1654704741';

-- 좋은삼선병원 장례식장 ((주)비이케이더블유 좋은삼선병원지점)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"24시간 기준","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '안치실 10만원'
WHERE id = '14650794';

-- 동두천중앙성모병원장례식장 (동두천장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"","name":"일","detail":"1","price":120000,"priceDisplay":"12만원"}]'::jsonb,
    price_range = '안치실 12만원'
WHERE id = '217';

-- 가천대길병원 장례식장 (길병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"65평(105호 106호)","detail":"24시간을 1일로 산정 12시간이상 24시간 미만은 1일로 산정 12시간 미만 시간단위 1시간 미만은 1시간 산정 1일 804000원","price":35000,"priceDisplay":"4만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"50평(601호 602호)","detail":"24시간을 1일로 산정 12시간이상 24시간 미만은 1일로 산정 12시간 미만 시간단위 1시간 미만은 1시간 산정 1일 624000원","price":26000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"70평(201202호301호 302호)","detail":"24시간을 1일로 산정 12시간이상 24시간 미만은 1일로 산정 12시간 미만 시간단위 1시간 미만은 1시간 산정  1일 960000원","price":40000,"priceDisplay":"4만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"120평( 501호)","detail":"24시간을 1일로 산정 12시간이상 24시간 미만은 1일로 산정 12시간 미만 시간단위 1시간 미만은 1시간 산정 1일 1464000원","price":61000,"priceDisplay":"6만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"35평(101호102호)","detail":"24시간을 1일로 산정 12시간이상 24시간 미만은 1일로 산정 12시간 미만 시간단위 1시간 미만은 1시간 산정 1일 408000원","price":17000,"priceDisplay":"2만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"24시간을 1일로 산정 12시간이상 24시간 미만은 1일로 산정 12시간 미만 시간단위 1시간 미만은 1시간 산정 1일 60000원","price":5000,"priceDisplay":"5,000원"}]'::jsonb,
    price_range = '빈소 2~6만원 / 안치실 1만원'
WHERE id = '14650782';

-- 청송진보병원 장례식장 (진보병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"기타","name":"안치실비용","detail":"1일","price":50000,"priceDisplay":"5만원"}]'::jsonb,
    price_range = '안치실 5만원'
WHERE id = '18039495';

-- 울진군의료원장례식장 (울진군의료원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1일","price":67200,"priceDisplay":"7만원"}]'::jsonb,
    price_range = '안치실 7만원'
WHERE id = '10782074';

-- 대구보훈병원장례식장 (대구보훈병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"고인안치실","price":60000,"priceDisplay":"6만원"},{"category":"안치실이용료","subCategory":"기타","name":"103호","detail":"83평형조문실 분향실 상주방 화장실 샤워실 부대시설","price":624000,"priceDisplay":"62만원"}]'::jsonb,
    price_range = '안치실 6만원'
WHERE id = '12127022';

-- 고신대학교복음병원 (복음병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"2호실","detail":"1일 사용료","price":500000,"priceDisplay":"50만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"VIP실","detail":"1일사용료","price":800000,"priceDisplay":"80만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특실","detail":"1일사용료","price":600000,"priceDisplay":"60만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"1호실","detail":"1일사용료","price":500000,"priceDisplay":"50만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일 사용료","price":140000,"priceDisplay":"14만원"}]'::jsonb,
    price_range = '빈소 50~80만원 / 안치실 14만원'
WHERE id = '26822081';

-- 갑을장유병원장례식장 (갑을장유병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료 특2호","detail":"1실/24시간","price":720000,"priceDisplay":"72만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료 특1호","detail":"1실/24시간","price":800000,"priceDisplay":"80만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료 일반실(대)","detail":"1실/24시간","price":600000,"priceDisplay":"60만원"},{"category":"안치실이용료","subCategory":"","name":"","detail":"1일/24시간","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 60~80만원 / 안치실 10만원'
WHERE id = '19030176';

-- 고성성심병원장례식장 (고성성심병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"","name":"안치실이용료","detail":"1일","price":50000,"priceDisplay":"5만원"}]'::jsonb,
    price_range = '안치실 5만원'
WHERE id = '18309514';

-- 풍기성심요양병원장례식장 (성심요양병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실사용료","detail":"시간당(4.000원)","price":96000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '안치실 10만원'
WHERE id = '25083612';

-- 태백문화장례식장 (태백문화장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"시간","price":3000,"priceDisplay":"3,000원"}]'::jsonb,
    price_range = '안치실 0만원'
WHERE id = '12411736';

-- 구로성심병원장례식장 (구로성심병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장임대료","detail":"1실/24시간 기준","price":504000,"priceDisplay":"50만원"},{"category":"안치실이용료","subCategory":"일반","name":"장례식장안치료","detail":"1실/24시간 기준","price":96000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 50만원 / 안치실 10만원'
WHERE id = '167053209';

-- 예담장례식장 (예담장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"시간당","price":5000,"priceDisplay":"5,000원"}]'::jsonb,
    price_range = '안치실 1만원'
WHERE id = '26893193';

-- 서울산국화원장례식장 (서울산국화원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일/24시간기준","price":120000,"priceDisplay":"12만원"}]'::jsonb,
    price_range = '안치실 12만원'
WHERE id = '1235435104';

-- 성산현대요양병원장례식장 (성산현대요양병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장임대료 특실","detail":"1일 사용료41000/시간","price":500000,"priceDisplay":"50만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장임대료 1호실","detail":"1일 사용료33000/시간","price":400000,"priceDisplay":"40만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일 사용료","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 40~50만원 / 안치실 10만원'
WHERE id = '19607594';

-- 황금요양병원 장례식장 (황금요양병원 장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"203호","detail":"166m2","price":720000,"priceDisplay":"72만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"202호","detail":"166m2","price":780000,"priceDisplay":"78만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특201호","detail":"265m2","price":960000,"priceDisplay":"96만원"},{"category":"안치실이용료","subCategory":"일반","name":"사용료","detail":"1일","price":96000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 72~96만원 / 안치실 10만원'
WHERE id = '2104093117';

-- 부성장례식장 (부성장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실 및 접객실(201호)자체행사시 무료","detail":"1일(24시간 기준) 90평","price":400000,"priceDisplay":"40만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실 및 접객실(특실)자체행사시 무료","detail":"1일(24시간 기준) 100평","price":600000,"priceDisplay":"60만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실 및 접객실(202호)자체행사시 무료","detail":"1일(24시간 기준) 45평","price":250000,"priceDisplay":"25만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일(24시간 기준)","price":70000,"priceDisplay":"7만원"}]'::jsonb,
    price_range = '빈소 25~60만원 / 안치실 7만원'
WHERE id = '9794269';

-- 남울산국화원 장례식장 (울산국화원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일/24시간기준","price":120000,"priceDisplay":"12만원"}]'::jsonb,
    price_range = '안치실 12만원'
WHERE id = '2055234852';

-- 제일병원장례식장 (김천제일병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"일반345호실 ( 99㎡ )","detail":"1시간","price":27500,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특1호실 ( 182㎡ )","detail":"귀빈실 상주휴게실 샤워실 화장실","price":600000,"priceDisplay":"60만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특2호실 ( 132㎡ )","detail":"1시간","price":36000,"priceDisplay":"4만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특2호실 ( 132㎡ )","detail":"상주휴게실 샤워실 화장실","price":432000,"priceDisplay":"43만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특1호실 ( 182㎡ )","detail":"1시간","price":50000,"priceDisplay":"5만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"일반34호실 추가 대실( 99㎡ )","detail":"1일","price":240000,"priceDisplay":"24만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"일반345호실 ( 99㎡ )","detail":"상주휴게실 샤워실 화장실","price":330000,"priceDisplay":"33만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1시간","price":5000,"priceDisplay":"5,000원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1일(12시간이상)","price":60000,"priceDisplay":"6만원"}]'::jsonb,
    price_range = '빈소 3~60만원 / 안치실 1만원'
WHERE id = '9373191';

-- 구미가톨릭요양병원장례식장 (구미가톨릭요양병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"102호(40평)","detail":"분향실.접객","price":600000,"priceDisplay":"60만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"101호(30평)","detail":"분향실.접객","price":480000,"priceDisplay":"48만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특1실(60평)","detail":"분향실.접객","price":900000,"priceDisplay":"90만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특2실(40평)","detail":"분향실.접객","price":720000,"priceDisplay":"72만원"}]'::jsonb,
    price_range = '빈소 48~90만원'
WHERE id = '8766856';

-- 영월장례식장 (영월장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실 사용료","detail":"시간당","price":4500,"priceDisplay":"4,500원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실 사용료","detail":"시간당","price":3500,"priceDisplay":"3,500원"}]'::jsonb,
    price_range = '빈소 0만원 / 안치실 0만원'
WHERE id = '10643008';

-- 은하수공원장례식장 (은하수공원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소(일반실)","detail":"관내/1시간","price":9000,"priceDisplay":"9,000원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소(일반실)","detail":"관외/1시간","price":13000,"priceDisplay":"1만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소(일반실)","detail":"관외/1시간","price":25000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소(특실)","detail":"관내/1시간","price":17000,"priceDisplay":"2만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"관외/1시간","price":4000,"priceDisplay":"4,000원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"관내/1시간","price":2000,"priceDisplay":"2,000원"}]'::jsonb,
    price_range = '빈소 1~3만원 / 안치실 0만원'
WHERE id = '11824098';

-- 교하장례식장 (교하장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"임대료          일반분향소(시간당)","detail":"2호실","price":25000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"임대료         일반분향소(시간당)","detail":"1호실","price":33000,"priceDisplay":"3만원"},{"category":"안치실이용료","subCategory":"일반","name":"임대료         안치냉장고사용료(일일기준)","detail":"1일","price":120000,"priceDisplay":"12만원"}]'::jsonb,
    price_range = '빈소 3~3만원 / 안치실 12만원'
WHERE id = '15110858';

-- 순천향대학교 구미병원 장례식장 (순천향장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"VIP분향소 빈소.접객실 사용료","detail":"1일 기준","price":800000,"priceDisplay":"80만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"2분향소 빈소.접객실 사용료","detail":"1일 기준","price":400000,"priceDisplay":"40만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특분향소 빈소.접객실 사용료","detail":"1일 기준","price":700000,"priceDisplay":"70만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"3분향소 빈소.접객실 사용료","detail":"1일 기준","price":200000,"priceDisplay":"20만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"1분향소 빈소.접객실 사용료","detail":"1일 기준","price":500000,"priceDisplay":"50만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일 기준","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 20~80만원 / 안치실 10만원'
WHERE id = '16284176';

-- 창원파티마병원장례식장 (창원파티마병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"장례식장 안치료","detail":"1일/24시간 기준","price":60000,"priceDisplay":"6만원"}]'::jsonb,
    price_range = '안치실 6만원'
WHERE id = '25083607';

-- 강릉고려병원 (고려병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소+접객실 특3호","detail":"시간당","price":20000,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소+접객실 vip","detail":"시간당","price":30000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소+접객실 특1호","detail":"시간당","price":25000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소+접객실 특2호","detail":"시간당","price":23000,"priceDisplay":"2만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1일","price":120000,"priceDisplay":"12만원"}]'::jsonb,
    price_range = '빈소 2~3만원 / 안치실 12만원'
WHERE id = '26822740';

-- 서울특별시 동부병원 장례식장 (서울특별시 동부병원 장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"4호실(접객실 포함)","detail":"26평형(87.14㎡)","price":356460,"priceDisplay":"36만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"3호실(접객실 포함)","detail":"24평형(80.78㎡)","price":329040,"priceDisplay":"33만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"1~2호실(접객실 포함)","detail":"30평형(99.51㎡)","price":411300,"priceDisplay":"41만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일 기준","price":59230,"priceDisplay":"6만원"}]'::jsonb,
    price_range = '빈소 33~41만원 / 안치실 6만원'
WHERE id = '7936735';

-- 정요양병원장례식장 (정요양병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실 01일 사용요금","detail":"","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '안치실 10만원'
WHERE id = '19484811';

-- 문경장례식장 (문경장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실 및 접객실사용료(202호302호)","detail":"1시간기준","price":26000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실 및 접객실사용료(특 301호","detail":"1시간기준","price":30000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실 및 접객실사용료(201호","detail":"1시간기준","price":28000,"priceDisplay":"3만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1시간당","price":9000,"priceDisplay":"9,000원"}]'::jsonb,
    price_range = '빈소 3~3만원 / 안치실 1만원'
WHERE id = '19862842';

-- Sh수협장례식장 (Sh수협장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"무궁화국화","detail":"특실(1시간 기준)","price":50000,"priceDisplay":"5만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"백합","detail":"일반실(1시간 기준)","price":35000,"priceDisplay":"4만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"목련","detail":"일반실(1시간 기준)","price":25000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"동백","detail":"일반실(1시간 기준)","price":20000,"priceDisplay":"2만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"빈소사용 구분없음 (1시간 기준)","price":3000,"priceDisplay":"3,000원"}]'::jsonb,
    price_range = '빈소 2~5만원 / 안치실 0만원'
WHERE id = '1545049594';

-- 경기도의료원 의정부병원 장례식장 (경기도의료원 의정부병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"안치료(1시간/ 3000원)","price":72000,"priceDisplay":"7만원"}]'::jsonb,
    price_range = '안치실 7만원'
WHERE id = '10178986';

-- 자인전문장례식장 (자인전문장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"202호 시간당35000원","detail":"198m2","price":840000,"priceDisplay":"84만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"301  시간당45000원","detail":"297m2","price":1080000,"priceDisplay":"108만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"201호 시간당35000원","detail":"198m2","price":840000,"priceDisplay":"84만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"101호 시간당25000원","detail":"109m2","price":600000,"priceDisplay":"60만원"}]'::jsonb,
    price_range = '빈소 60~108만원'
WHERE id = '11516071';

-- 함양성심병원장례식장 (함양성심병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일 기준","price":80000,"priceDisplay":"8만원"}]'::jsonb,
    price_range = '안치실 8만원'
WHERE id = '23851617';

-- 성모병원장례식장 (가톨릭대학교대전성모병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실이용료","detail":"특3분향실/68평형/시간당34000원","price":816000,"priceDisplay":"82만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실이용료","detail":"특1분향실/90평형/시간당48000원","price":1152000,"priceDisplay":"115만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실이용료","detail":"8분향실/42평형/시간당20000원","price":480000,"priceDisplay":"48만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실이용료","detail":"VIP실/107평형/시간당54000원","price":1296000,"priceDisplay":"130만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실이용료","detail":"5분향실/49평형/시간당23000원","price":552000,"priceDisplay":"55만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실이용료","detail":"특2분향실/100평형/시간당52000원","price":1248000,"priceDisplay":"125만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실이용료","detail":"7분향실/68평형/시간당34000원","price":816000,"priceDisplay":"82만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실이용료","detail":"6분향실/49평형/시간당23000원","price":552000,"priceDisplay":"55만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"시간당3000원","price":72000,"priceDisplay":"7만원"}]'::jsonb,
    price_range = '빈소 48~130만원 / 안치실 7만원'
WHERE id = '718093487';

-- 영주장례문화원 (영주장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"임대료","price":100000,"priceDisplay":"10만원"},{"category":"안치실이용료","subCategory":"기타","name":"입관료","detail":"고인 입관비용","price":300000,"priceDisplay":"30만원"}]'::jsonb,
    price_range = '안치실 10만원'
WHERE id = '10644756';

-- 좋은삼정병원장례식장 (정병원 장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"시설 사용료   [별실]","detail":"빈소 및 접객실 사용료 (1일)","price":552000,"priceDisplay":"55만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"시설 사용료   [특실]","detail":"빈소 및 접객실 사용료 (1일)","price":720000,"priceDisplay":"72만원"},{"category":"안치실이용료","subCategory":"일반","name":"냉장고 사용료","detail":"냉장고 사용료 (1일)","price":48000,"priceDisplay":"5만원"}]'::jsonb,
    price_range = '빈소 55~72만원 / 안치실 5만원'
WHERE id = '11958174';

-- 영덕제일요양병원장례식장 (영덕제일요양병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"접객실","name":"특1호실","detail":"70평/시간당","price":24000,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"접객실","name":"특2호실","detail":"50평/시간당","price":22000,"priceDisplay":"2만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"시간당","price":6000,"priceDisplay":"6,000원"}]'::jsonb,
    price_range = '빈소 2~2만원 / 안치실 1만원'
WHERE id = '618947803';

-- 제주의료원 장례식장 (제주의료원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실(조객실 사용 포함)","detail":"1일","price":150000,"priceDisplay":"15만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실(의료급여 환자))","detail":"1일","price":3750,"priceDisplay":"3,750원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1일","price":35000,"priceDisplay":"4만원"}]'::jsonb,
    price_range = '빈소 15만원 / 안치실 0만원'
WHERE id = '14650835';

-- 희윤요양병원 장례식장 (희윤요양병원 장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실(접객실)","detail":"(특실)1","price":350000,"priceDisplay":"35만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실(접객실)","detail":"(일반실)1","price":300000,"priceDisplay":"30만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실(접객실)","detail":"(일반실)1","price":300000,"priceDisplay":"30만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"","price":60000,"priceDisplay":"6만원"}]'::jsonb,
    price_range = '빈소 30~35만원 / 안치실 6만원'
WHERE id = '24124709';

-- 뉴타운장례식장 (뉴타운장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료(10호실)","detail":"1일/24시간 기준","price":1992000,"priceDisplay":"199만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료(6호실)","detail":"1일/24시간 기준","price":1680000,"priceDisplay":"168만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료(5호실)","detail":"1일/24시간 기준","price":528000,"priceDisplay":"53만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료(9호실)","detail":"1일/24시간 기준","price":1440000,"priceDisplay":"144만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료(127호)","detail":"1일/24시간 기준","price":792000,"priceDisplay":"79만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료(3호실)","detail":"1일/24시간 기준","price":432000,"priceDisplay":"43만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료(8호)","detail":"1일/24시간기준","price":888000,"priceDisplay":"89만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료(11호실)","detail":"1일/24시간 기준","price":2400000,"priceDisplay":"240만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일","price":80000,"priceDisplay":"8만원"},{"category":"안치실이용료","subCategory":"","name":"장례식장 임대료(안치)","detail":"1일/24시간 기준","price":96000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 43~240만원 / 안치실 8만원'
WHERE id = '8206031';

-- 시티병원장례식장 (시티병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"특  실 (시간당 45000원)","detail":"80평/1일/접객실분향실상주휴게실 포함","price":1080000,"priceDisplay":"108만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"2호실 (시간당 25000원)","detail":"38평/1일/접객실분향실상주휴게실 포함","price":600000,"priceDisplay":"60만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"1호실 (시간당 35000원)","detail":"60평/1일/접객실분향실상주휴게실 포함","price":840000,"priceDisplay":"84만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료 1일 (24시간)","detail":"1시간 5000원","price":120000,"priceDisplay":"12만원"}]'::jsonb,
    price_range = '빈소 60~108만원 / 안치실 12만원'
WHERE id = '11983935';

-- 천주성삼병원장례식장 (천주성삼병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일(시간당 4000원)","price":96000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '안치실 10만원'
WHERE id = '11707104';

-- 세종여주병원 장례식장 (세종여주병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소및접객실","detail":"특실(80평) 시간당","price":35000,"priceDisplay":"4만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소및접객실","detail":"일반실(60평) 시간당","price":25000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소및접객실","detail":"인반실(60평) 시간당","price":20000,"priceDisplay":"2만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"안치료(시간당)","price":5000,"priceDisplay":"5,000원"}]'::jsonb,
    price_range = '빈소 2~4만원 / 안치실 1만원'
WHERE id = '16184940';

-- 나주시영산포농협장례식장 (영산포농협장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1일기준(100000원)","price":300000,"priceDisplay":"30만원"}]'::jsonb,
    price_range = '안치실 30만원'
WHERE id = '27579080';

-- 칠곡군농협연합장례식장 (농협연합장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"국화실","detail":"시간당 (조합원 무료)","price":15000,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"목련실(40평형)","detail":"시간당 (조합원 무료)","price":20000,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"vip실(60평형)","detail":"시간당 (조합원 무료)","price":25000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료 80평형(264.46m²) 1개소","detail":"1실 / 24시간 기준 (1시간당 25000원)","price":600000,"priceDisplay":"60만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료 63평형(208.26m²) 2개소","detail":"1실 / 24시간 기준 (1시간당 20000원)","price":480000,"priceDisplay":"48만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"백합실(40평형)","detail":"시간당 (조합원 무료)","price":20000,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료 49평형(161.98m²) 4개소","detail":"1실 / 24시간 기준 (1시간당 16000원)","price":384000,"priceDisplay":"38만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실 사용료 (1구당)","detail":"1실 / 24시간 기준 (1시간당 5000원)","price":120000,"priceDisplay":"12만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"시간당","price":8000,"priceDisplay":"8,000원"}]'::jsonb,
    price_range = '빈소 2~60만원 / 안치실 1만원'
WHERE id = '26571939';

-- 음성농협장례식장 (음성농협장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"조합원(1일)","price":50000,"priceDisplay":"5만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"비조합원(1일)","price":80000,"priceDisplay":"8만원"}]'::jsonb,
    price_range = '안치실 5만원'
WHERE id = '8043685';

-- 상주성모병원 장례식장 (상주성모병원 장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실사용료","detail":"1일","price":72000,"priceDisplay":"7만원"}]'::jsonb,
    price_range = '안치실 7만원'
WHERE id = '10040254';

-- 옥산전문장례식장 (옥산전문장례예식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료(1시간당)","detail":"","price":3000,"priceDisplay":"3,000원"}]'::jsonb,
    price_range = '안치실 0만원'
WHERE id = '8180553';

-- 나주애향장례식장 (나주애향장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실 사용료","detail":"분향실 사용료","price":1350000,"priceDisplay":"135만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실 사용료","detail":"분향실 사용료","price":550000,"priceDisplay":"55만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실 사용료","detail":"분향실 사용료","price":950000,"priceDisplay":"95만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"안치료","price":300000,"priceDisplay":"30만원"}]'::jsonb,
    price_range = '빈소 55~135만원 / 안치실 30만원'
WHERE id = '27293829';

-- 예산종합병원장례식장 (예산종합병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '안치실 10만원'
WHERE id = '12177489';

-- 성모장례식장 (성모장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료","detail":"50평형(1실/24시간 기준","price":500000,"priceDisplay":"50만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료","detail":"40평형(1실/24시간 기준","price":400000,"priceDisplay":"40만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료","detail":"40평형(1실/24시간 기준","price":400000,"priceDisplay":"40만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일/24시간 기준","price":75000,"priceDisplay":"8만원"}]'::jsonb,
    price_range = '빈소 40~50만원 / 안치실 8만원'
WHERE id = '8887278';

-- 세명병원장례식장 (세명병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"안치료/1일 기준","price":100000,"priceDisplay":"10만원"},{"category":"안치실이용료","subCategory":"기타","name":"1일/24시간","detail":"약5평","price":72000,"priceDisplay":"7만원"}]'::jsonb,
    price_range = '안치실 7만원'
WHERE id = '1785478653';

-- 강동경희대학교병원장례식장 (강동경희대학교병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소사용료 (접객실료포함)","detail":"65평형 (214.9㎡/1일 시간당 / 59000원)","price":1416000,"priceDisplay":"142만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소사용료 (접객실료포함)","detail":"62평형 (205㎡/1일 시간당 / 53000원)","price":1272000,"priceDisplay":"127만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소사용료 (접객실료포함)","detail":"56평형 (185.1㎡/1일 시간당 / 45000원)","price":1080000,"priceDisplay":"108만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소사용료 (접객실료포함)","detail":"49평형 (162㎡/1일 시간당 / 40000원)","price":960000,"priceDisplay":"96만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소사용료 (접객실료포함)","detail":"36평형 (119㎡/1일 시간당 / 24000원)","price":576000,"priceDisplay":"58만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소사용료 (접객실료포함)","detail":"45평형 (148.8㎡/1일 시간당 / 34000원)","price":816000,"priceDisplay":"82만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소사용료 (접객실료포함)","detail":"40평형 (132.2㎡/1일 시간당 / 28000원)","price":672000,"priceDisplay":"67만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소사용료 (접객실료포함)","detail":"75평형 (247.9㎡/1일 시간당 / 68000원)","price":1632000,"priceDisplay":"163만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"어린이 (7~13세) (1일 시간당 / 2800원)","price":67200,"priceDisplay":"7만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"유아 (1~6세) (1일 시간당 / 2200원)","price":52800,"priceDisplay":"5만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"성인 (14세 이상) (1일 시간당 / 3300원)","price":79200,"priceDisplay":"8만원"}]'::jsonb,
    price_range = '빈소 58~163만원 / 안치실 5만원'
WHERE id = '21401763';

-- 거금장례식장 (거금장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"사용료","detail":"객실사용료(1일)","price":250000,"priceDisplay":"25만원"},{"category":"안치실이용료","subCategory":"일반","name":"사용료","detail":"안치실사용료(1일)","price":50000,"priceDisplay":"5만원"}]'::jsonb,
    price_range = '빈소 25만원 / 안치실 5만원'
WHERE id = '8780837';

-- 도계장례식장 (도계장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 빈소 임대료","detail":"1실/1회(도계지역주민만이용가능)","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 10만원'
WHERE id = '23792190';

-- 속초동해장례식장 (속초동해장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료(시간당)","detail":"30제곱미터","price":3000,"priceDisplay":"3,000원"}]'::jsonb,
    price_range = '안치실 0만원'
WHERE id = '853023317';

-- 좌천봉생병원 장례식장 (봉생병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장임대료","detail":"3호 (1일은 12시간부터 24시까지 기준)","price":300000,"priceDisplay":"30만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장임대료","detail":"2호 (1일은 12시간부터 24시까지 기준)","price":500000,"priceDisplay":"50만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장임대료","detail":"1호 (1일은 12시간부터 24시까지 기준)","price":600000,"priceDisplay":"60만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실이용료","detail":"1일은 12시간부터 24시까지 기준","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 30~60만원 / 안치실 10만원'
WHERE id = '11057552';

-- 녹동농협 장례식장 (녹동농협 장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"2분향소접객실","detail":"시간당","price":40000,"priceDisplay":"4만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"1분향소접객실","detail":"시간당","price":40000,"priceDisplay":"4만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"3분향소접객실","detail":"시간당","price":40000,"priceDisplay":"4만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 4만원 / 안치실 10만원'
WHERE id = '26838827';

-- 옥당장례식장 (옥당장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"접객실","name":"조객실","detail":"1일기준(50평)(세액별도)","price":500000,"priceDisplay":"50만원"},{"category":"안치실이용료","subCategory":"기타","name":"영안실","detail":"1일기준(세액별도)","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 50만원 / 안치실 10만원'
WHERE id = '9296484';

-- 삼일병원장례식장 (삼일병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"염습실","detail":"1회 이용료","price":300000,"priceDisplay":"30만원"}]'::jsonb,
    price_range = '안치실 30만원'
WHERE id = '21633447';

-- 여수장례식장 (여수장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"기타","name":"안치실","detail":"시간","price":9750,"priceDisplay":"9,750원"}]'::jsonb,
    price_range = '안치실 1만원'
WHERE id = '15722324';

-- 청기와장례식장 송림점 (청기와장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실사용료","detail":"1실/24시간기준","price":120000,"priceDisplay":"12만원"}]'::jsonb,
    price_range = '안치실 12만원'
WHERE id = '8108689';

-- 소망장례식장 (소망장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실료/102호실","detail":"35평/1실/1일기준","price":265000,"priceDisplay":"27만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실료/202호실","detail":"45평/1실/1일기준","price":465000,"priceDisplay":"47만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실료/201호특실","detail":"115평/3실/1일기준","price":665000,"priceDisplay":"67만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실료/101호실","detail":"75평/1실/1일기준","price":565000,"priceDisplay":"57만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실료","detail":"1일기준","price":120000,"priceDisplay":"12만원"}]'::jsonb,
    price_range = '빈소 27~67만원 / 안치실 12만원'
WHERE id = '752512962';

-- 주문진장례식장 (주문진장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"접객실","name":"접객실","detail":"","price":9000,"priceDisplay":"9,000원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"","price":3000,"priceDisplay":"3,000원"}]'::jsonb,
    price_range = '빈소 1만원 / 안치실 0만원'
WHERE id = '1856817302';

-- 고창고인돌장례식장 (고인돌장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1일","price":70000,"priceDisplay":"7만원"}]'::jsonb,
    price_range = '안치실 7만원'
WHERE id = '9935284';

-- 산청경호장례식장 (산청경호장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1일","price":80000,"priceDisplay":"8만원"}]'::jsonb,
    price_range = '안치실 8만원'
WHERE id = '865624876';

-- 삼천포시민장례식장 (삼천포장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"기타","name":"안치실 이용료","detail":"시간당","price":4000,"priceDisplay":"4,000원"}]'::jsonb,
    price_range = '안치실 0만원'
WHERE id = '26806081';

-- 신천연합병원 장례식장 (신천연합병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"기타","name":"시설임대료","detail":"1시간 안치료","price":5000,"priceDisplay":"5,000원"},{"category":"안치실이용료","subCategory":"기타","name":"시설임대료","detail":"1일 안치료","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '안치실 1만원'
WHERE id = '25083561';

-- 천안의료원장례식장 (천안의료원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향소 접객실 사용료","detail":"일반2호실(1일)","price":312000,"priceDisplay":"31만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향소 접객실 사용료","detail":"일반1호실(1일)","price":408000,"priceDisplay":"41만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향소 접객실 사용료","detail":"일반3호실(1일)","price":312000,"priceDisplay":"31만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향소 접객실 사용료","detail":"특5호실(1일)","price":576000,"priceDisplay":"58만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향소 접객실 사용료","detail":"특6호실(1일)","price":576000,"priceDisplay":"58만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향소 접객실 사용료","detail":"일반4호실(1일)","price":312000,"priceDisplay":"31만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실 사용료","detail":"안치(1일)","price":48000,"priceDisplay":"5만원"}]'::jsonb,
    price_range = '빈소 31~58만원 / 안치실 5만원'
WHERE id = '17525431';

-- 화순장례식장 (화순장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일","price":80000,"priceDisplay":"8만원"}]'::jsonb,
    price_range = '안치실 8만원'
WHERE id = '8993777';

-- 곡성장례식장 (곡성장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일","price":80000,"priceDisplay":"8만원"}]'::jsonb,
    price_range = '안치실 8만원'
WHERE id = '8189912';

-- 코리아병원장례식장 (코리아병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일","price":84000,"priceDisplay":"8만원"},{"category":"안치실이용료","subCategory":"기타","name":"빈소임대료","detail":"3호실/1일","price":360000,"priceDisplay":"36만원"}]'::jsonb,
    price_range = '안치실 8만원'
WHERE id = '15329726';

-- 한국병원장례식장 ((주)한국효려(한국병원장례식장))
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료(5)","detail":"1실/24시간 기준","price":500000,"priceDisplay":"50만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료(2)","detail":"1실/24시간 기준","price":900000,"priceDisplay":"90만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료(3)","detail":"1실/24시간 기준","price":700000,"priceDisplay":"70만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료(1)","detail":"1실/24시간 기준","price":1000000,"priceDisplay":"100만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일/24시간 기준","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 50~100만원 / 안치실 10만원'
WHERE id = '25083449';

-- 금호장례식장 (금호장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향소_70평형(1층)","detail":"시간당","price":40000,"priceDisplay":"4만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향소_70평형(1층)","detail":"2박3일","price":1400000,"priceDisplay":"140만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향소_100평형(2층)","detail":"2박3일","price":1600000,"priceDisplay":"160만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향소_100평형(2층)","detail":"시간당","price":45000,"priceDisplay":"5만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1일(24시간 기준)","price":60000,"priceDisplay":"6만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"2박3일","price":150000,"priceDisplay":"15만원"}]'::jsonb,
    price_range = '빈소 4~160만원 / 안치실 6만원'
WHERE id = '20176812';

-- 가톨릭대학교 부천성모병원 장례식장 (부천성모병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장임대료(68평형)","detail":"1실(24시간기준)","price":972000,"priceDisplay":"97만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장임대료(157평형)","detail":"1실(24시간기준)","price":2172000,"priceDisplay":"217만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장임대료(38평형)","detail":"1실(24시간기준)","price":516000,"priceDisplay":"52만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1실/24시간 기준","price":96000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 52~217만원 / 안치실 10만원'
WHERE id = '11468088';

-- 완도장례식장 (완도장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"분향소 안치실 포함","detail":"시간당","price":10000,"priceDisplay":"1만원"}]'::jsonb,
    price_range = '안치실 1만원'
WHERE id = '20636330';

-- 춘천장례식장 (춘천장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"201호/202호 통합","detail":"빈소접객실유족실화장실-161평/1시간","price":65000,"priceDisplay":"7만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"402호","detail":"빈소접객실유족실화장실-87평/1시간","price":40000,"priceDisplay":"4만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"301호","detail":"빈소접객실유족실화장실-72평/1시간","price":30000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"401호","detail":"빈소접객실유족실화장실-72평/1시간","price":30000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"302호","detail":"빈소접객실유족실화장실-87평/1시간","price":40000,"priceDisplay":"4만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"안치1구/1시간","price":3000,"priceDisplay":"3,000원"}]'::jsonb,
    price_range = '빈소 3~7만원 / 안치실 0만원'
WHERE id = '1753573316';

-- 여천장례식장 (여천장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"시간당","price":9750,"priceDisplay":"9,750원"}]'::jsonb,
    price_range = '안치실 1만원'
WHERE id = '27324273';

-- 새마을장례식장 (새마을장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 이용료","detail":"1일","price":700000,"priceDisplay":"70만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일","price":70000,"priceDisplay":"7만원"}]'::jsonb,
    price_range = '빈소 70만원 / 안치실 7만원'
WHERE id = '7931890';

-- 근로복지공단인천병원 장례식장 (근로복지공단 인천병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"시신안치료","detail":"1일(24시간)","price":40000,"priceDisplay":"4만원"},{"category":"안치실이용료","subCategory":"일반","name":"시신안치료","detail":"1시간","price":1670,"priceDisplay":"1,670원"}]'::jsonb,
    price_range = '안치실 0만원'
WHERE id = '17573815';

-- 보성우리장례식장 (보성우리장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실및접객실사용료일반","detail":"1일","price":200000,"priceDisplay":"20만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실및접객실사용료 특실","detail":"1일","price":300000,"priceDisplay":"30만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일","price":60000,"priceDisplay":"6만원"}]'::jsonb,
    price_range = '빈소 20~30만원 / 안치실 6만원'
WHERE id = '14650841';

-- 경기도의료원 이천병원 장례식장 (경기도의료원 이천병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소사용료(132㎡)(매화2)","detail":"시간당","price":25000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소사용료(132㎡)(매화3)","detail":"시간당","price":25000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소사용료(132㎡)(매화1)","detail":"시간당","price":25000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소사용료(314㎡)(목련특실)","detail":"시간당","price":40000,"priceDisplay":"4만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소사용료(118㎡)(국화8)","detail":"시간당","price":23000,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소사용료(112㎡)(국화7)","detail":"시간당","price":20000,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소사용료(165㎡)(국화6)","detail":"시간당","price":27000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소사용료(132㎡)(매화5)","detail":"시간당","price":25000,"priceDisplay":"3만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"시간당","price":3000,"priceDisplay":"3,000원"}]'::jsonb,
    price_range = '빈소 2~4만원 / 안치실 0만원'
WHERE id = '14650910';

-- 삼봉장례식장 (삼봉장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소+접객실 401호실 1실/24시간 기준","detail":"1일 .200평","price":2200000,"priceDisplay":"220만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소+접객실 302호실 1실/24시간 기준","detail":"1일 .150평","price":1300000,"priceDisplay":"130만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소+접객실 201호실 1실/24시간 기준","detail":"1일 .150평","price":1300000,"priceDisplay":"130만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소+접객실 301호실 1실/24시간 기준","detail":"1일 .150평","price":1300000,"priceDisplay":"130만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일","price":80000,"priceDisplay":"8만원"},{"category":"안치실이용료","subCategory":"일반","name":"약품처리비","detail":"회","price":250000,"priceDisplay":"25만원"}]'::jsonb,
    price_range = '빈소 130~220만원 / 안치실 8만원'
WHERE id = '785984070';

-- 남양주한양병원 장례식장 (남양주한양병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"시간","price":5000,"priceDisplay":"5,000원"}]'::jsonb,
    price_range = '안치실 1만원'
WHERE id = '14082176';

-- 용인제일메디병원 장례식장 (용인제일메디장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"고인안치냉장고","detail":"안치료(1일)","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '안치실 10만원'
WHERE id = '1309424430';

-- 함평농협장례식장 (함평농협장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"1분향실5분향실","detail":"1시간당","price":25000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"2분향실3분향실","detail":"1시간당","price":20000,"priceDisplay":"2만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1일","price":70000,"priceDisplay":"7만원"}]'::jsonb,
    price_range = '빈소 2~3만원 / 안치실 7만원'
WHERE id = '17385302';

-- 금강병원장례식장 (금강병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"접객실","name":"2분향소","detail":"접객실(시간당)","price":10000,"priceDisplay":"1만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"안치료(시간당)","price":3000,"priceDisplay":"3,000원"}]'::jsonb,
    price_range = '빈소 1만원 / 안치실 0만원'
WHERE id = '14650864';

-- 보람의정부장례식장 (보람의정부장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"VIP1호실  빈소 및 접객실 (160평)","detail":"1시간","price":118750,"priceDisplay":"12만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"VIP2호실  빈소 및 접객실 (145평)","detail":"1시간","price":108000,"priceDisplay":"11만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"일반 4567호실 빈소 및 접객실 (67평)","detail":"1시간","price":50000,"priceDisplay":"5만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"일반 8호실 빈소 및 접객실 (46평)","detail":"1시간","price":17500,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"VIP3호실  빈소 및 접객실 (107평)","detail":"1시간","price":79000,"priceDisplay":"8만원"},{"category":"안치실이용료","subCategory":"염습실/입관실","name":"입관실 사용료","detail":"종교단체상조회가족입관시","price":300000,"priceDisplay":"30만원"},{"category":"안치실이용료","subCategory":"기타","name":"사체 보관","detail":"1시간","price":5000,"priceDisplay":"5,000원"}]'::jsonb,
    price_range = '빈소 2~12만원 / 안치실 1만원'
WHERE id = '9040638';

-- 광주일곡병원 장례식장 (일곡병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장임대료(일반)","detail":"1일/24시간 기준","price":700000,"priceDisplay":"70만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장임대료(특)","detail":"1일/24시간 기준","price":900000,"priceDisplay":"90만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일/24시간 기준","price":200000,"priceDisplay":"20만원"}]'::jsonb,
    price_range = '빈소 70~90만원 / 안치실 20만원'
WHERE id = '1461010359';

-- 홍익병원장례식장 (홍익병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1시간기준","price":5000,"priceDisplay":"5,000원"}]'::jsonb,
    price_range = '안치실 1만원'
WHERE id = '22529512';

-- 벌교장례식장 (벌교장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"접객실분향실","detail":"시간당","price":30000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"접객실분향실","detail":"벌교1호실2호실 (통합1일당)","price":500000,"priceDisplay":"50만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"접객실분향실","detail":"벌교1호(1일당)","price":400000,"priceDisplay":"40만원"},{"category":"안치실이용료","subCategory":"일반","name":"고인안치료","detail":"일","price":50000,"priceDisplay":"5만원"}]'::jsonb,
    price_range = '빈소 3~50만원 / 안치실 5만원'
WHERE id = '11068918';

-- 기장병원장례식장 (기장병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"특5호","detail":"1실/24시간 기준","price":500000,"priceDisplay":"50만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특6호","detail":"1실/24시간 기준","price":500000,"priceDisplay":"50만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"3호","detail":"1실/24시간 기준","price":400000,"priceDisplay":"40만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"2호","detail":"1실/24시간 기준","price":400000,"priceDisplay":"40만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"1호","detail":"1실/24시간 기준","price":400000,"priceDisplay":"40만원"}]'::jsonb,
    price_range = '빈소 40~50만원'
WHERE id = '16606930';

-- 부안호남장례식장 (부안호남장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"시간당","price":5000,"priceDisplay":"5,000원"}]'::jsonb,
    price_range = '안치실 1만원'
WHERE id = '12808398';

-- 봉동호스피스장례식장 (봉동호스피스장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료 (별관 특)","detail":"1실/3일간","price":1800000,"priceDisplay":"180만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료 (202호)","detail":"1실/3일간","price":1400000,"priceDisplay":"140만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료 (101호)","detail":"1실/3일간","price":1200000,"priceDisplay":"120만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료 (201호)","detail":"1실/3일간","price":700000,"priceDisplay":"70만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일","price":80000,"priceDisplay":"8만원"}]'::jsonb,
    price_range = '빈소 70~180만원 / 안치실 8만원'
WHERE id = '7902375';

-- 동래봉생병원 SKY보람장례식장 (동래봉생병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장임대료(일반)","detail":"1호실 / 45평 (국가유공자50% DC)","price":300000,"priceDisplay":"30만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장임대료(일반)","detail":"1호실 / 45평 (국가유공자50% DC)","price":300000,"priceDisplay":"30만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장임대료(특)","detail":"3호실 / 55평 (국가유공자50% DC)","price":400000,"priceDisplay":"40만원"}]'::jsonb,
    price_range = '빈소 30~40만원'
WHERE id = '17093591';

-- 진부장례식장 (진부장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"접객실","name":"식당사용료","detail":"1일","price":96000,"priceDisplay":"10만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실사용료","detail":"1일","price":32000,"priceDisplay":"3만원"}]'::jsonb,
    price_range = '빈소 10만원 / 안치실 3만원'
WHERE id = '18710510';

-- 금강쉴낙원장례식장 (금강쉴낙원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실 사용료","detail":"1일 / 시간 : 2100원","price":50400,"priceDisplay":"5만원"}]'::jsonb,
    price_range = '안치실 5만원'
WHERE id = '719539229';

-- 유성선병원 장례식장 (유성선병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소/접객실 사용료1일","detail":"2호실/40평","price":360000,"priceDisplay":"36만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소/접객실/휴게실사요료1일","detail":"1호실/100평","price":960000,"priceDisplay":"96만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소/접객실/휴게실사용료1일","detail":"vip1.3호/160평","price":1600000,"priceDisplay":"160만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소/접객실/휴게실사용료1일","detail":"vip5호 / 180평","price":1800000,"priceDisplay":"180만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소/접객실/휴게실사용료1일","detail":"vip2호/ 140평","price":1400000,"priceDisplay":"140만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일","price":48000,"priceDisplay":"5만원"}]'::jsonb,
    price_range = '빈소 36~180만원 / 안치실 5만원'
WHERE id = '9312327';

-- 인월장례식장 (인월장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"접객실","name":"접견실 임대료","detail":"1일","price":840000,"priceDisplay":"84만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치냉장고","detail":"1일","price":200000,"priceDisplay":"20만원"}]'::jsonb,
    price_range = '빈소 84만원 / 안치실 20만원'
WHERE id = '26492112';

-- 나주효사랑병원 장례식장 (나주효사랑병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"접객실분향실","detail":"1일","price":800000,"priceDisplay":"80만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치냉장고 사용","detail":"1일","price":50000,"priceDisplay":"5만원"}]'::jsonb,
    price_range = '빈소 80만원 / 안치실 5만원'
WHERE id = '25083513';

-- 창선공익장례식장 (창선공익장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"기타","name":"안치(냉장시설)","detail":"1시간기준","price":5500,"priceDisplay":"5,500원"}]'::jsonb,
    price_range = '안치실 1만원'
WHERE id = '18722870';

-- 순창현대장례식장 (순창현대장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"시체안치실","detail":"3일기준","price":240000,"priceDisplay":"24만원"}]'::jsonb,
    price_range = '안치실 24만원'
WHERE id = '11408328';

-- 새미소요양병원장례식장 (새미소요양병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 안치사용료","detail":"장례식장 안치사용료 / 24시간","price":60000,"priceDisplay":"6만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 빈소사용료","detail":"장례식장 빈소사용료 / 시간","price":20000,"priceDisplay":"2만원"}]'::jsonb,
    price_range = '빈소 2~6만원'
WHERE id = '1056137430';

-- 남동스카이장례식장 (남동스카이장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"70평(7층 특701호)","detail":"232㎡(70평형) 52명 / 1일 24시간 기준","price":1188000,"priceDisplay":"119만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"202평(301호+302호 통합)","detail":"668㎡(202평형) 200명 / 1일 24시간 기준","price":2428800,"priceDisplay":"243만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"97평(3층 302호)","detail":"319㎡(97평형) 100명 / 1일 24시간 기준","price":1135200,"priceDisplay":"114만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"126평(4층 VIP실)","detail":"416㎡(126평형) 140명 / 1일 24시간 기준","price":2059200,"priceDisplay":"206만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"120평(5층 특501호)","detail":"396㎡(120평형) 120명 / 1일 24시간 기준","price":1927200,"priceDisplay":"193만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"203평(201호+202호 통합)","detail":"673㎡(203평형) 200명 / 1일 24시간 기준","price":2428800,"priceDisplay":"243만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"107평(2층 201호)","detail":"356㎡(107평형) 100명 / 1일 24시간 기준","price":1293600,"priceDisplay":"129만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"105평(3층 301호)","detail":"349㎡(105평형) 100명 / 1일 24시간 기준","price":1293600,"priceDisplay":"129만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"55평(2층 203호)","detail":"181㎡(55평형) 34명 / 1일 24시간 기준","price":607200,"priceDisplay":"61만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"96평(2층 202호)","detail":"317㎡(96평형) 100명 / 1일 24시간 기준","price":1135200,"priceDisplay":"114만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"55평(3층 303호)","detail":"180㎡(55평형) 34명 / 1일 24시간 기준","price":607200,"priceDisplay":"61만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"72평(6층 특601호)","detail":"239㎡(72평형) 68명 / 1일 24시간 기준","price":1346400,"priceDisplay":"135만원"},{"category":"안치실이용료","subCategory":"일반","name":"1일(6000원 X 24H)","detail":"","price":144000,"priceDisplay":"14만원"}]'::jsonb,
    price_range = '빈소 61~243만원 / 안치실 14만원'
WHERE id = '2112330260';

-- 쉴낙원 당진장례식장 (쉴낙원 당진 장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"기타","name":"안치실","detail":"","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '안치실 10만원'
WHERE id = '12465722';

-- 반송장례식장 (반송장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료(1호)","detail":"1실 24시간 기준-일반(26평)","price":250000,"priceDisplay":"25만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료(2호)","detail":"1실 24시간 기준-일반(37평)","price":350000,"priceDisplay":"35만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료(3호)","detail":"1실 24시간 기준-일반(16평)","price":100000,"priceDisplay":"10만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료(3호)","detail":"1실 24시간 기준-수급자/ 무료제공","price":100000,"priceDisplay":"10만원"},{"category":"안치실이용료","subCategory":"일반","name":"고인.안치실","detail":"1일24시간 기준","price":100000,"priceDisplay":"10만원"},{"category":"안치실이용료","subCategory":"기타","name":"염습실사용료","detail":"장례식장.자체행사시  무료","price":200000,"priceDisplay":"20만원"}]'::jsonb,
    price_range = '빈소 10~35만원 / 안치실 10만원'
WHERE id = '10046707';

-- 대전선병원 장례식장 (대전선병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"특1빈소/접객실임대료","detail":"1실/24시간 기준","price":744000,"priceDisplay":"74만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특2빈소/접객실임대료","detail":"1실/24시간 기준","price":576000,"priceDisplay":"58만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일기준","price":48000,"priceDisplay":"5만원"}]'::jsonb,
    price_range = '빈소 58~74만원 / 안치실 5만원'
WHERE id = '20713142';

-- 대연장례식장 (대연장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1일","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '안치실 10만원'
WHERE id = '491812691';

-- 우리요양병원 장례식장 (우리요양병원 장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"국화실(특실)","detail":"95평(1시간)","price":35000,"priceDisplay":"4만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"백합실","detail":"65평(1시간)","price":30000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"목련실","detail":"65평(1시간)","price":30000,"priceDisplay":"3만원"},{"category":"안치실이용료","subCategory":"일반","name":"일반사체","detail":"1시간","price":5000,"priceDisplay":"5,000원"},{"category":"안치실이용료","subCategory":"기타","name":"특수사체","detail":"1시간","price":5000,"priceDisplay":"5,000원"}]'::jsonb,
    price_range = '빈소 3~4만원 / 안치실 1만원'
WHERE id = '1193894906';

-- 서논산장례식장 (서논산장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실(1일)","detail":"1실1일 24시간기준","price":150000,"priceDisplay":"15만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료(1일)","detail":"1실1일 24시간기준","price":150000,"priceDisplay":"15만원"}]'::jsonb,
    price_range = '빈소 15만원 / 안치실 15만원'
WHERE id = '9861601';

-- 청양농협 장례식장 (청양농협 장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1실/시간당","price":4000,"priceDisplay":"4,000원"}]'::jsonb,
    price_range = '안치실 0만원'
WHERE id = '8099845';

-- 웅천장례식장 (웅천장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실 + 빈소","detail":"1.2.3 호실 (각 100평 이상)","price":44000,"priceDisplay":"4만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"안치료","price":5000,"priceDisplay":"5,000원"}]'::jsonb,
    price_range = '빈소 4만원 / 안치실 1만원'
WHERE id = '13011481';

-- 대영장례식장 (대영장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실접객실  시간사용료","detail":"사용료1시간","price":55000,"priceDisplay":"6만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"1 분향실접객실  사용료","detail":"사용료1일(24시간)","price":700000,"priceDisplay":"70만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"2 분향실접객실 사용료","detail":"사용료1일(24시간)","price":400000,"priceDisplay":"40만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"2 분향실접객실 사용료","detail":"사용료1시간","price":35000,"priceDisplay":"4만원"},{"category":"안치실이용료","subCategory":"일반","name":"발인실 사용료","detail":"1회","price":100000,"priceDisplay":"10만원"},{"category":"안치실이용료","subCategory":"일반","name":"시신 안치실     사용료","detail":"사용료1일(24시간)","price":100000,"priceDisplay":"10만원"},{"category":"안치실이용료","subCategory":"일반","name":"시신 안치실     시간사용료","detail":"사용료1시간","price":10000,"priceDisplay":"1만원"}]'::jsonb,
    price_range = '빈소 4~70만원 / 안치실 1만원'
WHERE id = '8275183';

-- 동남권원자력의학원장례식장 (동남권원자력의학원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일/24시간기준","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '안치실 10만원'
WHERE id = '27399139';

-- 숭례관장례식장 (숭례관장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향소및 접객실 (매화실)","detail":"24시간기준","price":600000,"priceDisplay":"60만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향소및 접객실 (난실)","detail":"24시간기준","price":552000,"priceDisplay":"55만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향소및 접객실 (모란실)","detail":"24시간기준","price":480000,"priceDisplay":"48만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향소 및 접객실 (국화실)","detail":"24시간 기준","price":720000,"priceDisplay":"72만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실 사용료","detail":"1일기준","price":120000,"priceDisplay":"12만원"}]'::jsonb,
    price_range = '빈소 48~72만원 / 안치실 12만원'
WHERE id = '17148489';

-- 정다운요양병원 장례식장 (정다운 장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"특실","detail":"빈소+접객실(1일기준)","price":400000,"priceDisplay":"40만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"일반실","detail":"빈소+접객실(1일기준)","price":300000,"priceDisplay":"30만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실(3일1회기준)","detail":"1회초과시 1일5만원","price":150000,"priceDisplay":"15만원"}]'::jsonb,
    price_range = '빈소 30~40만원 / 안치실 15만원'
WHERE id = '21208975';

-- 서천장례식장 (서천장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실5호","detail":"시간당","price":18600,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실3호","detail":"시간당","price":23000,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실2호","detail":"시간당","price":25000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실특1호","detail":"시간당","price":29600,"priceDisplay":"3만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"시간당","price":6000,"priceDisplay":"6,000원"},{"category":"안치실이용료","subCategory":"일반","name":"수시초비","detail":"1회","price":150000,"priceDisplay":"15만원"}]'::jsonb,
    price_range = '빈소 2~3만원 / 안치실 1만원'
WHERE id = '9158307';

-- 동두천장례식장 (동두천장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"","name":"일","detail":"1","price":120000,"priceDisplay":"12만원"}]'::jsonb,
    price_range = '안치실 12만원'
WHERE id = '8326438';

-- 천안장례식장 (천안장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료      중","detail":"1시간당","price":20000,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료   특실","detail":"1시간당","price":40000,"priceDisplay":"4만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료      대","detail":"1시간당","price":30000,"priceDisplay":"3만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"시간당","price":4000,"priceDisplay":"4,000원"}]'::jsonb,
    price_range = '빈소 2~4만원 / 안치실 0만원'
WHERE id = '8541535';

-- 포항시민장례식장 (포항시민전문장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실","detail":"9만 7만 5만","price":50000,"priceDisplay":"5만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일","price":48000,"priceDisplay":"5만원"}]'::jsonb,
    price_range = '빈소 5만원 / 안치실 5만원'
WHERE id = '21304081';

-- 신광천장례식장 (신광천장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"특 4 호실","detail":"145","price":30000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특 3 호실","detail":"208","price":31000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특 2 호실","detail":"215","price":33000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특 1 호실","detail":"250","price":35000,"priceDisplay":"4만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"100","price":3000,"priceDisplay":"3,000원"}]'::jsonb,
    price_range = '빈소 3~4만원 / 안치실 0만원'
WHERE id = '390683188';

-- 합덕장례식장 (합덕장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례시설 사용료","detail":"1실/24시간기준(90평)","price":960000,"priceDisplay":"96만원"}]'::jsonb,
    price_range = '빈소 96만원'
WHERE id = '10919361';

-- 성남중앙병원 장례식장 (성남중앙병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료","detail":"30평형(1실/24시간 기준)50%할인","price":400000,"priceDisplay":"40만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료","detail":"40평형(1실/24시간 기준)50%할인","price":550000,"priceDisplay":"55만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료","detail":"50평형(1실/24시간 기준)50%할인","price":750000,"priceDisplay":"75만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료","detail":"28평형(1실/24시간 기준)50%할인","price":380000,"priceDisplay":"38만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료","detail":"90평형(1실/24시간 기준)50%할인","price":950000,"priceDisplay":"95만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일/24시간 기준","price":95000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 38~95만원 / 안치실 10만원'
WHERE id = '11139510';

-- 공주장례식장 (공주장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장사용료","detail":"(일반)102빈소/1실60평형/30000원","price":720000,"priceDisplay":"72만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장사용료","detail":"(일반)202빈소/1실/50평형/시간당20000원","price":480000,"priceDisplay":"48만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장사용료","detail":"(일반)203빈소/1실60평형/시간당30000원","price":720000,"priceDisplay":"72만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장사용료","detail":"(일반)103빈소/1실/60평형/30000원","price":720000,"priceDisplay":"72만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장사용료","detail":"101201빈소/1실/100평형/시간당40000원","price":960000,"priceDisplay":"96만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일당","price":45000,"priceDisplay":"5만원"}]'::jsonb,
    price_range = '빈소 48~96만원 / 안치실 5만원'
WHERE id = '493642761';

-- 서울성모장례식장 (서울성모장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소 사용료(㎡)","detail":"106","price":600000,"priceDisplay":"60만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소 사용료(㎡)","detail":"168","price":1188000,"priceDisplay":"119만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소 사용료(㎡)","detail":"231","price":1788000,"priceDisplay":"179만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소 사용료(㎡)","detail":"396","price":3372000,"priceDisplay":"337만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소 사용료(㎡)","detail":"158","price":1080000,"priceDisplay":"108만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소 사용료(㎡)","detail":"297","price":2580000,"priceDisplay":"258만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소 사용료(㎡)","detail":"528","price":4596000,"priceDisplay":"460만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소 사용료(㎡)","detail":"132","price":852000,"priceDisplay":"85만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소 사용료(㎡)","detail":"142","price":936000,"priceDisplay":"94만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소 사용료(㎡)","detail":"264","price":2112000,"priceDisplay":"211만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소 사용료(㎡)","detail":"287","price":2316000,"priceDisplay":"232만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소 사용료(㎡)","detail":"208","price":1560000,"priceDisplay":"156만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소 사용료(㎡)","detail":"495","price":4200000,"priceDisplay":"420만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실 임대료","detail":"안치료","price":96000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 60~460만원 / 안치실 10만원'
WHERE id = '17572350';

-- 진천장례식장 (진천장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료(특실)","detail":"1실/24시간 기준","price":800000,"priceDisplay":"80만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료(일반)","detail":"1실/24시간 기준","price":600000,"priceDisplay":"60만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일/24시간 기준","price":60000,"priceDisplay":"6만원"}]'::jsonb,
    price_range = '빈소 60~80만원 / 안치실 6만원'
WHERE id = '11396698';

-- 충주시민장례식장 ((주)시민장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1일","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '안치실 10만원'
WHERE id = '433621094';

-- 영동제일장례식장 (영동제일장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치시설","detail":"안치냉장(1일)","price":50000,"priceDisplay":"5만원"}]'::jsonb,
    price_range = '안치실 5만원'
WHERE id = '19622422';

-- 증평대한장례식장 (증평대한장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"3000/시간","price":72000,"priceDisplay":"7만원"}]'::jsonb,
    price_range = '안치실 7만원'
WHERE id = '26357102';

-- 부천세종병원 장례식장 (세종병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실임대료(1호실)","detail":"1시간기준","price":30000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실임대료(3호실)","detail":"1시간기준","price":12500,"priceDisplay":"1만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실임대료(2호실","detail":"1시간기준","price":21000,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실임대료(특실)","detail":"1시간기준","price":40000,"priceDisplay":"4만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1시간기준","price":5000,"priceDisplay":"5,000원"}]'::jsonb,
    price_range = '빈소 1~4만원 / 안치실 1만원'
WHERE id = '14650778';

-- 혜인요양병원장례식장 (혜인요양병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일기준","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '안치실 10만원'
WHERE id = '9639794';

-- 서석장례식장 (서석장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"기타","name":"1구당 1일기준","detail":"안치료","price":20000,"priceDisplay":"2만원"},{"category":"안치실이용료","subCategory":"기타","name":"1구당 1일 기준(관외자)","detail":"안치실","price":40000,"priceDisplay":"4만원"}]'::jsonb,
    price_range = '안치실 2만원'
WHERE id = '12994944';

-- 신화장례식장 (신화장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"3 4호실 임대료","detail":"45평형/1일:분향실 접객실 상주휴식실 포함(600000원)","price":25000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"1 2호실 임대료","detail":"55평형/1일:분향실 접객실 상주휴식실 포함(720000원)","price":30000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특실  임대료","detail":"75평형/1일:분향실 접객실 상주휴식실 포함(960000원)","price":40000,"priceDisplay":"4만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실 사용료","detail":"1구당/1일(120.000원)","price":5000,"priceDisplay":"5,000원"}]'::jsonb,
    price_range = '빈소 3~4만원 / 안치실 1만원'
WHERE id = '1199796262';

-- 울산하늘공원 장례식장 (울산하늘공원(장례식장))
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 이용료","detail":"빈소(201~204호) 1실당(24시간기준)-관내","price":112000,"priceDisplay":"11만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 이용료","detail":"빈소(205호) 1실당(24시간기준)-관내","price":137000,"priceDisplay":"14만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 이용료","detail":"가족 휴게실(24시간기준)-관외","price":60000,"priceDisplay":"6만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 이용료","detail":"빈소(205호) 1실당(24시간기준)-관외","price":274000,"priceDisplay":"27만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 이용료","detail":"가족 휴게실(24시간기준)-관내","price":30000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 이용료","detail":"빈소(201~204호) 1실당(24시간기준)-관외","price":224000,"priceDisplay":"22만원"},{"category":"안치실이용료","subCategory":"일반","name":"장례식장 이용료","detail":"안치실 1구당(24시간기준)-관내","price":40000,"priceDisplay":"4만원"},{"category":"안치실이용료","subCategory":"일반","name":"장례식장 이용료","detail":"안치실 1구당(24시간기준)-관외","price":80000,"priceDisplay":"8만원"}]'::jsonb,
    price_range = '빈소 3~27만원 / 안치실 4만원'
WHERE id = '27126819';

-- 여의도성모병원 장례식장 (여의도성모장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1실 / 1시간 기준 3400","price":96000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '안치실 10만원'
WHERE id = '12978247';

-- 태릉성심장례식장 (태릉성심장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일 (24시간기준)","price":96000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '안치실 10만원'
WHERE id = '24067864';

-- 강서장례식장 (강서장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료(65~80석)","detail":"무궁화실 1실 24시간 기준","price":744000,"priceDisplay":"74만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료(100석)","detail":"진달래실 1실 24시간 기준","price":840000,"priceDisplay":"84만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실(염습실)사용료","detail":"회당","price":300000,"priceDisplay":"30만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치냉장고사용료","detail":"시간당","price":5000,"priceDisplay":"5,000원"}]'::jsonb,
    price_range = '빈소 74~84만원 / 안치실 1만원'
WHERE id = '7933949';

-- 강서개화장례식장 (강서개화장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"기타","name":"안치실 사용료","detail":"안치료","price":144000,"priceDisplay":"14만원"}]'::jsonb,
    price_range = '안치실 14만원'
WHERE id = '27433455';

-- 독산장례식장 (독산장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"2호실","detail":"1시간(분향실접객실)","price":25000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"1호실","detail":"1시간(분향실접객실)","price":30000,"priceDisplay":"3만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1시간","price":9000,"priceDisplay":"9,000원"}]'::jsonb,
    price_range = '빈소 3~3만원 / 안치실 1만원'
WHERE id = '8263279';

-- 정읍호남장례식장 (정읍호남장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"시간당 11000원","price":11000,"priceDisplay":"1만원"}]'::jsonb,
    price_range = '안치실 1만원'
WHERE id = '1095387370';

-- 함양장례식장 (함양장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"24시간","price":80000,"priceDisplay":"8만원"}]'::jsonb,
    price_range = '안치실 8만원'
WHERE id = '9568500';

-- 화순전남대학교병원장례식장 (전남대학교병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료(2호실)_본원입원환자","detail":"1실/24시간 기준","price":350000,"priceDisplay":"35만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료(2호실)","detail":"1실/24시간 기준","price":500000,"priceDisplay":"50만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료(1호실)_본원입원환자","detail":"1실/24시간 기준","price":455000,"priceDisplay":"46만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료_본원입원환자","detail":"1실/24시간 기준","price":42000,"priceDisplay":"4만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1실/24시간 기준","price":60000,"priceDisplay":"6만원"}]'::jsonb,
    price_range = '빈소 35~50만원 / 안치실 4만원'
WHERE id = '8168477';

-- 홍천아산병원장례식장 (홍천아산병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치냉장고사용","detail":"시간당","price":3000,"priceDisplay":"3,000원"}]'::jsonb,
    price_range = '안치실 0만원'
WHERE id = '12278352';

-- 삼육서울병원 추모관 (삼육서울병원 추모관(구위생병원))
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"고인 안치료","detail":"1일","price":84000,"priceDisplay":"8만원"}]'::jsonb,
    price_range = '안치실 8만원'
WHERE id = '25913643';

-- 대전을지대학교병원 장례식장 (대전을지대학교병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"안치료","price":48000,"priceDisplay":"5만원"}]'::jsonb,
    price_range = '안치실 5만원'
WHERE id = '10672795';

-- 가야장례식장 (가야장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료2층(VIP)","detail":"시간당(1시간)","price":25000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료1층(VIP)","detail":"시간당(1시간)","price":20000,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료2층(특실)","detail":"시간당(1시간)","price":15000,"priceDisplay":"2만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"안치냉장고(1일기준)","price":100000,"priceDisplay":"10만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실 냉동기 사용료","detail":"안치시간~발인시간(1시간)","price":5000,"priceDisplay":"5,000원"}]'::jsonb,
    price_range = '빈소 2~3만원 / 안치실 1만원'
WHERE id = '8113106';

-- 사천시농협장례식장 (사천시농협장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일 24시간 기준(시간당 2916원)","price":70000,"priceDisplay":"7만원"}]'::jsonb,
    price_range = '안치실 7만원'
WHERE id = '27306816';

-- 김천시민장례식장 (김천시민장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"201호실","detail":"50평(1일)","price":600000,"priceDisplay":"60만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"202호실","detail":"35평(1일)","price":400000,"priceDisplay":"40만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특1호실","detail":"60평(1일)","price":700000,"priceDisplay":"70만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"2500 (시간)","price":60000,"priceDisplay":"6만원"}]'::jsonb,
    price_range = '빈소 40~70만원 / 안치실 6만원'
WHERE id = '1706743053';

-- 화성중앙종합병원 장례식장 (화성중앙종합병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실사용료","detail":"1일","price":72000,"priceDisplay":"7만원"}]'::jsonb,
    price_range = '안치실 7만원'
WHERE id = '14078666';

-- 보은농협장례식장 (보은농협장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"접객실 (3호실)","detail":"1일 78제곱미터","price":600000,"priceDisplay":"60만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"접객실 (1.2호실)","detail":"1일 100제곱미터","price":720000,"priceDisplay":"72만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1일","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 60~72만원 / 안치실 10만원'
WHERE id = '19301209';

-- 서울대학교병원장례식장 (분당서울대학교병원 장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료","detail":"49평(1실/24시간 기준)","price":936000,"priceDisplay":"94만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료","detail":"35평(1실/24시간 기준)","price":504000,"priceDisplay":"50만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료","detail":"80평(1실/24시간 기준)","price":1656000,"priceDisplay":"166만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료","detail":"54평(1실/24시간 기준)","price":1080000,"priceDisplay":"108만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료","detail":"47평(1실/24시간 기준)","price":900000,"priceDisplay":"90만원"},{"category":"안치실이용료","subCategory":"일반","name":"장례식장 안치료","detail":"(3.125 / 1시간 기준)","price":75000,"priceDisplay":"8만원"}]'::jsonb,
    price_range = '빈소 50~166만원 / 안치실 8만원'
WHERE id = '7935475';

-- 수성메트로병원 장례식장 (수성메트로병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1일(4000/1시간)","price":96000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '안치실 10만원'
WHERE id = '16541185';

-- 세화병원 장례식장 (세화병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장","detail":"102호(198㎡).","price":25000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장","detail":"예비용빈소(66㎡).","price":8333,"priceDisplay":"8,333원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장","detail":"101호(132㎡)","price":16666,"priceDisplay":"2만원"},{"category":"안치실이용료","subCategory":"기타","name":"안치실","detail":"안치실","price":4000,"priceDisplay":"4,000원"}]'::jsonb,
    price_range = '빈소 1~3만원 / 안치실 0만원'
WHERE id = '14650776';

-- 삼천포장례식장 (삼천포서울병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실사용료","detail":"1일","price":96000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '안치실 10만원'
WHERE id = '7928194';

-- 산청장례식장 (산청장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향소.접객실 101호","detail":"1일","price":800000,"priceDisplay":"80만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향소.접객실 201호(특실)","detail":"1일","price":1000000,"priceDisplay":"100만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향소.접객실 202호","detail":"1일","price":600000,"priceDisplay":"60만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1일","price":80000,"priceDisplay":"8만원"}]'::jsonb,
    price_range = '빈소 60~100만원 / 안치실 8만원'
WHERE id = '1965852050';

-- 천안충무병원 장례식장 (천안충무병원 국화원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료","detail":"1시간당","price":35000,"priceDisplay":"4만원"},{"category":"안치실이용료","subCategory":"일반","name":"시체안치료","detail":"1시간당","price":5000,"priceDisplay":"5,000원"}]'::jsonb,
    price_range = '빈소 4만원 / 안치실 1만원'
WHERE id = '9492841';

-- 충북대학교병원장례식장 (충북대학교병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1310원/시간","price":31440,"priceDisplay":"3만원"}]'::jsonb,
    price_range = '안치실 3만원'
WHERE id = '24067131';

-- 중앙대학교광명병원 장례식장 (중앙대학교광명병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"8호","detail":"125.6m2","price":1050000,"priceDisplay":"105만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"1호","detail":"134.5m2","price":1050000,"priceDisplay":"105만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"2호","detail":"134.8m2","price":1050000,"priceDisplay":"105만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"3호","detail":"148.7m2","price":1150000,"priceDisplay":"115만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특실","detail":"246.9m2","price":1700000,"priceDisplay":"170만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"6호","detail":"131.2m2","price":1050000,"priceDisplay":"105만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"7호","detail":"134.8m2","price":1050000,"priceDisplay":"105만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"5호","detail":"133.2m2","price":1050000,"priceDisplay":"105만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실이용료(일)","detail":"안치실이용료(일)","price":96000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 105~170만원 / 안치실 10만원'
WHERE id = '1016390975';

-- 포항e병원 장례식장 (포항e병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"2특실(분향실접객실)","detail":"1일당","price":618000,"priceDisplay":"62만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"1특실(분향실접객실)","detail":"1일당","price":714000,"priceDisplay":"71만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"5호실(분향실접객실)","detail":"1일당","price":386000,"priceDisplay":"39만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"3호실(분향실접객실)","detail":"1일당","price":618000,"priceDisplay":"62만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일당","price":50000,"priceDisplay":"5만원"}]'::jsonb,
    price_range = '빈소 39~71만원 / 안치실 5만원'
WHERE id = '8643384';

-- 김포우리병원 장례식장 (우리병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1시간","price":5000,"priceDisplay":"5,000원"}]'::jsonb,
    price_range = '안치실 1만원'
WHERE id = '27519156';

-- 문산장례식장 (문산장례문화원)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"","name":"안치","detail":"1일 / 일","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '안치실 10만원'
WHERE id = '20839196';

-- 밀양시민장례식장 (밀양시민장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"","name":"1일","detail":"안치료","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '안치실 10만원'
WHERE id = '473142419';

-- (유)동이리장례식장 ((유)동이리장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"특   실","detail":"분향실접객실상주방2로비등 200평(1시간당)","price":29000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"일반실","detail":"분향실접객실상주방1로비등 100평(1시간당)","price":19000,"priceDisplay":"2만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"안치고 및 부대시설(1시간당)","price":5000,"priceDisplay":"5,000원"}]'::jsonb,
    price_range = '빈소 2~3만원 / 안치실 1만원'
WHERE id = '17301433';

-- 임실군보건의료원장례식장 (임실군보건의료원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실.접객실","detail":"사용료","price":200000,"priceDisplay":"20만원"},{"category":"안치실이용료","subCategory":"기타","name":"안치료","detail":"사체","price":50000,"priceDisplay":"5만원"}]'::jsonb,
    price_range = '빈소 20만원 / 안치실 5만원'
WHERE id = '12607319';

-- 제일조은병원장례식장 (제일조은병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일","price":96000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '안치실 10만원'
WHERE id = '11735530';

-- 여천전남병원장례식장 (여천전남병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1시간","price":7000,"priceDisplay":"7,000원"}]'::jsonb,
    price_range = '안치실 1만원'
WHERE id = '11267367';

-- 마송장례식장 (마송장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일(24시간기준)","price":108000,"priceDisplay":"11만원"}]'::jsonb,
    price_range = '안치실 11만원'
WHERE id = '11663057';

-- 메디인병원 장례식장 (메디인병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"5호실","detail":"1일","price":600000,"priceDisplay":"60만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"3호실","detail":"1일","price":480000,"priceDisplay":"48만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"1호실","detail":"1일","price":840000,"priceDisplay":"84만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특2호실","detail":"1일","price":1200000,"priceDisplay":"120만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일","price":120000,"priceDisplay":"12만원"}]'::jsonb,
    price_range = '빈소 48~120만원 / 안치실 12만원'
WHERE id = '1629940747';

-- 한성병원장례식장 (한성병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실 사용료(7층 특분향실)","detail":"약60평(25000원/시간)","price":600000,"priceDisplay":"60만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실 사용료(8층VIP분향실)","detail":"약100평(37500원/시간)","price":900000,"priceDisplay":"90만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실 사용료(9층VIP분향실)","detail":"약100평(37500원/시간)","price":900000,"priceDisplay":"90만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치기 사용료(관외외국인*2배)","detail":"1일","price":50000,"priceDisplay":"5만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실 사용료","detail":"일","price":96000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 60~90만원 / 안치실 5만원'
WHERE id = '14650847';

-- 수원요양병원 장례식장 (수원요양병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료 /  1일당","detail":"","price":72000,"priceDisplay":"7만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료 / 1시간당","detail":"","price":3000,"priceDisplay":"3,000원"}]'::jsonb,
    price_range = '안치실 0만원'
WHERE id = '2027122842';

-- 센텀장례식장 (센텀장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"VIP실","detail":"405m2","price":1200000,"priceDisplay":"120만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"102호실","detail":"211m2","price":500000,"priceDisplay":"50만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"103호실","detail":"280m2","price":900000,"priceDisplay":"90만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"104호실","detail":"238m2","price":600000,"priceDisplay":"60만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"201호실","detail":"251m2","price":700000,"priceDisplay":"70만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"101호실","detail":"264m2","price":700000,"priceDisplay":"70만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"202호실","detail":"235m2","price":600000,"priceDisplay":"60만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"132.58m2","price":80000,"priceDisplay":"8만원"}]'::jsonb,
    price_range = '빈소 50~120만원 / 안치실 8만원'
WHERE id = '697097325';

-- 서울적십자병원장례식장 (서울적십자병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"시간당","price":4000,"priceDisplay":"4,000원"}]'::jsonb,
    price_range = '안치실 0만원'
WHERE id = '8429438';

-- 해남종합병원장례식장 (해남종합병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"1분향소/접객실","detail":"90PY/방1화장실1","price":700000,"priceDisplay":"70만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"VIP분향소/접객실","detail":"150PY/방2/거실1/화장실2/샤워실1","price":1100000,"priceDisplay":"110만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"2분향소/접객실","detail":"60PY/방1화장실1","price":450000,"priceDisplay":"45만원"},{"category":"안치실이용료","subCategory":"일반","name":"고인전용냉장고","detail":"1일","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 45~110만원 / 안치실 10만원'
WHERE id = '14863983';

-- 센트럴병원 장례식장 (센트럴병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1시간","price":5000,"priceDisplay":"5,000원"}]'::jsonb,
    price_range = '안치실 1만원'
WHERE id = '10564278';

-- 울산시티병원장례식장 (시티병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"특  실 (시간당 45000원)","detail":"80평/1일/접객실분향실상주휴게실 포함","price":1080000,"priceDisplay":"108만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"2호실 (시간당 25000원)","detail":"38평/1일/접객실분향실상주휴게실 포함","price":600000,"priceDisplay":"60만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"1호실 (시간당 35000원)","detail":"60평/1일/접객실분향실상주휴게실 포함","price":840000,"priceDisplay":"84만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료 1일 (24시간)","detail":"1시간 5000원","price":120000,"priceDisplay":"12만원"}]'::jsonb,
    price_range = '빈소 60~108만원 / 안치실 12만원'
WHERE id = '2005758652';

-- 진영병원 장례식장 (진영병원 장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"특2호실","detail":"1일","price":400000,"priceDisplay":"40만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특1호실","detail":"1일","price":600000,"priceDisplay":"60만원"},{"category":"안치실이용료","subCategory":"일반","name":"고인안치료","detail":"1일","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 40~60만원 / 안치실 10만원'
WHERE id = '17461703';

-- 울산대학교병원장례식장 (울산대학교병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일기준(12시간~24시간미만)","price":115000,"priceDisplay":"12만원"}]'::jsonb,
    price_range = '안치실 12만원'
WHERE id = '9307315';

-- 진교장례식장 (진교장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"접객실.빈소.휴게실(VIP)","detail":"1실/24시간 기준(65평)","price":500000,"priceDisplay":"50만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"접객실.빈소.휴계실","detail":"1실/24시간 기준 (50평)","price":350000,"priceDisplay":"35만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1실/24시간 기준","price":70000,"priceDisplay":"7만원"}]'::jsonb,
    price_range = '빈소 35~50만원 / 안치실 7만원'
WHERE id = '8564041';

-- 장호원요양병원 장례식장 (장호원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일 기준","price":96000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '안치실 10만원'
WHERE id = '562337980';

-- 용상안동병원장례식장 (안동병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료","detail":"45평형 1실 5호","price":450000,"priceDisplay":"45만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료","detail":"70평형 1실 8호","price":600000,"priceDisplay":"60만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료","detail":"40평형 2실 3.7호","price":400000,"priceDisplay":"40만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료","detail":"90평형 1실 2호","price":700000,"priceDisplay":"70만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료","detail":"130평형 1실 10호(특1호)","price":990000,"priceDisplay":"99만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료","detail":"90평형 1실 9호(특2호)","price":750000,"priceDisplay":"75만원"},{"category":"안치실이용료","subCategory":"기타","name":"안치실이용료","detail":"안치실료","price":70000,"priceDisplay":"7만원"}]'::jsonb,
    price_range = '빈소 40~99만원 / 안치실 7만원'
WHERE id = '14650762';

-- 목포장례문화원 (목포장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"고인 안치료","detail":"1실","price":250000,"priceDisplay":"25만원"}]'::jsonb,
    price_range = '안치실 25만원'
WHERE id = '119291302';

-- 안강중앙병원장례식장 (안강중앙병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료(특실2)","detail":"24시간 기준","price":600000,"priceDisplay":"60만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료(특실1)","detail":"24시간 기준","price":600000,"priceDisplay":"60만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"24시간 기준","price":65000,"priceDisplay":"7만원"},{"category":"안치실이용료","subCategory":"일반","name":"염습비","detail":"1회","price":200000,"priceDisplay":"20만원"}]'::jsonb,
    price_range = '빈소 60만원 / 안치실 7만원'
WHERE id = '17440712';

-- 서울좋은병원장례식장 (서울좋은병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일(24시간기준)","price":90000,"priceDisplay":"9만원"}]'::jsonb,
    price_range = '안치실 9만원'
WHERE id = '26320157';

-- 은평요양병원장례식장 (은평요양병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"6호실","detail":"132m2","price":450000,"priceDisplay":"45만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"1호실","detail":"198m2","price":1000000,"priceDisplay":"100만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"2호실","detail":"230m2","price":1300000,"priceDisplay":"130만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"3호실","detail":"198m2","price":1000000,"priceDisplay":"100만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"F호실","detail":"132m2","price":600000,"priceDisplay":"60만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"5호실","detail":"165m2","price":800000,"priceDisplay":"80만원"},{"category":"안치실이용료","subCategory":"염습실/입관실","name":"입관실사용료(자체입관시)","detail":"1일","price":350000,"priceDisplay":"35만원"},{"category":"안치실이용료","subCategory":"염습실/입관실","name":"안치료","detail":"1일","price":120000,"priceDisplay":"12만원"}]'::jsonb,
    price_range = '빈소 45~130만원 / 안치실 12만원'
WHERE id = '16327734';

-- 의령전문장례식장 (의령전문장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"기타","name":"분양소+접견실 임대료(일반-203호)","detail":"시간당","price":4200,"priceDisplay":"4,200원"},{"category":"안치실이용료","subCategory":"기타","name":"분양소+접견실 임대료(일반-202호)","detail":"시간당","price":4200,"priceDisplay":"4,200원"},{"category":"안치실이용료","subCategory":"기타","name":"분양소+접견실 임대료(특실)","detail":"시간당","price":4200,"priceDisplay":"4,200원"}]'::jsonb,
    price_range = '안치실 0만원'
WHERE id = '9343365';

-- 혜성병원장례식장 (혜성병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일","price":80000,"priceDisplay":"8만원"}]'::jsonb,
    price_range = '안치실 8만원'
WHERE id = '459771491';

-- 경희의료원장례식장 (경희의료원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"시설 사용료(접객실료 포함)","detail":"65평형(214.9㎡) / (1일 1시간/41500원)","price":996000,"priceDisplay":"100만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"시설 사용료(접객실료 포함)","detail":"56평형(185.1㎡) / (1일 1시간/37000원)","price":888000,"priceDisplay":"89만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"시설 사용료(접객실료 포함)","detail":"100평형(330.6㎡) / (1일 1시간/75000원)","price":1800000,"priceDisplay":"180만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"시설 사용료(접객실료 포함)","detail":"50평형(165.3㎡) / (1일 1시간/32000원)","price":768000,"priceDisplay":"77만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"시설 사용료(접객실료 포함)","detail":"46평형(152.1㎡) / (1일 1시간/26500원)","price":636000,"priceDisplay":"64만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"어린이(7세 ~13세)/ 1일","price":67200,"priceDisplay":"7만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"유아(1세~6세)/1일","price":52800,"priceDisplay":"5만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"성인(14세 이상) / 1일","price":79200,"priceDisplay":"8만원"}]'::jsonb,
    price_range = '빈소 64~180만원 / 안치실 5만원'
WHERE id = '14650916';

-- 광양백운장례식장 (광양백운장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"VIP실","detail":"1시간","price":60000,"priceDisplay":"6만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"백운실","detail":"1시간","price":50000,"priceDisplay":"5만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특실","detail":"1시간","price":55000,"priceDisplay":"6만원"}]'::jsonb,
    price_range = '빈소 5~6만원'
WHERE id = '1191748713';

-- 상주시민장례식장 ((주)시민장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1일","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '안치실 10만원'
WHERE id = '601885014';

-- 효신전문장례식장 (효신전문장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실및접객실","detail":"1.3분향실및접객실1시간당30000","price":720000,"priceDisplay":"72만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실및접객실(특실)","detail":"특실1시간당30000","price":720000,"priceDisplay":"72만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1시당5000원","price":96000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 72만원 / 안치실 10만원'
WHERE id = '8630168';

-- 영양병원장례식장 (영양병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실사용료","detail":"1실/24시간 기준","price":350000,"priceDisplay":"35만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실사용료","detail":"1실/24시간 기준","price":70000,"priceDisplay":"7만원"}]'::jsonb,
    price_range = '빈소 35만원 / 안치실 7만원'
WHERE id = '25083573';

-- 남지요양병원장례식장 (남지요양병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1실24시간 기준12시간 미만인 경우 반일징수","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '안치실 10만원'
WHERE id = '11934829';

-- 영산요양병원장례식장 (영산요양병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일","price":60000,"priceDisplay":"6만원"}]'::jsonb,
    price_range = '안치실 6만원'
WHERE id = '26029391';

-- 부산성모병원장례식장 (부산성모병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장임대료(2호)","detail":"1실/24시간 기준","price":1200000,"priceDisplay":"120만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장임대료(5호)","detail":"1실/24시간 기준","price":408000,"priceDisplay":"41만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장임대료(6호/대/)","detail":"1실/24시간 기준","price":804000,"priceDisplay":"80만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장임대료(3호)","detail":"1실/24시간 기준","price":456000,"priceDisplay":"46만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장임대료(1호/중/)","detail":"1실/24시간 기준","price":1300800,"priceDisplay":"130만원"},{"category":"안치실이용료","subCategory":"일반","name":"시신안치료","detail":"1실/24시간 기준","price":96000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 41~130만원 / 안치실 10만원'
WHERE id = '12753092';

-- 대우병원장례식장 (대우병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '안치실 10만원'
WHERE id = '10233175';

-- 청구성심병원장례식장 (청구성심병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장  특3호 빈소 (50평형)","detail":"1일 사용료","price":700000,"priceDisplay":"70만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"관 리 비","detail":"1일","price":40000,"priceDisplay":"4만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장  5호 빈소 (35평형)","detail":"1일 사용료","price":500000,"priceDisplay":"50만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례장식  특12호 빈소 (60평형)","detail":"1일 사용료","price":800000,"priceDisplay":"80만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소추가사용료 특1.2.3호 접객실","detail":"4시간 기준","price":300000,"priceDisplay":"30만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소추가사용료 5호 접객실","detail":"4시간 기준","price":200000,"priceDisplay":"20만원"},{"category":"안치실이용료","subCategory":"일반","name":"수시비(초렴)","detail":"1건","price":200000,"priceDisplay":"20만원"},{"category":"안치실이용료","subCategory":"일반","name":"염습비","detail":"1회","price":350000,"priceDisplay":"35만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1일 사용료","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 4~80만원 / 안치실 10만원'
WHERE id = '8110536';

-- 구례병원장례식장 (구례병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향소및접객실 사용료","detail":"1일사용료","price":480000,"priceDisplay":"48만원"},{"category":"안치실이용료","subCategory":"일반","name":"시신안치료","detail":"1일사용료","price":80000,"priceDisplay":"8만원"}]'::jsonb,
    price_range = '빈소 48만원 / 안치실 8만원'
WHERE id = '8703366';

-- 고전장례식장 (고전장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"장례식장 안치실(외부주민)","detail":"12시간 기준","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '안치실 10만원'
WHERE id = '26445251';

-- 녹십자요양병원장례식장 (녹십자요양병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"1호실(1일)","detail":"205.02m²","price":350000,"priceDisplay":"35만원"},{"category":"안치실이용료","subCategory":"일반","name":"1일","detail":"고인1인","price":150000,"priceDisplay":"15만원"}]'::jsonb,
    price_range = '빈소 35만원 / 안치실 15만원'
WHERE id = '25722538';

-- 계명대학교경주동산병원장례식장 (계명대학교경주동산병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실(특실B1호)","detail":"1일","price":750000,"priceDisplay":"75만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실(특실101호)","detail":"1일","price":810000,"priceDisplay":"81만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실(202호)","detail":"1일","price":570000,"priceDisplay":"57만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실(특실201호)","detail":"1일","price":840000,"priceDisplay":"84만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실(VIP실)","detail":"1일","price":1320000,"priceDisplay":"132만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일","price":67200,"priceDisplay":"7만원"}]'::jsonb,
    price_range = '빈소 57~132만원 / 안치실 7만원'
WHERE id = '11043183';

-- 서천한국장례식장 (서천한국장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"기타","name":"1일","detail":"1일","price":50000,"priceDisplay":"5만원"}]'::jsonb,
    price_range = '안치실 5만원'
WHERE id = '17577759';

-- 하나원전문장례식장 (하나원전문장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실 사용료","detail":"시간당(3400원)","price":81600,"priceDisplay":"8만원"}]'::jsonb,
    price_range = '안치실 8만원'
WHERE id = '12474789';

-- 구미장례식장해원 (구미장례식장해원)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실(301호)","detail":"588.42㎡ (1일) 320명","price":1560000,"priceDisplay":"156만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실(201호)","detail":"463.68㎡ (1일) 248명","price":1200000,"priceDisplay":"120만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실(202호302호)","detail":"260.82㎡ (1일) 136명","price":660000,"priceDisplay":"66만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실(102호203호303호)","detail":"173.88㎡ (1일) 80명","price":480000,"priceDisplay":"48만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실(101호)","detail":"226.8㎡ (1일) 112명","price":600000,"priceDisplay":"60만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1일(5000/시간)","price":120000,"priceDisplay":"12만원"}]'::jsonb,
    price_range = '빈소 48~156만원 / 안치실 12만원'
WHERE id = '24800831';

-- 우수영장례식장 (우수영장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"특실 분향접객실","detail":"1일 기준","price":480000,"priceDisplay":"48만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"201호 분향접객실","detail":"1일 기준","price":400000,"priceDisplay":"40만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"202호 분향접객실","detail":"1일 기준","price":300000,"priceDisplay":"30만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실 사용료","detail":"1일 기준","price":80000,"priceDisplay":"8만원"}]'::jsonb,
    price_range = '빈소 30~48만원 / 안치실 8만원'
WHERE id = '26094535';

-- 원주의료원장례식장 (원주의료원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실사용료","detail":"1시간","price":3300,"priceDisplay":"3,300원"}]'::jsonb,
    price_range = '안치실 0만원'
WHERE id = '14650906';

-- 경주전문장례식장 (경주전문장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실 특5호","detail":"1일 기준 (70평) / 시간당 21250원","price":510000,"priceDisplay":"51만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실 특2호","detail":"1일 기준 (80평) / 시간당 32500원","price":780000,"priceDisplay":"78만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실 VIP실","detail":"1일 기준 (100평) /시간당 37500원","price":900000,"priceDisplay":"90만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실 특3호","detail":"1일 기준 (70평) / 시간당 21250원","price":510000,"priceDisplay":"51만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실 특1호","detail":"1일 기준 (80평) / 시간당 32500원","price":780000,"priceDisplay":"78만원"},{"category":"안치실이용료","subCategory":"일반","name":"사체안치료","detail":"1일 기준 /시간당 3500원","price":84000,"priceDisplay":"8만원"}]'::jsonb,
    price_range = '빈소 51~90만원 / 안치실 8만원'
WHERE id = '8654563';

-- 청주의료원장례식장 (청주의료원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"시간당","price":2000,"priceDisplay":"2,000원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일당","price":48000,"priceDisplay":"5만원"}]'::jsonb,
    price_range = '안치실 0만원'
WHERE id = '14650860';

-- 동아대학교병원장례식장 (동아대학교병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실사용료","detail":"1일/24시간 기준","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '안치실 10만원'
WHERE id = '18039572';

-- 목포하당장례식장 (목포하당장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소접객실 사용료","detail":"301호 2박3일 시간당34000원","price":1600000,"priceDisplay":"160만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소접객실 사용료","detail":"202호 2박3일 시간당34000원","price":1600000,"priceDisplay":"160만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소접객실 사용료","detail":"302호 2박3일 시간당34000원","price":1600000,"priceDisplay":"160만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소접객실 사용료","detail":"103호 2박3일 시간당32000원","price":1500000,"priceDisplay":"150만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소접객실 사용료","detail":"102호 2박3일 시간당25000원","price":1200000,"priceDisplay":"120만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소접객실 사용료","detail":"101호 2박3일 시간당18800원","price":900000,"priceDisplay":"90만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소접객실 사용료","detail":"201호 2박3일 시간당34000원","price":1600000,"priceDisplay":"160만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실사용료","detail":"안치실사용료 2박3일","price":300000,"priceDisplay":"30만원"}]'::jsonb,
    price_range = '빈소 90~160만원 / 안치실 30만원'
WHERE id = '14981982';

-- 수원시장례식장 (수원시연화장장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료(관외)","detail":"관외/1일기준","price":60000,"priceDisplay":"6만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료(관내)","detail":"관내/1일기준","price":45000,"priceDisplay":"5만원"}]'::jsonb,
    price_range = '안치실 5만원'
WHERE id = '1480980418';

-- 정선병원장례식장 (정선병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실 사용료/병원납부/원내","detail":"1500원/시간/1일 24시간기준","price":36000,"priceDisplay":"4만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실 사용료/병원납부/원외","detail":"2000원/시간/1일 24시간기준","price":48000,"priceDisplay":"5만원"}]'::jsonb,
    price_range = '안치실 4만원'
WHERE id = '15185543';

-- 예지장례식장 (예지 장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"특실","detail":"264m2","price":840000,"priceDisplay":"84만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"2호실","detail":"214.5m2","price":650000,"priceDisplay":"65만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"1호실","detail":"231m2","price":720000,"priceDisplay":"72만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1시간","price":5000,"priceDisplay":"5,000원"}]'::jsonb,
    price_range = '빈소 65~84만원 / 안치실 1만원'
WHERE id = '13567964';

-- 담양제일장례식장 (담양제일장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"101호(220석)","detail":"분향실접객실주방/1일기준","price":1000000,"priceDisplay":"100만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"202호(300석)","detail":"분향실접객실주방/1일기준","price":1200000,"priceDisplay":"120만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"201호(170석)","detail":"분향실접객실주방/1일기준","price":850000,"priceDisplay":"85만원"},{"category":"안치실이용료","subCategory":"일반","name":"고인안치","detail":"고인안치 1일 사용료","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 85~120만원 / 안치실 10만원'
WHERE id = '655069495';

-- 한도병원 장례식장 (한도병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소접객실사용료(시간당)","detail":"특실-장미실","price":30000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소접객실사용료(시간당)","detail":"보통-수국실","price":15000,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소접객실사용료(시간당)","detail":"일반-국화실","price":25000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소접객실사용료(시간당)","detail":"보통-목련실","price":15000,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소접객실사용료(시간당)","detail":"특실-백합실","price":30000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소접객실사용료(시간당)","detail":"VIP-무궁화실","price":35000,"priceDisplay":"4만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"시간당","price":5000,"priceDisplay":"5,000원"}]'::jsonb,
    price_range = '빈소 2~4만원 / 안치실 1만원'
WHERE id = '16842419';

-- 하늘원 장례식장 (하늘원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소/접객실(일반1호55평)","detail":"1시간","price":11000,"priceDisplay":"1만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소/접객실(VIP실80평)","detail":"1시간","price":16000,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소/접객실(일반3호40평)","detail":"1시간","price":9000,"priceDisplay":"9,000원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소/접객실(일반2호40평)","detail":"1시간","price":9000,"priceDisplay":"9,000원"},{"category":"안치실이용료","subCategory":"일반","name":"시신안치료","detail":"1시간","price":3000,"priceDisplay":"3,000원"}]'::jsonb,
    price_range = '빈소 1~2만원 / 안치실 0만원'
WHERE id = '15808981';

-- 대구병원 장례식장 (구병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"3분향실","detail":"1일/24시간기준 시간당 23.000","price":552000,"priceDisplay":"55만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"2분향실","detail":"1일/24시간기준  시간당 32.000","price":768000,"priceDisplay":"77만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"1분향실","detail":"1일/24시간기준 시간당 35.000","price":840000,"priceDisplay":"84만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1일 안치료","price":96000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 55~84만원 / 안치실 10만원'
WHERE id = '19967278';

-- 문경제일병원 장례식장 (문경제일병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"일반실 분향소 및 접객실사용료","detail":"1실/1시간기준","price":20000,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특실 분향소 및 접객실사용료","detail":"1실/1시간기준","price":25000,"priceDisplay":"3만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1시간당","price":8000,"priceDisplay":"8,000원"}]'::jsonb,
    price_range = '빈소 2~3만원 / 안치실 1만원'
WHERE id = '15581289';

-- 군위삼성병원 장례식장 (삼성병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실 1일","detail":"시간당 4000","price":96000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '안치실 10만원'
WHERE id = '8200114';

-- 분당차병원 장례식장 (분당차병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"35평(1실/24시간기준)동시 50명","detail":"빈소 접객실","price":600000,"priceDisplay":"60만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"30평(1실/24시간기준)동시 40명","detail":"빈소 접객실","price":500000,"priceDisplay":"50만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"40평(1실/24시간기준)동시 60명","detail":"빈소 접객실","price":650000,"priceDisplay":"65만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"70평(1실/24시간기준)동시 100명","detail":"빈소 접객실","price":1250000,"priceDisplay":"125만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일 기준","price":72000,"priceDisplay":"7만원"}]'::jsonb,
    price_range = '빈소 50~125만원 / 안치실 7만원'
WHERE id = '16075749';

-- 수원중앙병원 장례식장 (중앙병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장(임대료)","detail":"1실 (24시간기준)","price":450000,"priceDisplay":"45만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실사용료","detail":"1회","price":300000,"priceDisplay":"30만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료(임대료)","detail":"1실 (24시간기준)","price":70000,"priceDisplay":"7만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"사용료 1일/24시간기준","price":120000,"priceDisplay":"12만원"},{"category":"안치실이용료","subCategory":"","name":"안치료","detail":"시간당","price":3000,"priceDisplay":"3,000원"}]'::jsonb,
    price_range = '빈소 45만원 / 안치실 0만원'
WHERE id = '19131012';

-- 의정부백병원 장례식장 (백병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"기타","name":"안치실","detail":"특수사체 / 1시간","price":10000,"priceDisplay":"1만원"},{"category":"안치실이용료","subCategory":"기타","name":"안치실","detail":"일반사체 / 1시간","price":8000,"priceDisplay":"8,000원"}]'::jsonb,
    price_range = '안치실 1만원'
WHERE id = '16515342';

-- 동의의료원 장례식장 (동의의료원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '안치실 10만원'
WHERE id = '8946999';

-- GSH광양서울병원 장례식장 (광양서울병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"특실(100평)1실/30%할인","detail":"1일","price":1080000,"priceDisplay":"108만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"일반실(70평)3실/30%할인","detail":"1일","price":960000,"priceDisplay":"96만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"일","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 96~108만원 / 안치실 10만원'
WHERE id = '18950428';

-- 새동산병원 장례식장 (동산병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1일사용료","price":150000,"priceDisplay":"15만원"}]'::jsonb,
    price_range = '안치실 15만원'
WHERE id = '976916943';

-- 광탄현대병원 장례식장 (광탄현대병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"","name":"안치료","detail":"시간당","price":4000,"priceDisplay":"4,000원"}]'::jsonb,
    price_range = '안치실 0만원'
WHERE id = '27353085';

-- 의정부을지대학교병원 장례식장 (의정부을지대학교병원 장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장임대료 특실 2호","detail":"1실/시간 기준(261㎡)B1F","price":77100,"priceDisplay":"8만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장임대료 특실 1호","detail":"1실/시간 기준(380㎡)B1F","price":112500,"priceDisplay":"11만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장임대료 특실 3호","detail":"1실/시간 기준(271㎡)B1F","price":81250,"priceDisplay":"8만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장임대료 일반실 56호","detail":"1실/시간 기준(211.5㎡)B2F","price":40850,"priceDisplay":"4만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장임대료 일반실 7~9호","detail":"1실/시간 기준(178.5㎡)B2F","price":36700,"priceDisplay":"4만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장임대료 일반실 12호","detail":"1실/시간 기준(89㎡)B2F","price":14600,"priceDisplay":"1만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장임대료 일반실 1011호","detail":"1실/시간 기준(96㎡)B2F","price":16700,"priceDisplay":"2만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1실/시간기준","price":3000,"priceDisplay":"3,000원"}]'::jsonb,
    price_range = '빈소 1~11만원 / 안치실 0만원'
WHERE id = '1914144020';

-- 포천시 관인농협장례식장 (관인농협장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장임대료","detail":"장례건(1일)당(1일추가당10만원)","price":600000,"priceDisplay":"60만원"},{"category":"안치실이용료","subCategory":"일반","name":"장례식장안치료","detail":"1일","price":108000,"priceDisplay":"11만원"}]'::jsonb,
    price_range = '빈소 60만원 / 안치실 11만원'
WHERE id = '1957634848';

-- 청주탑장례식장 (청주탑요양병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소사용료(3호)","detail":"54평형","price":540000,"priceDisplay":"54만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소사용료(5호)","detail":"54평형","price":540000,"priceDisplay":"54만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소사용료(vip2호)","detail":"72평형","price":720000,"priceDisplay":"72만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소사용료(vip1호)","detail":"93평형","price":1200000,"priceDisplay":"120만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"24시간","price":48000,"priceDisplay":"5만원"}]'::jsonb,
    price_range = '빈소 54~120만원 / 안치실 5만원'
WHERE id = '1327132929';

-- MG새마을금고 장례식장 (새마을장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 이용료","detail":"1일","price":700000,"priceDisplay":"70만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일","price":70000,"priceDisplay":"7만원"}]'::jsonb,
    price_range = '빈소 70만원 / 안치실 7만원'
WHERE id = '1521759049';

-- 남양주장례식장 (남양주국민병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"특실(분향소접객실유족대기실)","detail":"70평","price":300000,"priceDisplay":"30만원"},{"category":"안치실이용료","subCategory":"기타","name":"안치실","detail":"1일24시간 기준 / 1시간당","price":5000,"priceDisplay":"5,000원"}]'::jsonb,
    price_range = '빈소 30만원 / 안치실 1만원'
WHERE id = '8453865';

-- 영남제일병원 장례식장 (영남제일병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료 1일","detail":"1일","price":100000,"priceDisplay":"10만원"},{"category":"안치실이용료","subCategory":"기타","name":"안치료 1시간","detail":"1시간","price":5000,"priceDisplay":"5,000원"}]'::jsonb,
    price_range = '안치실 1만원'
WHERE id = '10641985';

-- 동수원병원 장례식장 (동수원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"1호실","detail":"분향실접객실(1일기준)40평","price":360000,"priceDisplay":"36만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"3호실","detail":"분향실접객실(1일기준)25평","price":240000,"priceDisplay":"24만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"2호실","detail":"분향실접객실(1일기준)40평","price":360000,"priceDisplay":"36만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1일(24시간) 사용료","price":72000,"priceDisplay":"7만원"}]'::jsonb,
    price_range = '빈소 24~36만원 / 안치실 7만원'
WHERE id = '8914668';

-- 스카이장례식장 (남동스카이장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"70평(7층 특701호)","detail":"232㎡(70평형) 52명 / 1일 24시간 기준","price":1188000,"priceDisplay":"119만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"202평(301호+302호 통합)","detail":"668㎡(202평형) 200명 / 1일 24시간 기준","price":2428800,"priceDisplay":"243만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"97평(3층 302호)","detail":"319㎡(97평형) 100명 / 1일 24시간 기준","price":1135200,"priceDisplay":"114만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"126평(4층 VIP실)","detail":"416㎡(126평형) 140명 / 1일 24시간 기준","price":2059200,"priceDisplay":"206만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"120평(5층 특501호)","detail":"396㎡(120평형) 120명 / 1일 24시간 기준","price":1927200,"priceDisplay":"193만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"203평(201호+202호 통합)","detail":"673㎡(203평형) 200명 / 1일 24시간 기준","price":2428800,"priceDisplay":"243만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"107평(2층 201호)","detail":"356㎡(107평형) 100명 / 1일 24시간 기준","price":1293600,"priceDisplay":"129만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"105평(3층 301호)","detail":"349㎡(105평형) 100명 / 1일 24시간 기준","price":1293600,"priceDisplay":"129만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"55평(2층 203호)","detail":"181㎡(55평형) 34명 / 1일 24시간 기준","price":607200,"priceDisplay":"61만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"96평(2층 202호)","detail":"317㎡(96평형) 100명 / 1일 24시간 기준","price":1135200,"priceDisplay":"114만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"55평(3층 303호)","detail":"180㎡(55평형) 34명 / 1일 24시간 기준","price":607200,"priceDisplay":"61만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"72평(6층 특601호)","detail":"239㎡(72평형) 68명 / 1일 24시간 기준","price":1346400,"priceDisplay":"135만원"},{"category":"안치실이용료","subCategory":"일반","name":"1일(6000원 X 24H)","detail":"","price":144000,"priceDisplay":"14만원"}]'::jsonb,
    price_range = '빈소 61~243만원 / 안치실 14만원'
WHERE id = '18886745';

-- 고신대학교 복음병원 장례식장 (복음병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"2호실","detail":"1일 사용료","price":500000,"priceDisplay":"50만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"VIP실","detail":"1일사용료","price":800000,"priceDisplay":"80만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특실","detail":"1일사용료","price":600000,"priceDisplay":"60만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"1호실","detail":"1일사용료","price":500000,"priceDisplay":"50만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일 사용료","price":140000,"priceDisplay":"14만원"}]'::jsonb,
    price_range = '빈소 50~80만원 / 안치실 14만원'
WHERE id = '26938722';

-- 동군산병원 장례식장 (동군산병원장례예식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료(일반6)","detail":"1일기준","price":1200000,"priceDisplay":"120만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료(일반5)","detail":"1일기준","price":1200000,"priceDisplay":"120만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료(일반3)","detail":"1일기준","price":1200000,"priceDisplay":"120만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장예식장 임대료(일반7)","detail":"1일기준","price":1500000,"priceDisplay":"150만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장예식장 임대료(특실2)","detail":"1일기준","price":1950000,"priceDisplay":"195만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장예식장 임대료(특실1)","detail":"1일기준","price":2550000,"priceDisplay":"255만원"},{"category":"안치실이용료","subCategory":"일반","name":"입관실사용료","detail":"1회기준","price":300000,"priceDisplay":"30만원"}]'::jsonb,
    price_range = '빈소 120~255만원 / 안치실 30만원'
WHERE id = '19632334';

-- 하남시 마루공원 장례식장 (하남시 마루공원(장례식장))
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1실/관내","price":48000,"priceDisplay":"5만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1실/관외","price":60000,"priceDisplay":"6만원"}]'::jsonb,
    price_range = '안치실 5만원'
WHERE id = '1594603773';

-- 영락원장례식장 (고성영락원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"특3호특4호특5호","detail":"98평 (1일기준)","price":990000,"priceDisplay":"99만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특2호실","detail":"78평 (1일기준)","price":890000,"priceDisplay":"89만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1일기준","price":50000,"priceDisplay":"5만원"}]'::jsonb,
    price_range = '빈소 89~99만원 / 안치실 5만원'
WHERE id = '10649716';

-- 안산장례식장 (안산장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일","price":90000,"priceDisplay":"9만원"}]'::jsonb,
    price_range = '안치실 9만원'
WHERE id = '16079024';

-- 울산국화원장례식장 북울산지점 ((주)울산국화원장례식장 북울산지점)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소/접객실 [VIP2] 125평/100석","detail":"1일 / 24시간","price":960000,"priceDisplay":"96만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소/접객실 [특실] 85평/30석","detail":"1일 / 24시간","price":750000,"priceDisplay":"75만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소/접객실 [VIP1] 125평/100석","detail":"1일 / 24시간","price":960000,"priceDisplay":"96만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1일 / 24시간","price":120000,"priceDisplay":"12만원"}]'::jsonb,
    price_range = '빈소 75~96만원 / 안치실 12만원'
WHERE id = '195666545';

-- SMG연세장례식장 (SMG연세병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"3층 302호실 (VIP150평형)전입식테이블","detail":"분향실/접객실/상주방/회의실/화장실/샤워실","price":1200000,"priceDisplay":"120만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"2층 203호실 (특실100평형)전입식테이블","detail":"분향실/접객실/상주방/화장실/샤워실","price":800000,"priceDisplay":"80만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"2층 202호실 (특실80평형)전입식테이블","detail":"분향실/접객실/상주방/화장실/샤워실","price":550000,"priceDisplay":"55만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"3층 301호실 (특실100평형)전입식테이블","detail":"분향실/접객실/상주방/화장실/샤워실","price":800000,"priceDisplay":"80만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실 사용료","detail":"24시간 기준 1日","price":60000,"priceDisplay":"6만원"}]'::jsonb,
    price_range = '빈소 55~120만원 / 안치실 6만원'
WHERE id = '17085563';

-- 온누리병원 장례식장 (안산온누리병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"시간당","price":5000,"priceDisplay":"5,000원"}]'::jsonb,
    price_range = '안치실 1만원'
WHERE id = '14650913';

-- 일산백병원 장례식장 (백병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"기타","name":"안치실","detail":"특수사체 / 1시간","price":10000,"priceDisplay":"1만원"},{"category":"안치실이용료","subCategory":"기타","name":"안치실","detail":"일반사체 / 1시간","price":8000,"priceDisplay":"8,000원"}]'::jsonb,
    price_range = '안치실 1만원'
WHERE id = '8455260';

-- 중앙보훈병원 장례식장 (한국보훈복지의료공단중앙보훈병원)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"3층 1호","detail":"175.70㎡(53평)/1일(24시간) 사용","price":780000,"priceDisplay":"78만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"3층 5호","detail":"175.70㎡(53평)/1일(24시간) 사용","price":780000,"priceDisplay":"78만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"2층 5호","detail":"175.70㎡(53평)/1일(24시간) 사용","price":780000,"priceDisplay":"78만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"2층 3호","detail":"175.70㎡(53평)/1일(24시간) 사용","price":780000,"priceDisplay":"78만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"2층 6호","detail":"175.70㎡(53평)/1일(24시간) 사용","price":780000,"priceDisplay":"78만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"2층 8호","detail":"157.75㎡(48평)/1일(24시간) 사용","price":701520,"priceDisplay":"70만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"2층 7호","detail":"170.58㎡(52평)/1일(24시간) 사용","price":759120,"priceDisplay":"76만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"2층 2호","detail":"141.78㎡(43평)/1일(24시간) 사용","price":630480,"priceDisplay":"63만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"2층 1호","detail":"152.33㎡(46평)/1일(24시간) 사용","price":674880,"priceDisplay":"67만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"3층 2호","detail":"175.70㎡(53평)/1일(24시간) 사용","price":780000,"priceDisplay":"78만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"3층 6호","detail":"223.93㎡(68평)/1일(24시간) 사용","price":994560,"priceDisplay":"99만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"3층 7호","detail":"179.87㎡(55평)/1일(24시간) 사용","price":799200,"priceDisplay":"80만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"3층 3호","detail":"175.70㎡(53평)/1일(24시간) 사용","price":780000,"priceDisplay":"78만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일(24시간) 사용","price":60000,"priceDisplay":"6만원"}]'::jsonb,
    price_range = '빈소 63~99만원 / 안치실 6만원'
WHERE id = '17092200';

-- 청주시장례식장운영회 (청주시장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실 (1일)","detail":"청주","price":30000,"priceDisplay":"3만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실 (1일)","detail":"관외","price":50000,"priceDisplay":"5만원"}]'::jsonb,
    price_range = '안치실 3만원'
WHERE id = '10855320';

-- 선산전문장례식장 (선산전문장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"특실 사용료","detail":"별관 특실","price":999984,"priceDisplay":"100만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"101호분향실 사용료","detail":"일반실 101호","price":499920,"priceDisplay":"50만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"102호분향실 사용료","detail":"일반실 102호","price":400000,"priceDisplay":"40만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"","price":80000,"priceDisplay":"8만원"}]'::jsonb,
    price_range = '빈소 40~100만원 / 안치실 8만원'
WHERE id = '17021252';

-- 경기도의료원 파주병원 장례식장 (경기도의료원 파주병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1시간당","price":3000,"priceDisplay":"3,000원"}]'::jsonb,
    price_range = '안치실 0만원'
WHERE id = '14650824';

-- 화순현대병원 장례예식장 (현대병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"1호실","detail":"빈소및 접객실(1일)","price":450000,"priceDisplay":"45만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특실","detail":"빈소및 접객실(1일)","price":650000,"priceDisplay":"65만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"VIP실","detail":"빈소및 접객실(1일)","price":850000,"priceDisplay":"85만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1구/1일","price":240000,"priceDisplay":"24만원"},{"category":"안치실이용료","subCategory":"기타","name":"1일","detail":"","price":80000,"priceDisplay":"8만원"}]'::jsonb,
    price_range = '빈소 45~85만원 / 안치실 8만원'
WHERE id = '8659732';

-- 뉴고려병원 장례식장 (고려병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소+접객실 특3호","detail":"시간당","price":20000,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소+접객실 vip","detail":"시간당","price":30000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소+접객실 특1호","detail":"시간당","price":25000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소+접객실 특2호","detail":"시간당","price":23000,"priceDisplay":"2만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1일","price":120000,"priceDisplay":"12만원"}]'::jsonb,
    price_range = '빈소 2~3만원 / 안치실 12만원'
WHERE id = '10159726';

-- 빛장례식장 (빛 장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실사용료(1일)","detail":"30평","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '안치실 10만원'
WHERE id = '1928483323';

-- 파주한빛병원 장례식장 ((주)한빛장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"특실 1","detail":"261.90 m2 (132석) / 1일","price":1200000,"priceDisplay":"120만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특실 2","detail":"224.62 m2 (99석) / 1일","price":1000000,"priceDisplay":"100만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"VIP 2","detail":"327.91 m2 (163석) / 1일","price":1300000,"priceDisplay":"130만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"VIP 1","detail":"318.30 m2 (198석) / 1일","price":1400000,"priceDisplay":"140만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1일","price":80000,"priceDisplay":"8만원"}]'::jsonb,
    price_range = '빈소 100~140만원 / 안치실 8만원'
WHERE id = '1426002918';

-- 통영고려병원 장례식장 (고려병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소+접객실 특3호","detail":"시간당","price":20000,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소+접객실 vip","detail":"시간당","price":30000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소+접객실 특1호","detail":"시간당","price":25000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소+접객실 특2호","detail":"시간당","price":23000,"priceDisplay":"2만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1일","price":120000,"priceDisplay":"12만원"}]'::jsonb,
    price_range = '빈소 2~3만원 / 안치실 12만원'
WHERE id = '2011196054';

-- 휴앤유병원 장례식장 (휴앤유병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장임대료 (50평)","detail":"1실(24시간 기준)","price":600000,"priceDisplay":"60만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장임대료 (88평)","detail":"1실(24시산 기준)","price":910000,"priceDisplay":"91만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장임대료 (90평)","detail":"1실(24시간 기준)","price":910000,"priceDisplay":"91만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장임대료 (60평)","detail":"1실(24시간 기준)","price":720000,"priceDisplay":"72만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일/24시간 기준","price":96000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 60~91만원 / 안치실 10만원'
WHERE id = '22542702';

-- 조선대학교병원 장례식장 (조선대학교병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 8분향소","detail":"1일 83㎡","price":400000,"priceDisplay":"40만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 1분향소","detail":"1일 281㎡","price":1500000,"priceDisplay":"150만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 2분향소","detail":"1일 224㎡","price":1100000,"priceDisplay":"110만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 3분향소","detail":"1일 165㎡","price":850000,"priceDisplay":"85만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 5분향소","detail":"1일 149㎡","price":750000,"priceDisplay":"75만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 7분향소","detail":"1일 83㎡","price":400000,"priceDisplay":"40만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 6분향소","detail":"1일 149㎡","price":750000,"priceDisplay":"75만원"},{"category":"안치실이용료","subCategory":"일반","name":"사체안치료","detail":"1일1구당","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 40~150만원 / 안치실 10만원'
WHERE id = '8066099';

-- 곽병원 장례식장 (운경의료재단곽병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"고인안치실","detail":"1일기준","price":96000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '안치실 10만원'
WHERE id = '11638387';

-- 사천중앙병원 장례식장 (중앙병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장(임대료)","detail":"1실 (24시간기준)","price":450000,"priceDisplay":"45만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실사용료","detail":"1회","price":300000,"priceDisplay":"30만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료(임대료)","detail":"1실 (24시간기준)","price":70000,"priceDisplay":"7만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"사용료 1일/24시간기준","price":120000,"priceDisplay":"12만원"},{"category":"안치실이용료","subCategory":"","name":"안치료","detail":"시간당","price":3000,"priceDisplay":"3,000원"}]'::jsonb,
    price_range = '빈소 45만원 / 안치실 0만원'
WHERE id = '14650848';

-- 동강병원 장례식장 (동강병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장임대료(일반)","detail":"1실/24시간 기준","price":320000,"priceDisplay":"32만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장임대료(특실)","detail":"1실/24시간 기준","price":450000,"priceDisplay":"45만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1일","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 32~45만원 / 안치실 10만원'
WHERE id = '8255262';

-- 고령대가야장례식장 (고령대가야장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실 사용료 특실","detail":"1실/24시간기준","price":600000,"priceDisplay":"60만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실사용료","detail":"1일/시간당","price":96000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 60만원 / 안치실 10만원'
WHERE id = '1911467935';

-- 보람김해장례식장 (보람김해장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"특2호실/90평","detail":"분향실/접객실/유족휴개실/샤워실/시간/37500","price":900000,"priceDisplay":"90만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특1호실/110평","detail":"분향실/접객실/유족휴개실/샤워실/시간/40000","price":1100000,"priceDisplay":"110만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"202호실/50평","detail":"분향실/접객실/유족휴개실/샤워실/시간/20000","price":500000,"priceDisplay":"50만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"201호실/30평","detail":"분향실/접객실/유족휴개실/샤워실/시간/12500","price":300000,"priceDisplay":"30만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특3호실/70평","detail":"분향실/접객실/유족휴개실/샤워실/시간/25000","price":700000,"priceDisplay":"70만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"VIP실/160평","detail":"분향실/접객실/유족휴개실/샤워실/시간/50000","price":1600000,"priceDisplay":"160만원"},{"category":"안치실이용료","subCategory":"빈소+접객실","name":"안치료","detail":"시신 안치료","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 10~160만원 / 안치실 10만원'
WHERE id = '2210222';

-- 오산한국병원 장례식장 (오산한국병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"시신보관실 / 안치실","detail":"1시간 / 12시간 이내","price":5000,"priceDisplay":"5,000원"},{"category":"안치실이용료","subCategory":"일반","name":"시신보관실 / 안치실","detail":"1일 /24시간 기준","price":120000,"priceDisplay":"12만원"}]'::jsonb,
    price_range = '안치실 1만원'
WHERE id = '8135367';

-- 사랑의병원 장례식장 (사랑의병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"특3호실","detail":"152m2(시간당)","price":35000,"priceDisplay":"4만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특1호실","detail":"264m2(시간당)","price":50000,"priceDisplay":"5만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"1호실","detail":"132m2(시간당)","price":30000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특2호실","detail":"231m2(시간당)","price":40000,"priceDisplay":"4만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"(시간당)","price":5000,"priceDisplay":"5,000원"},{"category":"안치실이용료","subCategory":"일반","name":"수 시","detail":"수시비","price":150000,"priceDisplay":"15만원"},{"category":"안치실이용료","subCategory":"기타","name":"1일","detail":"24시간","price":80000,"priceDisplay":"8만원"}]'::jsonb,
    price_range = '빈소 3~5만원 / 안치실 1만원'
WHERE id = '17091747';

-- 참좋은요양병원 장례식장 (영천참좋은요양병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일","price":72000,"priceDisplay":"7만원"}]'::jsonb,
    price_range = '안치실 7만원'
WHERE id = '17111896';

-- 강경장례식장 (강경장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"시설사용료 특 2 - 2호","detail":"시간당","price":34000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"시설사용료 1층 특실","detail":"시간당","price":35000,"priceDisplay":"4만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"시설사용료 일반 2실","detail":"시간당","price":16000,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"시설사용료 일반 3실","detail":"시간당","price":16000,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"시설사용료 3층 VIP실","detail":"시간당","price":37000,"priceDisplay":"4만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"시설사용료 특 2 - 1호","detail":"시간당","price":36000,"priceDisplay":"4만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"시설사용료 일반 1실","detail":"시간당","price":16000,"priceDisplay":"2만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"2일기준","price":120000,"priceDisplay":"12만원"}]'::jsonb,
    price_range = '빈소 2~4만원 / 안치실 12만원'
WHERE id = '8634100';

-- 순천향대학교 천안병원 장례식장 (순천향장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"VIP분향소 빈소.접객실 사용료","detail":"1일 기준","price":800000,"priceDisplay":"80만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"2분향소 빈소.접객실 사용료","detail":"1일 기준","price":400000,"priceDisplay":"40만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특분향소 빈소.접객실 사용료","detail":"1일 기준","price":700000,"priceDisplay":"70만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"3분향소 빈소.접객실 사용료","detail":"1일 기준","price":200000,"priceDisplay":"20만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"1분향소 빈소.접객실 사용료","detail":"1일 기준","price":500000,"priceDisplay":"50만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일 기준","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 20~80만원 / 안치실 10만원'
WHERE id = '26447139';

-- 화원연세병원 장례식장 (연세병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"1호실","detail":"70평형","price":840000,"priceDisplay":"84만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"2호실","detail":"50평형","price":720000,"priceDisplay":"72만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"시간당","price":4000,"priceDisplay":"4,000원"}]'::jsonb,
    price_range = '빈소 72~84만원 / 안치실 0만원'
WHERE id = '21317629';

-- 남대구전문장례식장 (대구전문장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일/24시간기준","price":72000,"priceDisplay":"7만원"}]'::jsonb,
    price_range = '안치실 7만원'
WHERE id = '2065020477';

-- 더조은요양병원 장례식장 (더조은장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료( VIP실 ) 추가빈소","detail":"1시간 기준","price":37500,"priceDisplay":"4만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료( 3 5호 )","detail":"1일/ 24시간 기준","price":672000,"priceDisplay":"67만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료( 특 1호 ) 추가빈소","detail":"1시간 기준","price":33000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료( 3 5호 ) 추가빈소","detail":"1시간 기준","price":28000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료( VIP실 )","detail":"1일/ 24시간 기준","price":900000,"priceDisplay":"90만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료( 특 1호 )","detail":"1일/ 24시간 기준","price":792000,"priceDisplay":"79만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실 이용료","detail":"1시간 기준","price":4000,"priceDisplay":"4,000원"}]'::jsonb,
    price_range = '빈소 3~90만원 / 안치실 0만원'
WHERE id = '1962255320';

-- 강원도삼척의료원 장례식장 (삼척의료원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"접객실","name":"접객실(일반)","detail":"사용시간당","price":6500,"priceDisplay":"6,500원"},{"category":"시설임대료","subCategory":"접객실","name":"접객실(특실)","detail":"사용시간당","price":10000,"priceDisplay":"1만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"사용시간당","price":2700,"priceDisplay":"2,700원"}]'::jsonb,
    price_range = '빈소 1~1만원 / 안치실 0만원'
WHERE id = '17577749';

-- 군산의료원 장례식장 (군산의료원장례식장 오행원)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료(구관 7 호실 ) 35평","detail":"1 실    /  시간당","price":15000,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료( 신관 5 호실 ) 50평","detail":"1 실    /  시간당","price":20000,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료(신관 1호 실 ) 70평","detail":"1  실   /시간당","price":30000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료( 신관 3 호실 ) 70평","detail":"1 실    /  시간당","price":30000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료 (신관 2호 실 ) 50평","detail":"1 실   /  시간당","price":20000,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료(구관 6 호실 ) 60평","detail":"1 실    /  시간당","price":20000,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료(구관 8 호실 ) 28평","detail":"1 실    /  시간당","price":10000,"priceDisplay":"1만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1 실    /  시간당","price":3000,"priceDisplay":"3,000원"}]'::jsonb,
    price_range = '빈소 1~3만원 / 안치실 0만원'
WHERE id = '8694245';

-- 마산의료원 장례식장 (경상남도 마산의료원 장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"303호","detail":"1시간","price":27225,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"303호","detail":"1일","price":653400,"priceDisplay":"65만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"302호","detail":"1시간","price":14850,"priceDisplay":"1만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"101호","detail":"1시간","price":5475,"priceDisplay":"5,475원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"101호","detail":"1일","price":131400,"priceDisplay":"13만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"201호301호","detail":"1일","price":712800,"priceDisplay":"71만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"203호","detail":"1시간","price":23550,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"202호","detail":"1시간","price":21000,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"203호","detail":"1일","price":565200,"priceDisplay":"57만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"202호","detail":"1일","price":504000,"priceDisplay":"50만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"201호301호","detail":"1시간","price":29700,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"302호","detail":"1일","price":356400,"priceDisplay":"36만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일","price":48000,"priceDisplay":"5만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1시간","price":2000,"priceDisplay":"2,000원"}]'::jsonb,
    price_range = '빈소 1~71만원 / 안치실 0만원'
WHERE id = '17578491';

-- 진주중앙병원 장례식장 ((주)중앙병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료","detail":"30평-1일24시간 기준","price":400000,"priceDisplay":"40만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료","detail":"70평-1일24시간 기준","price":720000,"priceDisplay":"72만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료","detail":"70평-1일24시간 기준","price":760000,"priceDisplay":"76만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료","detail":"95평-1일24시간 기준","price":960000,"priceDisplay":"96만원"}]'::jsonb,
    price_range = '빈소 40~96만원'
WHERE id = '27094475';

-- 차의과학대학교부속 구미차병원 장례식장 (차병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향소 1호 2호","detail":"1시간","price":25000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향소  (특실)","detail":"1시간","price":29000,"priceDisplay":"3만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1시간","price":5000,"priceDisplay":"5,000원"}]'::jsonb,
    price_range = '빈소 3~3만원 / 안치실 1만원'
WHERE id = '12658723';

-- 미루병원 장례식장 (미루병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소사용료(특1호)80평 24시간","detail":"빈소접객실상주휴게실","price":800000,"priceDisplay":"80만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소사용료(특3호)60평 24시간","detail":"빈소접객실상주휴게실","price":700000,"priceDisplay":"70만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소사용료(특2호)80평 24시간","detail":"빈소접객실상주휴게실","price":800000,"priceDisplay":"80만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료 24시간","detail":"안치냉장고 사용료","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 70~80만원 / 안치실 10만원'
WHERE id = '17138476';

-- 영산포제일병원 장례식장 (영산포제일병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"1호실","detail":"48시간제","price":25000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특2호실","detail":"48시간제","price":31250,"priceDisplay":"3만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"48시간제","price":6250,"priceDisplay":"6,250원"}]'::jsonb,
    price_range = '빈소 3~3만원 / 안치실 1만원'
WHERE id = '10640678';

-- 나눔병원 장례식장 (나눔병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일 24시 기준","price":120000,"priceDisplay":"12만원"}]'::jsonb,
    price_range = '안치실 12만원'
WHERE id = '331934143';

-- 울산제일병원 장례식장 (제일병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"특실(3층)","detail":"분향실 접객실.1일","price":1000000,"priceDisplay":"100만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"301호(3층)","detail":"분향실 접객실/1일","price":600000,"priceDisplay":"60만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"203호(2층)","detail":"분향실 접객실/1일","price":600000,"priceDisplay":"60만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"VIP실(2층)","detail":"분향실 접객실/1일","price":900000,"priceDisplay":"90만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1일","price":80000,"priceDisplay":"8만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실 사용료","detail":"1일/24시간 기준","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 60~100만원 / 안치실 8만원'
WHERE id = '16264292';

-- 국민요양병원 국민장례식장 (국민요양병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소사용료(VIP실) - 120평","detail":"1일/24시간 기준","price":600000,"priceDisplay":"60만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소사용료(일반실) - 35평","detail":"1일/24시간 기준","price":350000,"priceDisplay":"35만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일/24시간 기준","price":150000,"priceDisplay":"15만원"}]'::jsonb,
    price_range = '빈소 35~60만원 / 안치실 15만원'
WHERE id = '136651612';

-- 성남시의료원 장례식장 (성남시의료원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"7호실(일)","detail":"157㎡","price":480000,"priceDisplay":"48만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"8호실(일)","detail":"170.37㎡","price":480000,"priceDisplay":"48만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"9호실(일)","detail":"329.59㎡","price":960000,"priceDisplay":"96만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"4호실(일)","detail":"115㎡","price":360000,"priceDisplay":"36만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"1호실(일)","detail":"105㎡","price":360000,"priceDisplay":"36만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"6호실(일)","detail":"157㎡","price":480000,"priceDisplay":"48만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"2호실(일)","detail":"109㎡","price":360000,"priceDisplay":"36만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"3호실(일)","detail":"109㎡","price":360000,"priceDisplay":"36만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"5호실(시간)","detail":"115㎡","price":15000,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"4호실(시간)","detail":"115㎡","price":15000,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"6호실(시간)","detail":"157㎡","price":20000,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"7호실(시간)","detail":"157㎡","price":20000,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"3호실(시간)","detail":"109㎡","price":15000,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"5호실(일)","detail":"115㎡","price":360000,"priceDisplay":"36만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"2호실(시간)","detail":"109㎡","price":15000,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"8호실(시간)","detail":"170.37㎡","price":20000,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"1호실(시간)","detail":"105㎡","price":15000,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"9호실(시간)","detail":"329.59㎡","price":40000,"priceDisplay":"4만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실사용료","detail":"900㎡","price":2500,"priceDisplay":"2,500원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실사용료","detail":"900㎡","price":60000,"priceDisplay":"6만원"}]'::jsonb,
    price_range = '빈소 2~96만원 / 안치실 0만원'
WHERE id = '825686610';

-- 포항의료원 장례식장 (경상북도포항의료원)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"특실 (분향실 접객실)","detail":"시간당","price":39000,"priceDisplay":"4만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"VIP실 (분향실 접객실)","detail":"시간당","price":36000,"priceDisplay":"4만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"일반실 (분향실 접객실)","detail":"시간당","price":16000,"priceDisplay":"2만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"시간당","price":2000,"priceDisplay":"2,000원"}]'::jsonb,
    price_range = '빈소 2~4만원 / 안치실 0만원'
WHERE id = '16295632';

-- 옥천성모병원 장례식장 (옥천성모장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"VIP실(4층)-시간당","detail":"약 296 m2","price":35000,"priceDisplay":"4만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"201301302호-시간당","detail":"약 190  m2","price":30000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"추가사용-시간당","detail":"약 190  m2","price":15000,"priceDisplay":"2만원"},{"category":"안치실이용료","subCategory":"일반","name":"1일당","detail":"m2","price":60000,"priceDisplay":"6만원"}]'::jsonb,
    price_range = '빈소 2~4만원 / 안치실 6만원'
WHERE id = '8025584';

-- 광명성애병원 장례식장 (광명성애병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장임대료","detail":"123층 특별빈소(1실24시간기준)","price":900000,"priceDisplay":"90만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장임대료","detail":"1층 개인빈소(1실24시간기준)","price":800000,"priceDisplay":"80만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장임대료","detail":"특1호실(1실24시간기준)","price":1000000,"priceDisplay":"100만원"}]'::jsonb,
    price_range = '빈소 80~100만원'
WHERE id = '14650909';

-- 대전한국병원 (한국병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일(24시간)","price":75000,"priceDisplay":"8만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실 사용료","detail":"1시간당","price":5000,"priceDisplay":"5,000원"},{"category":"안치실이용료","subCategory":"기타","name":"시설임대료","detail":"염습실 대여료","price":200000,"priceDisplay":"20만원"},{"category":"안치실이용료","subCategory":"기타","name":"시설임대료","detail":"안치실","price":72000,"priceDisplay":"7만원"}]'::jsonb,
    price_range = '안치실 1만원'
WHERE id = '7831202';

-- 지샘병원 장례식장 (지샘병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일 사용료","price":150000,"priceDisplay":"15만원"}]'::jsonb,
    price_range = '안치실 15만원'
WHERE id = '25070694';

-- 원병원 장례식장 (경기도의료원 수원병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실사용료","detail":"1일","price":72000,"priceDisplay":"7만원"}]'::jsonb,
    price_range = '안치실 7만원'
WHERE id = '9300093';

-- 인제대학교 부산백병원 장례식장 (백병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"기타","name":"안치실","detail":"특수사체 / 1시간","price":10000,"priceDisplay":"1만원"},{"category":"안치실이용료","subCategory":"기타","name":"안치실","detail":"일반사체 / 1시간","price":8000,"priceDisplay":"8,000원"}]'::jsonb,
    price_range = '안치실 1만원'
WHERE id = '17093222';

-- 광주보훈병원 장례식장 (광주보훈병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향소접객실","detail":"1시간 ( 1호실 26000원 / 2.3.5.6호실 24000원 )","price":24000,"priceDisplay":"2만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1시간","price":2500,"priceDisplay":"2,500원"}]'::jsonb,
    price_range = '빈소 2만원 / 안치실 0만원'
WHERE id = '8764995';

-- 곤지암장례식장 (곤지암농협장례문화원)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실 사용료","detail":"(1일  시간3000)","price":72000,"priceDisplay":"7만원"}]'::jsonb,
    price_range = '안치실 7만원'
WHERE id = '8754095';

-- 익산병원 장례식장 ((유)신광 익산병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실 (일반실)","detail":"시간당","price":18000,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실(특실)","detail":"시간당","price":32000,"priceDisplay":"3만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"시간당","price":5000,"priceDisplay":"5,000원"}]'::jsonb,
    price_range = '빈소 2~3만원 / 안치실 1만원'
WHERE id = '10759086';

-- 보은요양병원 장례식장 (보은요양병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"접객실","name":"접객실(특실)","detail":"1시간 당","price":20000,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"접객실","name":"접객실(일반실)","detail":"1시간 당","price":15000,"priceDisplay":"2만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1시간 당","price":5000,"priceDisplay":"5,000원"}]'::jsonb,
    price_range = '빈소 2~2만원 / 안치실 1만원'
WHERE id = '10380647';

-- 성남시장례식장 (성남시의료원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"7호실(일)","detail":"157㎡","price":480000,"priceDisplay":"48만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"8호실(일)","detail":"170.37㎡","price":480000,"priceDisplay":"48만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"9호실(일)","detail":"329.59㎡","price":960000,"priceDisplay":"96만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"4호실(일)","detail":"115㎡","price":360000,"priceDisplay":"36만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"1호실(일)","detail":"105㎡","price":360000,"priceDisplay":"36만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"6호실(일)","detail":"157㎡","price":480000,"priceDisplay":"48만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"2호실(일)","detail":"109㎡","price":360000,"priceDisplay":"36만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"3호실(일)","detail":"109㎡","price":360000,"priceDisplay":"36만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"5호실(시간)","detail":"115㎡","price":15000,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"4호실(시간)","detail":"115㎡","price":15000,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"6호실(시간)","detail":"157㎡","price":20000,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"7호실(시간)","detail":"157㎡","price":20000,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"3호실(시간)","detail":"109㎡","price":15000,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"5호실(일)","detail":"115㎡","price":360000,"priceDisplay":"36만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"2호실(시간)","detail":"109㎡","price":15000,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"8호실(시간)","detail":"170.37㎡","price":20000,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"1호실(시간)","detail":"105㎡","price":15000,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"9호실(시간)","detail":"329.59㎡","price":40000,"priceDisplay":"4만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실사용료","detail":"900㎡","price":2500,"priceDisplay":"2,500원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실사용료","detail":"900㎡","price":60000,"priceDisplay":"6만원"}]'::jsonb,
    price_range = '빈소 2~96만원 / 안치실 0만원'
WHERE id = '25613885';

-- 경상북도안동의료원 장례식장 국화원 (안동의료원 장례식장 국화원)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"3분향실","detail":"1일(24시간)","price":400000,"priceDisplay":"40만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"2분향실","detail":"1일(24시간)","price":500000,"priceDisplay":"50만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"1분향실","detail":"1일(24시간)","price":700000,"priceDisplay":"70만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"5분향실","detail":"1일(24시간)","price":300000,"priceDisplay":"30만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특실","detail":"1일(24시간)","price":1200000,"priceDisplay":"120만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1구(24시간)","price":70000,"priceDisplay":"7만원"}]'::jsonb,
    price_range = '빈소 30~120만원 / 안치실 7만원'
WHERE id = '14650808';

-- 신진주시민장례식장 ((주)시민장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1일","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '안치실 10만원'
WHERE id = '585349373';

-- 성애병원 장례식장 (광명성애병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장임대료","detail":"123층 특별빈소(1실24시간기준)","price":900000,"priceDisplay":"90만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장임대료","detail":"1층 개인빈소(1실24시간기준)","price":800000,"priceDisplay":"80만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장임대료","detail":"특1호실(1실24시간기준)","price":1000000,"priceDisplay":"100만원"}]'::jsonb,
    price_range = '빈소 80~100만원'
WHERE id = '8416993';

-- 백병원 소노아임레디 장례식장 (백병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"기타","name":"안치실","detail":"특수사체 / 1시간","price":10000,"priceDisplay":"1만원"},{"category":"안치실이용료","subCategory":"기타","name":"안치실","detail":"일반사체 / 1시간","price":8000,"priceDisplay":"8,000원"}]'::jsonb,
    price_range = '안치실 1만원'
WHERE id = '10388669';

-- 여수보람장례식장 (여수보람장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실 사용료","detail":"시간당 요금","price":8000,"priceDisplay":"8,000원"}]'::jsonb,
    price_range = '안치실 1만원'
WHERE id = '34568868';

-- 하늘가장례식장 ((재)하늘가장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소사용료(특호실)143평 24시간","detail":"상주휴게실접객실빈소샤워실주방","price":1080000,"priceDisplay":"108만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소사용료(102호)76평 24시간","detail":"상주휴게실접객실빈소샤워실주방","price":720000,"priceDisplay":"72만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소사용료(101호)31평 24시간","detail":"상주휴게실접객실빈소샤워실주방","price":480000,"priceDisplay":"48만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소사용료(VIP실)170평 24시간","detail":"회의실상주휴계실 2실접객실빈소샤워실주방","price":1440000,"priceDisplay":"144만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료 24시간","detail":"안치냉장고사용료","price":120000,"priceDisplay":"12만원"}]'::jsonb,
    price_range = '빈소 48~144만원 / 안치실 12만원'
WHERE id = '26617565';

-- 새진교장례식장 (새진교장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"접객실","name":"접객실","detail":"1실/24시간 기준(45평)","price":315000,"priceDisplay":"32만원"},{"category":"시설임대료","subCategory":"접객실","name":"접객실(특)","detail":"1실/24시간 기준(100평)","price":700000,"priceDisplay":"70만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1실/24시간 기준","price":50000,"priceDisplay":"5만원"}]'::jsonb,
    price_range = '빈소 32~70만원 / 안치실 5만원'
WHERE id = '11654451';

-- 인천광역시의료원 장례식장 (인천광역시의료원 장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실료","detail":"403호 (122.57㎡) 1일/24시간 기준","price":450000,"priceDisplay":"45만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실료","detail":"101호  (170.95㎡) 1일/24시간 기준","price":700000,"priceDisplay":"70만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실료","detail":"401호 (123.38㎡) 1일/24시간 기준","price":450000,"priceDisplay":"45만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실료","detail":"201호 (379.60㎡) 1일/24시간 기준","price":1500000,"priceDisplay":"150만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실료","detail":"301 302호 (189.80㎡) 1일/24시간 기준","price":750000,"priceDisplay":"75만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실료","detail":"102호 (169㎡) 1일/24시간 기준","price":700000,"priceDisplay":"70만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실료","detail":"402호 (133.65㎡) 1일/24시간 기준","price":550000,"priceDisplay":"55만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실료 (감염)","detail":"1일(100000) / 시간(4200)","price":100000,"priceDisplay":"10만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실료 (일반)","detail":"1일(50000) / 시간(2100)","price":50000,"priceDisplay":"5만원"}]'::jsonb,
    price_range = '빈소 45~150만원 / 안치실 5만원'
WHERE id = '8052478';

-- 천안국빈장례식장 (보람상조라이프(주)천안국빈장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"3층8호(1일 840000원)  1시간(35000원)","detail":"100 평형","price":35000,"priceDisplay":"4만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"3층6호(1일 1200000원)  1시간 (50000원)","detail":"130 평형","price":50000,"priceDisplay":"5만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"2층3호(1일 840000원)  1시간(35000원)","detail":"100 평형","price":35000,"priceDisplay":"4만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"2층VIP호(1일 1440000원)  1시간(60000원)","detail":"160 평형","price":60000,"priceDisplay":"6만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"2층1호(1일 1200000원)  1시간 (50000원)","detail":"130 평형","price":50000,"priceDisplay":"5만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"3층VIP호(1일 1440000원)  1시간(60000원)","detail":"160 평형","price":60000,"priceDisplay":"6만원"},{"category":"안치실이용료","subCategory":"일반","name":"감염성사망자(코로나)입관실 사용료","detail":"1회","price":300000,"priceDisplay":"30만원"},{"category":"안치실이용료","subCategory":"일반","name":"1일 (120000원)   1시간 (5000원)","detail":"8 평형","price":5000,"priceDisplay":"5,000원"}]'::jsonb,
    price_range = '빈소 4~6만원 / 안치실 1만원'
WHERE id = '1437840505';

-- 동신병원장례식장 (동신병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"2호(45평)","detail":"분향실 및 접객실(시간당)","price":25000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"3호(60평)","detail":"분향실 및 접객실(시간당)","price":30000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"1호(50평)","detail":"분향실 및 접객실(시간당)","price":27000,"priceDisplay":"3만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"안치냉장고사용료(시간당)","price":4000,"priceDisplay":"4,000원"}]'::jsonb,
    price_range = '빈소 3~3만원 / 안치실 0만원'
WHERE id = '15450856';

-- 다사랑중앙병원 (다사랑중앙병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"안치실","price":5000,"priceDisplay":"5,000원"}]'::jsonb,
    price_range = '안치실 1만원'
WHERE id = '27209985';

-- 이대목동병원장례식장 (이대목동병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1실/24시간 기준","price":96000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '안치실 10만원'
WHERE id = '17578473';

-- 진도전남병원 장례식장 (진도전남병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"","name":"안치료","detail":"1일","price":75000,"priceDisplay":"8만원"}]'::jsonb,
    price_range = '안치실 8만원'
WHERE id = '11724951';

-- 세웅병원 장례예식장 (세웅병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료","detail":"입관 . 염습실","price":200000,"priceDisplay":"20만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료","detail":"5호실 (1일 24시간)","price":300000,"priceDisplay":"30만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료","detail":"1호실 (1일 24시간)","price":400000,"priceDisplay":"40만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료","detail":"3호실 (1일 24시간)","price":350000,"priceDisplay":"35만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료 5호실","detail":"수급자 - 50% 감면","price":150000,"priceDisplay":"15만원"},{"category":"안치실이용료","subCategory":"빈소+접객실","name":"안치실 이용료","detail":"안치료 (1일24시간기준)","price":150000,"priceDisplay":"15만원"}]'::jsonb,
    price_range = '빈소 15~40만원 / 안치실 15만원'
WHERE id = '7950004';

-- 아너스힐병원 장례식장 (아너스힐병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"VIP3호","detail":"1일180평","price":960000,"priceDisplay":"96만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특2호","detail":"1일 100평","price":960000,"priceDisplay":"96만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특1호","detail":"1일 120평","price":1800000,"priceDisplay":"180만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"VIP5호","detail":"1일 60평","price":840000,"priceDisplay":"84만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일","price":120000,"priceDisplay":"12만원"},{"category":"안치실이용료","subCategory":"기타","name":"임관실 사용료","detail":"","price":300000,"priceDisplay":"30만원"},{"category":"안치실이용료","subCategory":"기타","name":"현장수습/인건비/출동비","detail":"","price":300000,"priceDisplay":"30만원"},{"category":"안치실이용료","subCategory":"기타","name":"염습비","detail":"","price":350000,"priceDisplay":"35만원"}]'::jsonb,
    price_range = '빈소 84~180만원 / 안치실 12만원'
WHERE id = '2145468432';

-- 좋은강안병원 장례식장 ((주) 비케이더블유 좋은강안병원지점)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1일 100000 시간4000","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '안치실 10만원'
WHERE id = '9402351';

-- 가톨릭대학교 인천성모병원 장례식장 (인천성모장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"12호실","detail":"82㎡","price":312000,"priceDisplay":"31만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"37호실","detail":"214㎡","price":960000,"priceDisplay":"96만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"811호실","detail":"165㎡","price":720000,"priceDisplay":"72만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"15호실","detail":"280㎡","price":1392000,"priceDisplay":"139만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"10호실","detail":"396㎡","price":2136000,"priceDisplay":"214만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"9호실","detail":"462㎡","price":2424000,"priceDisplay":"242만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"26호실","detail":"264㎡","price":1272000,"priceDisplay":"127만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일","price":120000,"priceDisplay":"12만원"}]'::jsonb,
    price_range = '빈소 31~242만원 / 안치실 12만원'
WHERE id = '26511168';

-- 강화장례식장 (강화장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실 1호. 2호 분향실","detail":"시간당30000(현재100%할인 상조50%할인)","price":720000,"priceDisplay":"72만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실 5호 6호 분향실","detail":"시간당26000(현재100%할인 상조50%할인)","price":624000,"priceDisplay":"62만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일 100000","price":300000,"priceDisplay":"30만원"}]'::jsonb,
    price_range = '빈소 62~72만원 / 안치실 30만원'
WHERE id = '8742002';

-- 추병원 장례식장 (추병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"일반실 (분향실접객실)","detail":"시간당","price":16000,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특   실 (분향실접객실)","detail":"시간당","price":22000,"priceDisplay":"2만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"시간당","price":8000,"priceDisplay":"8,000원"}]'::jsonb,
    price_range = '빈소 2~2만원 / 안치실 1만원'
WHERE id = '10844345';

-- 인천세종병원 장례식장 (세종병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실임대료(1호실)","detail":"1시간기준","price":30000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실임대료(3호실)","detail":"1시간기준","price":12500,"priceDisplay":"1만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실임대료(2호실","detail":"1시간기준","price":21000,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실임대료(특실)","detail":"1시간기준","price":40000,"priceDisplay":"4만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1시간기준","price":5000,"priceDisplay":"5,000원"}]'::jsonb,
    price_range = '빈소 1~4만원 / 안치실 1만원'
WHERE id = '1378506996';

-- 청기와장례식장 계양점 (청기와장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실사용료","detail":"1실/24시간기준","price":120000,"priceDisplay":"12만원"}]'::jsonb,
    price_range = '안치실 12만원'
WHERE id = '27379131';

-- 광주병원 장례식장 (광주병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"접객실","name":"접객실(특실)","detail":"1일","price":800000,"priceDisplay":"80만원"},{"category":"시설임대료","subCategory":"접객실","name":"접객실(일반실)","detail":"1일","price":600000,"priceDisplay":"60만원"},{"category":"안치실이용료","subCategory":"일반","name":"냉동실","detail":"1일","price":120000,"priceDisplay":"12만원"}]'::jsonb,
    price_range = '빈소 60~80만원 / 안치실 12만원'
WHERE id = '16515816';

-- 한마음효요양병원 장례식장 (한마음효장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실2호 사용료","detail":"24시간(시간당20000원)","price":480000,"priceDisplay":"48만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실1호 사용료","detail":"24시간(시간당21000원)","price":504000,"priceDisplay":"50만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실3호 사용료","detail":"24시간(시간당8000원)","price":192000,"priceDisplay":"19만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"24시간(시간당2500원)","price":60000,"priceDisplay":"6만원"}]'::jsonb,
    price_range = '빈소 19~50만원 / 안치실 6만원'
WHERE id = '19603737';

-- 인제대학교 해운대백병원 장례식장 (백병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"기타","name":"안치실","detail":"특수사체 / 1시간","price":10000,"priceDisplay":"1만원"},{"category":"안치실이용료","subCategory":"기타","name":"안치실","detail":"일반사체 / 1시간","price":8000,"priceDisplay":"8,000원"}]'::jsonb,
    price_range = '안치실 1만원'
WHERE id = '13052150';

-- 남악장례식장 (남악장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"","name":"안치실냉장고가용료","detail":"20.2","price":240000,"priceDisplay":"24만원"}]'::jsonb,
    price_range = '안치실 24만원'
WHERE id = '221507800';

-- 동안산병원 장례식장 (동안산병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1시간","price":5000,"priceDisplay":"5,000원"}]'::jsonb,
    price_range = '안치실 1만원'
WHERE id = '25733738';

-- 광양우리병원 장례식장 (광양우리병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"3호실(1시간)","detail":"165.5 m2","price":30000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"2호실(1시간)","detail":"165.5 m2","price":30000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"VIP실(1시간)","detail":"331 m2","price":55000,"priceDisplay":"6만원"},{"category":"안치실이용료","subCategory":"일반","name":"페기물처리비","detail":".","price":100000,"priceDisplay":"10만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":".","price":100000,"priceDisplay":"10만원"},{"category":"안치실이용료","subCategory":"일반","name":"초렴/수시/검시","detail":".","price":100000,"priceDisplay":"10만원"},{"category":"안치실이용료","subCategory":"일반","name":"염습비","detail":".","price":100000,"priceDisplay":"10만원"},{"category":"안치실이용료","subCategory":"일반","name":"입관실사용료","detail":".","price":300000,"priceDisplay":"30만원"}]'::jsonb,
    price_range = '빈소 3~6만원 / 안치실 10만원'
WHERE id = '1673261260';

-- 삼육병원 장례식장 (삼육병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료","detail":"75평 (1일/24시간 기준)","price":500000,"priceDisplay":"50만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료","detail":"97평 (1일/24시간 기준)","price":900000,"priceDisplay":"90만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료","detail":"178평 (1일/24시간 기준)","price":1300000,"priceDisplay":"130만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료","detail":"156평 (1일/24시간 기준)","price":1100000,"priceDisplay":"110만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 임대료","detail":"79평 (1일/24시간 기준)","price":700000,"priceDisplay":"70만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실 이용료","detail":"1일/24시간 기준","price":80000,"priceDisplay":"8만원"},{"category":"안치실이용료","subCategory":"기타","name":"안치실 이용료 (사고사)","detail":"1일/24시간 기준","price":150000,"priceDisplay":"15만원"}]'::jsonb,
    price_range = '빈소 50~130만원 / 안치실 8만원'
WHERE id = '18914656';

-- 구호전장례식장 (구호전장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향 접객실 사용료","detail":"1일/ 수용인원 약250명 (201호)","price":1600000,"priceDisplay":"160만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향 접객실 사용료","detail":"1일/ 수용인원 약120명 (302호)","price":800000,"priceDisplay":"80만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향 접객실 사용료","detail":"1일/ 수용인원 약140명 (101호)","price":1200000,"priceDisplay":"120만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향 접객실 사용료","detail":"1일/ 수용인원 약120명 (402호)","price":800000,"priceDisplay":"80만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향 접객실 사용료","detail":"1일/ 수용인원 약130명 (401호)","price":1000000,"priceDisplay":"100만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향 접객실 사용료","detail":"1일/ 수용인원 약130명 (301호)","price":1000000,"priceDisplay":"100만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향 접객실 사용료","detail":"1일/ 수용인원 약120명 (별관vip실)","price":1200000,"priceDisplay":"120만원"},{"category":"안치실이용료","subCategory":"일반","name":"고인 안치 냉장고 사용료","detail":"1일/ 사용일 요금부과","price":150000,"priceDisplay":"15만원"}]'::jsonb,
    price_range = '빈소 80~160만원 / 안치실 15만원'
WHERE id = '27320769';

-- 우리병원 장례식장 (광양우리병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"3호실(1시간)","detail":"165.5 m2","price":30000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"2호실(1시간)","detail":"165.5 m2","price":30000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"VIP실(1시간)","detail":"331 m2","price":55000,"priceDisplay":"6만원"},{"category":"안치실이용료","subCategory":"일반","name":"페기물처리비","detail":".","price":100000,"priceDisplay":"10만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":".","price":100000,"priceDisplay":"10만원"},{"category":"안치실이용료","subCategory":"일반","name":"초렴/수시/검시","detail":".","price":100000,"priceDisplay":"10만원"},{"category":"안치실이용료","subCategory":"일반","name":"염습비","detail":".","price":100000,"priceDisplay":"10만원"},{"category":"안치실이용료","subCategory":"일반","name":"입관실사용료","detail":".","price":300000,"priceDisplay":"30만원"}]'::jsonb,
    price_range = '빈소 3~6만원 / 안치실 10만원'
WHERE id = '14650870';

-- 녹동현대병원 장례식장 (녹동현대병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소료 (특)","detail":"접객실분향실상주방(HR) 시간당","price":35000,"priceDisplay":"4만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소료 (일반)","detail":"접객실분향실상주방(HR) 시간당","price":30000,"priceDisplay":"3만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"안치 (HR) 시간당","price":4000,"priceDisplay":"4,000원"}]'::jsonb,
    price_range = '빈소 3~4만원 / 안치실 0만원'
WHERE id = '8229570';

-- 함평성심병원 장례식장 (함평성심병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"접객실분향소","detail":"접객실분향소","price":300000,"priceDisplay":"30만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"안치료","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 30만원 / 안치실 10만원'
WHERE id = '9585509';

-- 광주기독병원 장례식장 (광주기독병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"접객실","name":"접객실 임대료_수급자국가유공자장애인","detail":"1일","price":300000,"priceDisplay":"30만원"},{"category":"시설임대료","subCategory":"접객실","name":"접객실 임대료","detail":"1일","price":700000,"priceDisplay":"70만원"}]'::jsonb,
    price_range = '빈소 30~70만원'
WHERE id = '8231207';

-- 영암장례식장 (영암장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1일기준","price":80000,"priceDisplay":"8만원"}]'::jsonb,
    price_range = '안치실 8만원'
WHERE id = '8005323';

-- e좋은병원 장례식장 (e좋은병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소 접객실 사용료","detail":"특1호실 (1시간 기준)","price":25000,"priceDisplay":"3만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소 접객실 사용료","detail":"2 호실 (1시간 기준)","price":20000,"priceDisplay":"2만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소 접객실 사용료","detail":"23호실 (1시간 기준)","price":15000,"priceDisplay":"2만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일기준","price":120000,"priceDisplay":"12만원"}]'::jsonb,
    price_range = '빈소 2~3만원 / 안치실 12만원'
WHERE id = '853085509';

-- 미래한국병원 장례식장 (한국병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일(24시간)","price":75000,"priceDisplay":"8만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실 사용료","detail":"1시간당","price":5000,"priceDisplay":"5,000원"},{"category":"안치실이용료","subCategory":"기타","name":"시설임대료","detail":"염습실 대여료","price":200000,"priceDisplay":"20만원"},{"category":"안치실이용료","subCategory":"기타","name":"시설임대료","detail":"안치실","price":72000,"priceDisplay":"7만원"}]'::jsonb,
    price_range = '안치실 1만원'
WHERE id = '21349611';

-- 일산복음병원 장례식장 (복음병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"2호실","detail":"1일 사용료","price":500000,"priceDisplay":"50만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"VIP실","detail":"1일사용료","price":800000,"priceDisplay":"80만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특실","detail":"1일사용료","price":600000,"priceDisplay":"60만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"1호실","detail":"1일사용료","price":500000,"priceDisplay":"50만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일 사용료","price":140000,"priceDisplay":"14만원"}]'::jsonb,
    price_range = '빈소 50~80만원 / 안치실 14만원'
WHERE id = '8526438';

-- 시흥누리병원 장례식장 (시흥누리병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"특2호실","detail":"1일","price":600000,"priceDisplay":"60만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"일3호실","detail":"1일","price":396000,"priceDisplay":"40만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특1호실","detail":"1일","price":792000,"priceDisplay":"79만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"vip호실","detail":"1일","price":1080000,"priceDisplay":"108만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"시간당","price":6000,"priceDisplay":"6,000원"}]'::jsonb,
    price_range = '빈소 40~108만원 / 안치실 1만원'
WHERE id = '8717810';

-- 광주수완장례식장 (광주수완장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향소및접객실","detail":"3층한실","price":1600000,"priceDisplay":"160만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향소및접객실","detail":"1층101호(1일기준)","price":1000000,"priceDisplay":"100만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향소및접객실","detail":"2층vip실(1일기준)","price":1800000,"priceDisplay":"180만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향소및접객실","detail":"2층특실(1일기준)","price":1300000,"priceDisplay":"130만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향소및접객실","detail":"3층특실","price":1300000,"priceDisplay":"130만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향소및접객실","detail":"1층102호(1일기준)","price":1000000,"priceDisplay":"100만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1일기준","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 100~180만원 / 안치실 10만원'
WHERE id = '27163091';

-- 고령전문장례식장 (고령전문장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"특실100평=빈소+접객실+가족실1+가족실2","detail":"1일/24시간 기준","price":600000,"priceDisplay":"60만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일/24시간 기준","price":80000,"priceDisplay":"8만원"}]'::jsonb,
    price_range = '빈소 60만원 / 안치실 8만원'
WHERE id = '10160563';

-- 강북휴요양병원 장례식장 (강북휴요양병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"특1호실  특2호실 특3호실","detail":"200제곱미터","price":1500000,"priceDisplay":"150만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"일반5호실 일반6호실 일반7호실","detail":"150제곱미터","price":1200000,"priceDisplay":"120만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1667/H","price":80000,"priceDisplay":"8만원"}]'::jsonb,
    price_range = '빈소 120~150만원 / 안치실 8만원'
WHERE id = '1496895027';

-- 구병원장례식장 (구병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"3분향실","detail":"1일/24시간기준 시간당 23.000","price":552000,"priceDisplay":"55만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"2분향실","detail":"1일/24시간기준  시간당 32.000","price":768000,"priceDisplay":"77만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"1분향실","detail":"1일/24시간기준 시간당 35.000","price":840000,"priceDisplay":"84만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"1일 안치료","price":96000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 55~84만원 / 안치실 10만원'
WHERE id = '9657247';

-- 윤서병원 장례식장 (윤서병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"특5호실","detail":"1일 24시간 기준","price":400000,"priceDisplay":"40만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특3호실","detail":"1일 24시간 기준","price":576000,"priceDisplay":"58만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"특1호실","detail":"1일 24시간 기준","price":672000,"priceDisplay":"67만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"VIP실","detail":"1일 24시간 기준","price":792000,"priceDisplay":"79만원"},{"category":"안치실이용료","subCategory":"기타","name":"안치관리비","detail":"1일 24시간 기준","price":144000,"priceDisplay":"14만원"}]'::jsonb,
    price_range = '빈소 40~79만원 / 안치실 14만원'
WHERE id = '18658319';

-- 송탄중앙병원 장례식장 (송탄중앙병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"특실","detail":"330.57. m2","price":800000,"priceDisplay":"80만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"1호실","detail":"165.28 .m2","price":500000,"priceDisplay":"50만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"2호실","detail":"198.34. m2","price":600000,"priceDisplay":"60만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"귀빈실","detail":"396.69. m2","price":960000,"priceDisplay":"96만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"199.17. m2 / 일","price":120000,"priceDisplay":"12만원"}]'::jsonb,
    price_range = '빈소 50~96만원 / 안치실 12만원'
WHERE id = '1355774116';

-- 동마산병원 장례식장 (동마산장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일","price":80000,"priceDisplay":"8만원"}]'::jsonb,
    price_range = '안치실 8만원'
WHERE id = '17085708';

-- 대전동부요양병원 장례식장 (동부요양병원 장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"","price":3000,"priceDisplay":"3,000원"}]'::jsonb,
    price_range = '안치실 0만원'
WHERE id = '27455373';

-- 인천사랑병원장례식장 (인천사랑병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료(1구당)","detail":"시간 2300원(1일기준)","price":55200,"priceDisplay":"6만원"}]'::jsonb,
    price_range = '안치실 6만원'
WHERE id = '10443766';

-- 인하대병원장례식장 (인하대병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"12시간이상24시간 미만은 1일로 산정. -12시간 미만 시간단위 1시간 미만은 1시간 산정.","price":3750,"priceDisplay":"3,750원"}]'::jsonb,
    price_range = '안치실 0만원'
WHERE id = '17577742';

-- 인천기독병원장례식장 (인천기독병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"특실 80평","detail":"264 ㎡ (1일)","price":840000,"priceDisplay":"84만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"1호실 60평","detail":"151 ㎡ (1일)","price":600000,"priceDisplay":"60만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"(1일)","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '빈소 60~84만원 / 안치실 10만원'
WHERE id = '10745218';

-- 용인서울병원 장례식장 (용인서울병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1시간(5000원)","price":50000,"priceDisplay":"5만원"}]'::jsonb,
    price_range = '안치실 5만원'
WHERE id = '8021574';

-- 예산명지병원장례식장 (예산명지병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '안치실 10만원'
WHERE id = '21361422';

-- 보람인천장례식장 (보람인천장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"201호 (50평)","detail":"분향실/접객실/유족휴게실/샤워실-1일(24시간)","price":624000,"priceDisplay":"62만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"VVIP실 (136평)","detail":"분향실/접객실/유족휴게실/샤워실-1일(24시간)","price":1440000,"priceDisplay":"144만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"203호 (60평)","detail":"분향실/접객실/유족휴게실/샤워실-1일(24시간)","price":984000,"priceDisplay":"98만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"202호 (65평)","detail":"분향실/접객실/유족휴게실/샤워실-1일(24시간)","price":984000,"priceDisplay":"98만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"VIP실 (118평)","detail":"분향실/접객실/유족휴게실/샤워실-1일(24시간)","price":1200000,"priceDisplay":"120만원"},{"category":"안치실이용료","subCategory":"","name":"안치실","detail":"안치실-1일(24시간)","price":120000,"priceDisplay":"12만원"}]'::jsonb,
    price_range = '빈소 62~144만원 / 안치실 12만원'
WHERE id = '14500174';

-- 인제장례식장 (인제장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 빈소 임대료(5호실)","detail":"1일/24시간","price":240000,"priceDisplay":"24만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 빈소 임대료(3호실)","detail":"1일/24시간","price":240000,"priceDisplay":"24만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 빈소 임대료(2호실)","detail":"1일/24시간","price":240000,"priceDisplay":"24만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 빈소 임대료(1호실)","detail":"1일/24시간","price":240000,"priceDisplay":"24만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"장례식장 빈소 임대료(특1호실)","detail":"1일/24시간","price":360000,"priceDisplay":"36만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일/24시간","price":120000,"priceDisplay":"12만원"}]'::jsonb,
    price_range = '빈소 24~36만원 / 안치실 12만원'
WHERE id = '20146429';

-- 오차드장례식장 ((의)동재의료재단오차드장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소접객실상주방욕실주방","detail":"특3호실 2박3일","price":1800000,"priceDisplay":"180만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소접객실상주방욕실주방","detail":"특2호실 2박3일","price":1800000,"priceDisplay":"180만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소접객실상주방욕실주방","detail":"특1호실 2박3일","price":1900000,"priceDisplay":"190만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"2박3일","price":400000,"priceDisplay":"40만원"}]'::jsonb,
    price_range = '빈소 180~190만원 / 안치실 40만원'
WHERE id = '25649669';

-- 오수장례식장 (오수장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일24시간","price":48000,"priceDisplay":"5만원"}]'::jsonb,
    price_range = '안치실 5만원'
WHERE id = '10079761';

-- 온고을장례식장 (온고을장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소임대료24시간","detail":"60평","price":750000,"priceDisplay":"75만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소임대료24시간","detail":"200평","price":1560000,"priceDisplay":"156만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소임대료24시간","detail":"100평","price":1100000,"priceDisplay":"110만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소임대료24시간","detail":"60평","price":750000,"priceDisplay":"75만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"빈소임대료24시간","detail":"100평","price":1100000,"priceDisplay":"110만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실","detail":"안치료 1일","price":80000,"priceDisplay":"8만원"}]'::jsonb,
    price_range = '빈소 75~156만원 / 안치실 8만원'
WHERE id = '26418581';

-- 천안삼거리국화원장례식장 (천안삼거리국화원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1시간- 2000원(시간제)","price":48000,"priceDisplay":"5만원"}]'::jsonb,
    price_range = '안치실 5만원'
WHERE id = '2094480190';

-- 부산영락공원장례식장 (부산영락공원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실 사용료","detail":"1일 /  24시간(타시도)","price":100000,"priceDisplay":"10만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실 사용료","detail":"1일 / 24시간(부산 경남 울산)","price":50000,"priceDisplay":"5만원"}]'::jsonb,
    price_range = '안치실 5만원'
WHERE id = '621580905';

-- 온누리장례식장 (순창온누리장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치실사용료","detail":"1일","price":80000,"priceDisplay":"8만원"}]'::jsonb,
    price_range = '안치실 8만원'
WHERE id = '27518373';

-- 동산병원장례식장 (계명대학교경주동산병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실(특실B1호)","detail":"1일","price":750000,"priceDisplay":"75만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실(특실101호)","detail":"1일","price":810000,"priceDisplay":"81만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실(202호)","detail":"1일","price":570000,"priceDisplay":"57만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실(특실201호)","detail":"1일","price":840000,"priceDisplay":"84만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향실(VIP실)","detail":"1일","price":1320000,"priceDisplay":"132만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일","price":67200,"priceDisplay":"7만원"}]'::jsonb,
    price_range = '빈소 57~132만원 / 안치실 7만원'
WHERE id = '7814178';

-- 하남성심병원 장례식장 (하남성심병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"24시간 기준(3일 장례시 2일요금 적용)","price":100000,"priceDisplay":"10만원"}]'::jsonb,
    price_range = '안치실 10만원'
WHERE id = '10859708';

-- 정읍아산병원장례식장 (정읍아산병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"기타","name":"고인 안치비","detail":"시간당","price":8000,"priceDisplay":"8,000원"}]'::jsonb,
    price_range = '안치실 1만원'
WHERE id = '17573832';

-- 하늘재전문장례식장 (하늘재전문장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일","price":80000,"priceDisplay":"8만원"}]'::jsonb,
    price_range = '안치실 8만원'
WHERE id = '8123852';

-- 아라한국병원 장례식장 (한국병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일(24시간)","price":75000,"priceDisplay":"8만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치실 사용료","detail":"1시간당","price":5000,"priceDisplay":"5,000원"},{"category":"안치실이용료","subCategory":"기타","name":"시설임대료","detail":"염습실 대여료","price":200000,"priceDisplay":"20만원"},{"category":"안치실이용료","subCategory":"기타","name":"시설임대료","detail":"안치실","price":72000,"priceDisplay":"7만원"}]'::jsonb,
    price_range = '안치실 1만원'
WHERE id = '1061863624';

-- 단양장례식장 (단양장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향1호실","detail":"1일","price":504000,"priceDisplay":"50만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향2호실","detail":"1일","price":384000,"priceDisplay":"38만원"},{"category":"시설임대료","subCategory":"빈소+접객실","name":"분향3호실","detail":"1일","price":600000,"priceDisplay":"60만원"},{"category":"안치실이용료","subCategory":"일반","name":"안치료","detail":"1일","price":70000,"priceDisplay":"7만원"}]'::jsonb,
    price_range = '빈소 38~60만원 / 안치실 7만원'
WHERE id = '11362121';

-- 쉴낙원 세종충남대학교병원장례식장 (충남대학교병원장례식장)
UPDATE memorial_spaces
SET prices = '[{"category":"안치실이용료","subCategory":"기타","name":"감염증 사망자/일","detail":"감염병 사망자 적용","price":100000,"priceDisplay":"10만원"},{"category":"안치실이용료","subCategory":"기타","name":"시간당","detail":"공정거래위원회 권장기준 적용","price":2000,"priceDisplay":"2,000원"}]'::jsonb,
    price_range = '안치실 0만원'
WHERE id = '2083835471';

