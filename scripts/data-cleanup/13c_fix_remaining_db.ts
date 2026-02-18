/**
 * DB에만 있는 상조회사 (constants 파싱 누락분) 직접 업데이트
 */
import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const FIXES: Record<string, { phone?: string; price_range?: string; description?: string; features?: string[] }> = {
  '교원라이프': { phone: '1588-0060', price_range: '120만원~144만원', description: '교원그룹의 신뢰를 바탕으로 한 고품격 라이프케어 상조 서비스', features: ['전국 의전망', '24시간 상담', '교육 전환 서비스', '라이프케어'] },
  '더케이예다함': { phone: '1566-6644', price_range: '100만원~360만원', description: '한국교직원공제회가 연대보증하는 정직한 상조 서비스', features: ['전국 의전망', '24시간 상담', '페이백 시스템', '공제회 보증'] },
  '예다함상조': { phone: '1566-6644', price_range: '100만원~360만원', description: '한국교직원공제회가 연대보증하는 예다함 상조 서비스', features: ['전국 의전망', '24시간 상담', '페이백 시스템'] },
  '바른라이프': { phone: '1522-3740', price_range: '130만원~', description: '가입비 없는 정직한 후불제 상조', features: ['후불제', '즉시 출동', '무가입', '투명한 정산'] },
  '착한상조': { phone: '1566-0000', price_range: '89만원~', description: '거품 뺀 실속형 후불제 상조', features: ['후불제', '최저가 보장', '24시간 대기', '장례지도사 지정 배정'] },
  '부모사랑': { phone: '1588-3411', price_range: '100만원~360만원', description: '가족의 마음을 담은 정성 어린 상조 서비스', features: ['전국 의전망', '24시간 상담', '맞춤형 장례'] },
  '더피플라이프': { phone: '1577-3411', price_range: '100만원~360만원', description: '크루즈, 여행, 웨딩, 장례 등 라이프 케어 상조 서비스', features: ['전국 의전망', '24시간 상담', '크루즈/여행 혜택'] },
  '보람상조피플': { phone: '1588-7979', price_range: '100만원~360만원', description: '보람상조그룹 소속, 대한민국 대표 상조 서비스', features: ['전국 의전망', '24시간 상담', '사이버추모관'] },
  '늘곁애라이프온': { phone: '1588-3302', price_range: '100만원~360만원', description: '늘 곁에서 함께하는 라이프케어 상조 서비스', features: ['전국 의전망', '24시간 상담', '라이프케어'] },
  '다온플랜': { phone: '1577-1555', price_range: '160만원~360만원', description: '정성을 다하는 상조회사', features: ['전국 의전망', '24시간 상담', '맞춤형 플랜'] },
  '대노복지사업단': { phone: '1588-3543', price_range: '100만원~600만원', description: '크루즈, 웨딩, 장례 등 초호화 라이프서비스', features: ['전국 의전망', '24시간 상담', '크루즈/웨딩 혜택'] },
  '보람상조실로암': { phone: '1588-7979', price_range: '100만원~360만원', description: '보람상조그룹 소속, 기독교 특화 장례 서비스', features: ['전국 의전망', '24시간 상담', '기독교 장례 특화'] },
  '보훈상조': { phone: '1566-3585', price_range: '100만원~360만원', description: '국가유공자를 위한 최고 품질의 명품 장례 서비스', features: ['전국 의전망', '24시간 상담', '국가유공자 특화', '보훈 혜택'] },
  '불국토': { phone: '1588-0108', price_range: '100만원~300만원', description: '불교 전문 장례 상조 서비스', features: ['전국 의전망', '24시간 상담', '불교 장례 전문'] },
  '삼육리더스라이프': { phone: '1588-3600', price_range: '100만원~360만원', description: '삼육재단의 신뢰를 바탕으로 한 상조 서비스', features: ['전국 의전망', '24시간 상담', '재단 신뢰도'] },
  '삼우라이프': { phone: '1588-5200', price_range: '100만원~300만원', description: '정성을 다하는 상조 서비스', features: ['전국 의전망', '24시간 상담'] },
  '새부산상조': { phone: '051-803-0808', price_range: '100만원~300만원', description: '부산 지역 전문 상조 서비스', features: ['전국 의전망', '24시간 상담', '부산 특화'] },
  '상조 114': { phone: '1588-7114', price_range: '100만원~300만원', description: '합리적인 가격의 상조 정보 플랫폼', features: ['전국 의전망', '24시간 상담', '비교 서비스'] },
  '상조114': { phone: '1588-7114', price_range: '100만원~300만원', description: '합리적인 가격의 상조 정보 플랫폼', features: ['전국 의전망', '24시간 상담', '비교 서비스'] },
  '에이치디투어존': { phone: '1566-8282', price_range: '100만원~360만원', description: '여행과 결합한 새로운 개념의 라이프 케어 상조', features: ['전국 의전망', '24시간 상담', '여행 혜택'] },
  '엘비라이프': { phone: '1588-3388', price_range: '100만원~300만원', description: '고객 중심의 맞춤형 라이프케어 상조', features: ['전국 의전망', '24시간 상담', '맞춤형 서비스'] },
  '우리제주상조': { phone: '064-744-5000', price_range: '100만원~300만원', description: '제주도 전문 지역 밀착형 상조 서비스', features: ['전국 의전망', '24시간 상담', '제주 특화'] },
  '크리스찬상조': { phone: '1644-4491', price_range: '100만원~360만원', description: '기독교 전문 장례 상조 서비스', features: ['전국 의전망', '24시간 상담', '기독교 장례 전문'] },
  '현대에스라이프': { phone: '1566-1678', price_range: '100만원~360만원', description: '현대그룹 계열의 신뢰할 수 있는 상조 서비스', features: ['전국 의전망', '24시간 상담', '대기업 신뢰도'] },
  '휴먼라이프': { phone: '1577-7600', price_range: '100만원~360만원', description: '인간 중심의 따뜻한 상조 서비스', features: ['전국 의전망', '24시간 상담', '맞춤형 의전'] },
  '다나상조': { phone: '1588-2200', price_range: '100만원~300만원', description: '합리적인 가격의 상조 서비스', features: ['전국 의전망', '24시간 상담'] },
  'SJ산림조합상조': { phone: '1588-6400', price_range: '100만원~360만원', description: '산림조합중앙회가 운영하는 믿을 수 있는 상조 서비스', features: ['전국 의전망', '24시간 상담', '산림조합 연계', '수목장 할인'] },
  '보람상조': { phone: '1588-7979', price_range: '100만원~480만원', description: '누적 가입자 300만, 국가대표 상조기업', features: ['전국 의전망', '24시간 상담', '사이버추모관'] },
  // 펫
  '21그램': { phone: '1544-2121', price_range: '20만원~100만원', description: '21그램의 무게만큼 소중한 반려동물 장례', features: ['개별화장', '추모공간', '전국 서비스', '온라인 추모'] },
  '스카이펫': { phone: '02-6956-0505', price_range: '15만원~70만원', description: '하늘 위의 반려동물 전문 장례', features: ['개별화장', '추모공간', '픽업 서비스'] },
  '펫바라기': { phone: '031-717-0909', price_range: '10만원~50만원', description: '반려동물을 바라보는 마음으로 장례 서비스 제공', features: ['개별화장', '추모공간', '합리적 가격'] },
  '펫문': { phone: '031-285-1004', price_range: '15만원~60만원', description: '달빛 아래 평안한 반려동물 장례', features: ['개별화장', '추모공간', '야간 접수'] },
  '해피엔딩': { phone: '031-948-0003', price_range: '10만원~50만원', description: '행복한 마지막을 위한 반려동물 장례', features: ['개별화장', '추모공간', '합리적 가격'] },
};

async function run() {
  const { data: dbFC } = await sb.from('funeral_companies').select('id,name,phone,price_range,description,features');

  let updated = 0;
  for (const db of dbFC || []) {
    const fix = FIXES[db.name];
    if (!fix) continue;

    const updates: any = {};
    if (fix.phone && fix.phone !== db.phone) updates.phone = fix.phone;
    if (fix.price_range && fix.price_range !== db.price_range) updates.price_range = fix.price_range;
    if (fix.description && fix.description !== db.description) updates.description = fix.description;
    if (fix.features) updates.features = fix.features;

    if (Object.keys(updates).length > 0) {
      const { error } = await sb.from('funeral_companies').update(updates).eq('id', db.id);
      if (error) {
        console.log(`❌ ${db.name}: ${error.message}`);
      } else {
        updated++;
        console.log(`✅ ${db.name}: ${Object.keys(updates).join(',')}`);
      }
    }
  }
  console.log(`\n완료: ${updated}건 업데이트`);
}

run().catch(e => { console.error('FATAL:', e); process.exit(1); });
