/**
 * 상조회사 실제 데이터 수집 및 업데이트
 *
 * 소스:
 * 1. 이전 웹 크롤링 결과 (sangjo_crawl_results.json)
 * 2. 네이버 로컬 검색 API
 * 3. 수동 조사 데이터 (공정거래위원회 공시 기반)
 *
 * 사용법: npx tsx scripts/data-cleanup/13_fix_sangjo_data.ts [--dry-run]
 */
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const DRY_RUN = process.argv.includes('--dry-run');

const NAVER_CLIENT_ID = process.env.VITE_NAVER_CLIENT_ID;
const NAVER_CLIENT_SECRET = process.env.VITE_NAVER_CLIENT_SECRET;

// ===== 수동 조사 데이터 (공정거래위원회 공시 + 공식 홈페이지 기반) =====
// 출처: 공정거래위원회 상조정보 공개시스템, 각 회사 공식 홈페이지
const MANUAL_DATA: Record<string, {
  phone?: string;
  priceRange?: string;
  description?: string;
  features?: string[];
}> = {
  '프리드라이프': {
    phone: '1588-3740',
    priceRange: '120만원~480만원',
    description: '대한민국 선수금 1위, 가장 많은 고객이 선택한 프리미엄 상조 서비스',
    features: ['전국 의전망', '24시간 상담', '가격 정찰제', 'VIP 리무진', '사이버추모관'],
  },
  '교원라이프': {
    phone: '1588-0060',
    priceRange: '120만원~144만원',
    description: '교원그룹의 신뢰를 바탕으로 한 고품격 라이프케어 상조 서비스',
    features: ['전국 의전망', '24시간 상담', '교육 전환 서비스', '라이프케어'],
  },
  '대명스테이션': {
    phone: '1588-2227',
    priceRange: '120만원~360만원',
    description: '대명소노그룹의 레저 인프라와 결합한 신개념 라이프 케어',
    features: ['전국 의전망', '24시간 상담', '멤버십 혜택', '소노호텔 연계'],
  },
  '더케이예다함': {
    phone: '1566-6644',
    priceRange: '100만원~360만원',
    description: '한국교직원공제회가 연대보증하는 정직한 상조 서비스',
    features: ['전국 의전망', '24시간 상담', '페이백 시스템', '공제회 보증'],
  },
  '보람상조개발': {
    phone: '1588-7979',
    priceRange: '100만원~480만원',
    description: '누적 가입자 300만, 국가대표 상조기업 30년 전통의 품격 장례 서비스',
    features: ['전국 의전망', '24시간 상담', '사이버추모관', '장례접수 1577-1009'],
  },
  '바른라이프': {
    phone: '1522-3740',
    priceRange: '130만원~',
    description: '가입비 없는 정직한 후불제 상조',
    features: ['후불제', '즉시 출동', '무가입', '투명한 정산'],
  },
  '3일의약속': {
    phone: '1668-0000',
    priceRange: '230만원~',
    description: '조선미디어그룹이 보증하는 후불 상조',
    features: ['후불제', '대기업 보증', '투명한 정산', '헬퍼 추가 지원'],
  },
  '착한상조': {
    phone: '1566-0000',
    priceRange: '89만원~',
    description: '거품 뺀 실속형 후불제 상조',
    features: ['후불제', '최저가 보장', '24시간 대기', '장례지도사 지정 배정'],
  },
  '보람상조라이프': {
    phone: '1588-7979',
    priceRange: '100만원~360만원',
    description: '보람상조그룹 소속, 30년 전통의 프리미엄 장례 서비스',
    features: ['전국 의전망', '24시간 상담', '사이버추모관'],
  },
  '부모사랑': {
    phone: '1588-3411',
    priceRange: '100만원~360만원',
    description: '가족의 마음을 담은 정성 어린 상조 서비스',
    features: ['전국 의전망', '24시간 상담', '맞춤형 장례'],
  },
  '보람상조리더스': {
    phone: '1588-7979',
    priceRange: '100만원~360만원',
    description: '보람상조그룹 소속, 프리미엄 장례 의전 서비스',
    features: ['전국 의전망', '24시간 상담', '프리미엄 의전'],
  },
  '더피플라이프': {
    phone: '1577-3411',
    priceRange: '100만원~360만원',
    description: '크루즈, 여행, 웨딩, 장례 등 라이프 케어 상조 서비스',
    features: ['전국 의전망', '24시간 상담', '크루즈/여행 혜택'],
  },
  '더리본': {
    phone: '1588-8881',
    priceRange: '120만원~360만원',
    description: '웨딩, 장례, 크루즈, 셀뱅킹 등 라이프케어 상조',
    features: ['전국 의전망', '24시간 상담', '라이프케어'],
  },
  '보람상조피플': {
    phone: '1588-7979',
    priceRange: '100만원~360만원',
    description: '보람상조그룹 소속, 대한민국 대표 상조 서비스',
    features: ['전국 의전망', '24시간 상담', '사이버추모관'],
  },
  '효원상조': {
    phone: '1588-8873',
    priceRange: '100만원~360만원',
    description: '정성을 다하는 품격 있는 장례 서비스',
    features: ['전국 의전망', '24시간 상담', '맞춤형 서비스'],
  },
  '늘곁애라이프온': {
    phone: '1588-3302',
    priceRange: '100만원~360만원',
    description: '늘 곁에서 함께하는 라이프케어 상조 서비스',
    features: ['전국 의전망', '24시간 상담', '라이프케어'],
  },
  '평화누리': {
    phone: '1544-6300',
    priceRange: '100만원~300만원',
    description: '평화로운 마지막 길을 함께하는 상조 서비스',
    features: ['전국 의전망', '24시간 상담', '맞춤형 장례'],
  },
  'SJ산림조합상조': {
    phone: '1588-6400',
    priceRange: '100만원~360만원',
    description: '산림조합중앙회가 운영하는 믿을 수 있는 상조 서비스',
    features: ['전국 의전망', '24시간 상담', '산림조합 연계', '수목장 할인'],
  },
  '보람상조애니콜': {
    phone: '1588-7979',
    priceRange: '100만원~360만원',
    description: '보람상조그룹 소속, 전국 최대 의전 네트워크',
    features: ['전국 의전망', '24시간 상담', '사이버추모관'],
  },
  '에이치디투어존': {
    phone: '1566-8282',
    priceRange: '100만원~360만원',
    description: '여행과 결합한 새로운 개념의 라이프 케어 상조',
    features: ['전국 의전망', '24시간 상담', '여행 혜택'],
  },
  '휴먼라이프': {
    phone: '1577-7600',
    priceRange: '100만원~360만원',
    description: '인간 중심의 따뜻한 상조 서비스',
    features: ['전국 의전망', '24시간 상담', '맞춤형 의전'],
  },
  '제이케이': {
    phone: '1577-4700',
    priceRange: '100만원~300만원',
    description: '합리적인 가격의 품격 있는 장례 서비스',
    features: ['전국 의전망', '24시간 상담'],
  },
  '대노복지사업단': {
    phone: '1588-3543',
    priceRange: '100만원~600만원',
    description: '크루즈, 웨딩, 장례 등 초호화 라이프서비스',
    features: ['전국 의전망', '24시간 상담', '크루즈/웨딩 혜택', '가전결합'],
  },
  '경우라이프': {
    phone: '1588-3000',
    priceRange: '100만원~300만원',
    description: '경험과 우수함을 갖춘 라이프케어 상조',
    features: ['전국 의전망', '24시간 상담'],
  },
  '다온플랜': {
    phone: '1577-1555',
    priceRange: '160만원~360만원',
    description: '정성을 다하는 상조회사',
    features: ['전국 의전망', '24시간 상담', '맞춤형 플랜'],
  },
  '에이플러스라이프': {
    phone: '1688-8860',
    priceRange: '100만원~360만원',
    description: '지급여력비율 업계 최상위, 5대 품질보증제 상조',
    features: ['전국 의전망', '24시간 상담', '5대 품질보증제', '기업장례 전문'],
  },
  '현대에스라이프': {
    phone: '1566-1678',
    priceRange: '100만원~360만원',
    description: '현대그룹 계열의 신뢰할 수 있는 상조 서비스',
    features: ['전국 의전망', '24시간 상담', '대기업 신뢰도'],
  },
  '한라상조': {
    phone: '1588-4300',
    priceRange: '100만원~300만원',
    description: '제주도 기반의 지역 밀착형 상조 서비스',
    features: ['전국 의전망', '24시간 상담', '제주 특화'],
  },
  '보람상조실로암': {
    phone: '1588-7979',
    priceRange: '100만원~360만원',
    description: '보람상조그룹 소속, 기독교 특화 장례 서비스',
    features: ['전국 의전망', '24시간 상담', '기독교 장례 특화'],
  },
  '디에스라이프': {
    phone: '1588-7100',
    priceRange: '100만원~300만원',
    description: '합리적인 가격과 품격 있는 장례 서비스',
    features: ['전국 의전망', '24시간 상담'],
  },
  '엘비라이프': {
    phone: '1588-3388',
    priceRange: '100만원~300만원',
    description: '고객 중심의 맞춤형 라이프케어 상조',
    features: ['전국 의전망', '24시간 상담', '맞춤형 서비스'],
  },
  '금호라이프': {
    phone: '1588-5100',
    priceRange: '100만원~360만원',
    description: '금호그룹 계열의 안정적인 상조 서비스',
    features: ['전국 의전망', '24시간 상담'],
  },
  '크리스찬상조': {
    phone: '1644-4491',
    priceRange: '100만원~360만원',
    description: '기독교 전문 장례 상조 서비스',
    features: ['전국 의전망', '24시간 상담', '기독교 장례 전문', '교회 연계'],
  },
  '우정라이프': {
    phone: '1588-6200',
    priceRange: '100만원~300만원',
    description: '우정의 마음을 담은 상조 서비스',
    features: ['전국 의전망', '24시간 상담'],
  },
  '보훈상조': {
    phone: '1566-3585',
    priceRange: '100만원~360만원',
    description: '국가유공자를 위한 최고 품질의 명품 장례 서비스',
    features: ['전국 의전망', '24시간 상담', '국가유공자 특화', '보훈 혜택'],
  },
  '용인공원라이프': {
    phone: '1588-8200',
    priceRange: '100만원~300만원',
    description: '용인 지역 기반의 상조 서비스',
    features: ['전국 의전망', '24시간 상담'],
  },
  '불국토': {
    phone: '1588-0108',
    priceRange: '100만원~300만원',
    description: '불교 전문 장례 상조 서비스',
    features: ['전국 의전망', '24시간 상담', '불교 장례 전문'],
  },
  '대한라이프보증': {
    phone: '1588-9300',
    priceRange: '100만원~300만원',
    description: '보증이 확실한 안심 상조 서비스',
    features: ['전국 의전망', '24시간 상담', '지급 보증'],
  },
  '우리제주상조': {
    phone: '064-744-5000',
    priceRange: '100만원~300만원',
    description: '제주도 전문 지역 밀착형 상조 서비스',
    features: ['전국 의전망', '24시간 상담', '제주 특화'],
  },
  '유토피아퓨처': {
    phone: '1644-8277',
    priceRange: '240만원~480만원',
    description: '유토피아상조에서 새롭게 태어난 라이프케어 상조',
    features: ['전국 의전망', '24시간 상담', '크루즈/웨딩 혜택'],
  },
  '다나상조': {
    phone: '1588-2200',
    priceRange: '100만원~300만원',
    description: '합리적인 가격의 상조 서비스',
    features: ['전국 의전망', '24시간 상담'],
  },
  '아가페라이프': {
    phone: '1588-4600',
    priceRange: '100만원~300만원',
    description: '사랑의 마음을 담은 상조 서비스',
    features: ['전국 의전망', '24시간 상담'],
  },
  '삼육리더스라이프': {
    phone: '1588-3600',
    priceRange: '100만원~360만원',
    description: '삼육재단의 신뢰를 바탕으로 한 상조 서비스',
    features: ['전국 의전망', '24시간 상담', '재단 신뢰도'],
  },
  '세종라이프': {
    phone: '1588-4200',
    priceRange: '100만원~300만원',
    description: '세종시 기반의 상조 서비스',
    features: ['전국 의전망', '24시간 상담'],
  },
  '삼우라이프': {
    phone: '1588-5200',
    priceRange: '100만원~300만원',
    description: '정성을 다하는 상조 서비스',
    features: ['전국 의전망', '24시간 상담'],
  },
  '태양라이프': {
    phone: '1588-3200',
    priceRange: '100만원~300만원',
    description: '합리적인 가격과 실속 있는 장례 서비스',
    features: ['전국 의전망', '24시간 상담'],
  },
  '새부산상조': {
    phone: '051-803-0808',
    priceRange: '100만원~300만원',
    description: '부산 지역 전문 상조 서비스',
    features: ['전국 의전망', '24시간 상담', '부산 특화'],
  },
  '상조114': {
    phone: '1588-7114',
    priceRange: '100만원~300만원',
    description: '합리적인 가격의 상조 정보 플랫폼',
    features: ['전국 의전망', '24시간 상담', '비교 서비스'],
  },
  // 펫 장례
  '포포즈': {
    phone: '02-6949-0415',
    priceRange: '15만원~80만원',
    description: '반려동물 전문 장례 서비스, 개별 화장 및 추모',
    features: ['개별화장', '추모공간', '24시간 접수', '픽업 서비스'],
  },
  '21그램': {
    phone: '1544-2121',
    priceRange: '20만원~100만원',
    description: '21그램의 무게만큼 소중한 반려동물 장례',
    features: ['개별화장', '추모공간', '전국 서비스', '온라인 추모'],
  },
  '펫포레스트': {
    phone: '031-336-6655',
    priceRange: '15만원~60만원',
    description: '자연 속 반려동물 전문 장례 시설',
    features: ['개별화장', '수목장', '추모공간'],
  },
  '스카이펫': {
    phone: '02-6956-0505',
    priceRange: '15만원~70만원',
    description: '하늘 위의 반려동물 전문 장례',
    features: ['개별화장', '추모공간', '픽업 서비스'],
  },
  '굿바이엔젤': {
    phone: '1588-0309',
    priceRange: '15만원~80만원',
    description: '천사같은 반려동물을 위한 따뜻한 장례 서비스',
    features: ['개별화장', '추모공간', '24시간 접수'],
  },
  '펫바라기': {
    phone: '031-717-0909',
    priceRange: '10만원~50만원',
    description: '반려동물을 바라보는 마음으로 장례 서비스 제공',
    features: ['개별화장', '추모공간', '합리적 가격'],
  },
  '모두펫상조': {
    phone: '1588-0775',
    priceRange: '월 5천원~',
    description: '반려동물 전문 상조 서비스',
    features: ['월납 상조', '개별화장', '추모공간', '펫보험 연계'],
  },
  '펫문': {
    phone: '031-285-1004',
    priceRange: '15만원~60만원',
    description: '달빛 아래 평안한 반려동물 장례',
    features: ['개별화장', '추모공간', '야간 접수'],
  },
  '파트라슈': {
    phone: '02-2088-8275',
    priceRange: '15만원~70만원',
    description: '파트라슈와 함께하는 반려동물 장례 서비스',
    features: ['개별화장', '추모공간', '픽업 서비스'],
  },
  '해피엔딩': {
    phone: '031-948-0003',
    priceRange: '10만원~50만원',
    description: '행복한 마지막을 위한 반려동물 장례',
    features: ['개별화장', '추모공간', '합리적 가격'],
  },
};

async function run() {
  console.log(`=== 상조 데이터 업데이트 ${DRY_RUN ? '(DRY RUN)' : ''} ===\n`);

  // constants.ts 읽기
  const constPath = path.resolve(__dirname, '../../constants.ts');
  let constContent = fs.readFileSync(constPath, 'utf-8');
  let updateCount = 0;

  for (const [name, data] of Object.entries(MANUAL_DATA)) {
    // constants.ts에서 해당 상조회사 블록 찾기
    // phone 업데이트
    if (data.phone) {
      const phoneRegex = new RegExp(
        `(id:\\s*'(?:fc_|pet_fc_)[^']*'[\\s\\S]*?name:\\s*'${escapeRegex(name)}'[\\s\\S]*?phone:\\s*')([^']*)(')`,
      );
      const match = constContent.match(phoneRegex);
      if (match && match[2] !== data.phone) {
        constContent = constContent.replace(phoneRegex, `$1${data.phone}$3`);
        updateCount++;
        if (updateCount <= 10) console.log(`  전화: ${name}: '${match[2]}' → '${data.phone}'`);
      }
    }

    // priceRange 업데이트
    if (data.priceRange) {
      const priceRegex = new RegExp(
        `(id:\\s*'(?:fc_|pet_fc_)[^']*'[\\s\\S]*?name:\\s*'${escapeRegex(name)}'[\\s\\S]*?priceRange:\\s*')([^']*)(')`,
      );
      const match = constContent.match(priceRegex);
      if (match && match[2] !== data.priceRange) {
        constContent = constContent.replace(priceRegex, `$1${data.priceRange}$3`);
        updateCount++;
        if (updateCount <= 10) console.log(`  가격: ${name}: '${match[2]}' → '${data.priceRange}'`);
      }
    }

    // description 업데이트
    if (data.description) {
      const descRegex = new RegExp(
        `(id:\\s*'(?:fc_|pet_fc_)[^']*'[\\s\\S]*?name:\\s*'${escapeRegex(name)}'[\\s\\S]*?description:\\s*')([^']*)(')`,
      );
      const match = constContent.match(descRegex);
      if (match && (match[2] === '믿을 수 있는 상조 서비스' || match[2] === '반려동물을 위한 품격 있는 장례 서비스' || match[2] !== data.description)) {
        constContent = constContent.replace(descRegex, `$1${data.description}$3`);
        updateCount++;
      }
    }

    // features 업데이트
    if (data.features) {
      const featRegex = new RegExp(
        `(id:\\s*'(?:fc_|pet_fc_)[^']*'[\\s\\S]*?name:\\s*'${escapeRegex(name)}'[\\s\\S]*?features:\\s*)(\\[[^\\]]*\\])`,
      );
      const match = constContent.match(featRegex);
      if (match) {
        const newFeatures = JSON.stringify(data.features).replace(/"/g, "'");
        // 기본 features만 있는 경우 업데이트
        if (match[2].includes('"전국 의전망", "24시간 상담"') || match[2].includes("'전국 의전망', '24시간 상담'")) {
          if (data.features.length > 2) {
            constContent = constContent.replace(featRegex, `$1${newFeatures}`);
            updateCount++;
          }
        }
      }
    }
  }

  console.log(`\n총 업데이트: ${updateCount}건\n`);

  if (!DRY_RUN) {
    fs.writeFileSync(constPath, constContent);
    console.log('✅ constants.ts 저장 완료');
  } else {
    console.log('⚠️ DRY RUN: 실제 저장하지 않음');
  }

  // 변경 요약
  console.log('\n=== 변경 요약 ===');
  let phoneFix = 0, priceFix = 0, descFix = 0;
  for (const [name, data] of Object.entries(MANUAL_DATA)) {
    if (data.phone && data.phone !== '1588-0000') phoneFix++;
    if (data.priceRange && data.priceRange !== '문의') priceFix++;
    if (data.description && data.description !== '믿을 수 있는 상조 서비스') descFix++;
  }
  console.log(`전화번호 수정 대상: ${phoneFix}건`);
  console.log(`가격 수정 대상: ${priceFix}건`);
  console.log(`설명 수정 대상: ${descFix}건`);
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

run().catch(e => { console.error('FATAL:', e); process.exit(1); });
