/**
 * 상조 업체 폴백 데이터 (DB 실패 시 사용)
 * 원본: constants.ts FUNERAL_COMPANIES
 */
import type { FuneralCompany } from '../types';
import { SANGJO_PRODUCTS } from './sangjoProductDefaults';

export const FUNERAL_COMPANIES: FuneralCompany[] = [
  { id: 'fc_new_1', name: '프리드라이프', rating: 5.0, reviewCount: 990, imageUrl: '/images/logos/fc_new_1.png', description: '대한민국 선수금 1위, 가장 많은 고객이 선택한 프리미엄 상조 서비스입니다.', features: ["전국 의전망", "24시간 상담", "가격 정찰제", "VIP 리무진"], phone: '1588-3740', priceRange: '문의', benefits: ["회원 전용 혜택"] },
  { id: 'fc_new_2', name: '교원라이프', rating: 5.0, reviewCount: 980, imageUrl: '/images/logos/fc_new_2.png', description: '교원그룹의 신뢰를 바탕으로 한 고품격 상조 서비스', features: ["전국 의전망", "24시간 상담", "교육 전환 서비스"], phone: '1588-0060', priceRange: '문의', benefits: ["회원 전용 혜택"] },
  { id: 'fc_new_3', name: '대명스테이션', rating: 4.9, reviewCount: 970, imageUrl: '/images/logos/fc_new_3.png', description: '대명소노그룹의 레저 인프라와 결합한 신개념 라이프 케어', features: ["전국 의전망", "24시간 상담", "멤버십 혜택"], phone: '1588-2227', priceRange: '문의', benefits: ["회원 전용 혜택"] },
  { id: 'fc_new_4', name: '더케이예다함', rating: 4.9, reviewCount: 960, imageUrl: '/images/logos/예다함상조.JPG', description: '한국교직원공제회가 연대보증하는 정직한 상조 서비스', features: ["전국 의전망", "24시간 상담", "페이백 시스템"], phone: '1566-6644', priceRange: '문의', benefits: ["회원 전용 혜택"] },
  { id: 'fc_new_5', name: '보람상조개발', rating: 4.9, reviewCount: 950, imageUrl: '/images/logos/보람상조.JPG', description: '국가대표 상조기업, 30년 전통의 품격 있는 장례 서비스', features: ["전국 의전망", "24시간 상담", "사이버추모관"], phone: '1588-7979', priceRange: '문의', benefits: ["회원 전용 혜택"] },
  { id: 'fc_post_1', name: '바른라이프', rating: 4.9, reviewCount: 150, imageUrl: 'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/sangjo/bareun_life.JPG?t=1770006464299', description: '가입비 없는 정직한 후불제 상조', features: ["후불제", "즉시 출동", "무가입"], phone: '1666-0000', priceRange: '130만원~', benefits: ["사전가입 필요 없음"] },
  { id: 'fc_post_2', name: '3일의약속', rating: 4.8, reviewCount: 320, imageUrl: 'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/sangjo/promise_3days.JPG?t=1770006705845', description: '조선미디어그룹이 보증하는 후불 상조', features: ["후불제", "대기업 보증", "투명한 정산"], phone: '1668-0000', priceRange: '230만원~', benefits: ["헬퍼 1명 추가 지원"] },
  { id: 'fc_post_3', name: '착한상조', rating: 4.8, reviewCount: 89, imageUrl: 'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/sangjo/good_sangjo_1770009186749.jpg', description: '거품 뺀 실속형 후불제 상조', features: ["후불제", "최저가 보장", "24시간 대기"], phone: '1566-0000', priceRange: '89만원~', benefits: ["장례지도사 지정 배정"] },
  { id: 'fc_new_6', name: '보람상조라이프', rating: 4.9, reviewCount: 940, imageUrl: '/images/logos/보람상조.JPG', description: '믿을 수 있는 상조 서비스', features: ["전국 의전망", "24시간 상담"], phone: '1588-0000', priceRange: '문의', benefits: ["회원 전용 혜택"] },
  { id: 'fc_new_7', name: '부모사랑', rating: 4.9, reviewCount: 930, imageUrl: '/images/logos/fc_new_7.png', description: '믿을 수 있는 상조 서비스', features: ["전국 의전망", "24시간 상담"], phone: '1588-0000', priceRange: '문의', benefits: ["회원 전용 혜택"] },
  { id: 'fc_new_8', name: '보람상조리더스', rating: 4.8, reviewCount: 920, imageUrl: '/images/logos/보람상조.JPG', description: '믿을 수 있는 상조 서비스', features: ["전국 의전망", "24시간 상담"], phone: '1588-0000', priceRange: '문의', benefits: ["회원 전용 혜택"] },
  { id: 'fc_new_9', name: '더피플라이프', rating: 4.8, reviewCount: 910, imageUrl: '/images/logos/fc_new_9.png', description: '믿을 수 있는 상조 서비스', features: ["전국 의전망", "24시간 상담"], phone: '1588-0000', priceRange: '문의', benefits: ["회원 전용 혜택"] },
  { id: 'fc_new_10', name: '더리본', rating: 4.8, reviewCount: 900, imageUrl: '/images/logos/더리본.JPG', description: '믿을 수 있는 상조 서비스', features: ["전국 의전망", "24시간 상담"], phone: '1588-0000', priceRange: '문의', benefits: ["회원 전용 혜택"] },
  { id: 'fc_new_11', name: '보람상조피플', rating: 4.8, reviewCount: 890, imageUrl: '/images/logos/보람상조피플.JPG', description: '믿을 수 있는 상조 서비스', features: ["전국 의전망", "24시간 상담"], phone: '1588-0000', priceRange: '문의', benefits: ["회원 전용 혜택"] },
  { id: 'fc_new_12', name: '효원상조', rating: 4.8, reviewCount: 880, imageUrl: '/images/logos/fc_new_12.png', description: '믿을 수 있는 상조 서비스', features: ["전국 의전망", "24시간 상담"], phone: '1588-0000', priceRange: '문의', benefits: ["회원 전용 혜택"] },
  { id: 'fc_new_13', name: '늘곁애라이프온', rating: 4.7, reviewCount: 870, imageUrl: '/images/logos/늘곁애라이프온.JPG', description: '믿을 수 있는 상조 서비스', features: ["전국 의전망", "24시간 상담"], phone: '1588-0000', priceRange: '문의', benefits: ["회원 전용 혜택"] },
  { id: 'fc_new_14', name: '평화누리', rating: 4.7, reviewCount: 860, imageUrl: '/images/logos/fc_new_14.png', description: '믿을 수 있는 상조 서비스', features: ["전국 의전망", "24시간 상담"], phone: '1588-0000', priceRange: '문의', benefits: ["회원 전용 혜택"] },
  { id: 'fc_new_15', name: 'SJ산림조합상조', rating: 4.7, reviewCount: 850, imageUrl: '/images/logos/fc_new_15.png', description: '믿을 수 있는 상조 서비스', features: ["전국 의전망", "24시간 상담"], phone: '1588-0000', priceRange: '문의', benefits: ["회원 전용 혜택"] },
  { id: 'fc_new_16', name: '보람상조애니콜', rating: 4.7, reviewCount: 840, imageUrl: '/images/logos/보람상조.JPG', description: '믿을 수 있는 상조 서비스', features: ["전국 의전망", "24시간 상담"], phone: '1588-0000', priceRange: '문의', benefits: ["회원 전용 혜택"] },
  { id: 'fc_new_18', name: '휴먼라이프', rating: 4.6, reviewCount: 820, imageUrl: '/images/logos/휴먼라이프.JPG', description: '믿을 수 있는 상조 서비스', features: ["전국 의전망", "24시간 상담"], phone: '1588-0000', priceRange: '문의', benefits: ["회원 전용 혜택"] },
  { id: 'fc_new_19', name: '제이케이', rating: 4.6, reviewCount: 810, imageUrl: '/images/logos/fc_new_19.png', description: '믿을 수 있는 상조 서비스', features: ["전국 의전망", "24시간 상담"], phone: '1588-0000', priceRange: '문의', benefits: ["회원 전용 혜택"] },
  { id: 'fc_new_20', name: '대노복지사업단', rating: 4.6, reviewCount: 800, imageUrl: '/images/logos/대노복지사업단.JPG', description: '믿을 수 있는 상조 서비스', features: ["전국 의전망", "24시간 상담"], phone: '1588-0000', priceRange: '문의', benefits: ["회원 전용 혜택"] },
  { id: 'fc_new_21', name: '경우라이프', rating: 4.6, reviewCount: 790, imageUrl: '/images/logos/경우라이프.JPG', description: '믿을 수 있는 상조 서비스', features: ["전국 의전망", "24시간 상담"], phone: '1588-0000', priceRange: '문의', benefits: ["회원 전용 혜택"] },
  { id: 'fc_new_22', name: '다온플랜', rating: 4.6, reviewCount: 780, imageUrl: '/images/logos/다온플랜.JPG', description: '믿을 수 있는 상조 서비스', features: ["전국 의전망", "24시간 상담"], phone: '1588-0000', priceRange: '문의', benefits: ["회원 전용 혜택"] },
  { id: 'fc_new_23', name: '에이플러스라이프', rating: 4.5, reviewCount: 770, imageUrl: '/images/logos/fc_new_23.png', description: '믿을 수 있는 상조 서비스', features: ["전국 의전망", "24시간 상담"], phone: '1588-0000', priceRange: '문의', benefits: ["회원 전용 혜택"] },
  { id: 'fc_new_24', name: '현대에스라이프', rating: 4.5, reviewCount: 760, imageUrl: '/images/logos/fc_new_24.png', description: '믿을 수 있는 상조 서비스', features: ["전국 의전망", "24시간 상담"], phone: '1588-0000', priceRange: '문의', benefits: ["회원 전용 혜택"] },
  { id: 'fc_new_25', name: '한라상조', rating: 4.5, reviewCount: 750, imageUrl: '/images/logos/fc_new_25.png', description: '믿을 수 있는 상조 서비스', features: ["전국 의전망", "24시간 상담"], phone: '1588-0000', priceRange: '문의', benefits: ["회원 전용 혜택"] },
  { id: 'fc_new_26', name: '보람상조실로암', rating: 4.5, reviewCount: 740, imageUrl: '/images/logos/보람상조.JPG', description: '믿을 수 있는 상조 서비스', features: ["전국 의전망", "24시간 상담"], phone: '1588-0000', priceRange: '문의', benefits: ["회원 전용 혜택"] },
  { id: 'fc_new_27', name: '디에스라이프', rating: 4.5, reviewCount: 730, imageUrl: '/images/logos/디에스라이프.JPG', description: '믿을 수 있는 상조 서비스', features: ["전국 의전망", "24시간 상담"], phone: '1588-0000', priceRange: '문의', benefits: ["회원 전용 혜택"] },
  { id: 'fc_new_28', name: '엘비라이프', rating: 4.4, reviewCount: 720, imageUrl: '/images/logos/엘비라이프.JPG', description: '믿을 수 있는 상조 서비스', features: ["전국 의전망", "24시간 상담"], phone: '1588-0000', priceRange: '문의', benefits: ["회원 전용 혜택"] },
  { id: 'fc_new_29', name: '금호라이프', rating: 4.4, reviewCount: 710, imageUrl: '/images/logos/금호라이프.JPG', description: '믿을 수 있는 상조 서비스', features: ["전국 의전망", "24시간 상담"], phone: '1588-0000', priceRange: '문의', benefits: ["회원 전용 혜택"] },
  { id: 'fc_new_30', name: '크리스찬상조', rating: 4.4, reviewCount: 700, imageUrl: '/images/logos/fc_new_30.png', description: '믿을 수 있는 상조 서비스', features: ["전국 의전망", "24시간 상담"], phone: '1588-0000', priceRange: '문의', benefits: ["회원 전용 혜택"] },
  { id: 'fc_new_31', name: '우정라이프', rating: 4.4, reviewCount: 690, imageUrl: '/images/logos/우정라이프.JPG', description: '믿을 수 있는 상조 서비스', features: ["전국 의전망", "24시간 상담"], phone: '1588-0000', priceRange: '문의', benefits: ["회원 전용 혜택"] },
  { id: 'fc_new_32', name: '보훈상조', rating: 4.4, reviewCount: 680, imageUrl: '/images/logos/fc_new_32.png', description: '믿을 수 있는 상조 서비스', features: ["전국 의전망", "24시간 상담"], phone: '1588-0000', priceRange: '문의', benefits: ["회원 전용 혜택"] },
  { id: 'fc_new_33', name: '용인공원라이프', rating: 4.3, reviewCount: 670, imageUrl: '/images/logos/fc_new_33.png', description: '믿을 수 있는 상조 서비스', features: ["전국 의전망", "24시간 상담"], phone: '1588-0000', priceRange: '문의', benefits: ["회원 전용 혜택"] },
  { id: 'fc_new_34', name: '불국토', rating: 4.3, reviewCount: 660, imageUrl: '/images/logos/불국토상조.JPG', description: '믿을 수 있는 상조 서비스', features: ["전국 의전망", "24시간 상담"], phone: '1588-0000', priceRange: '문의', benefits: ["회원 전용 혜택"] },
  { id: 'fc_new_35', name: '대한라이프보증', rating: 4.3, reviewCount: 650, imageUrl: '/images/logos/대한라이프보증.JPG', description: '믿을 수 있는 상조 서비스', features: ["전국 의전망", "24시간 상담"], phone: '1588-0000', priceRange: '문의', benefits: ["회원 전용 혜택"] },
  { id: 'fc_new_36', name: '우리제주상조', rating: 4.3, reviewCount: 640, imageUrl: '/images/logos/우리제조상조.JPG', description: '믿을 수 있는 상조 서비스', features: ["전국 의전망", "24시간 상담"], phone: '1588-0000', priceRange: '문의', benefits: ["회원 전용 혜택"] },
  { id: 'fc_new_37', name: '유토피아퓨처', rating: 4.3, reviewCount: 630, imageUrl: '/images/logos/유토피아퓨처.JPG', description: '믿을 수 있는 상조 서비스', features: ["전국 의전망", "24시간 상담"], phone: '1588-0000', priceRange: '문의', benefits: ["회원 전용 혜택"] },
  { id: 'fc_new_38', name: '다나상조', rating: 4.2, reviewCount: 620, imageUrl: '/images/logos/다나상조.JPG', description: '믿을 수 있는 상조 서비스', features: ["전국 의전망", "24시간 상담"], phone: '1588-0000', priceRange: '문의', benefits: ["회원 전용 혜택"] },
  { id: 'fc_new_39', name: '아가페라이프', rating: 4.2, reviewCount: 610, imageUrl: '/images/logos/아가페라이프.JPG', description: '믿을 수 있는 상조 서비스', features: ["전국 의전망", "24시간 상담"], phone: '1588-0000', priceRange: '문의', benefits: ["회원 전용 혜택"] },
  { id: 'fc_new_41', name: '삼육리더스라이프', rating: 4.2, reviewCount: 590, imageUrl: '/images/logos/삼육리더스라이프.JPG', description: '믿을 수 있는 상조 서비스', features: ["전국 의전망", "24시간 상담"], phone: '1588-0000', priceRange: '문의', benefits: ["회원 전용 혜택"] },
  { id: 'fc_new_43', name: '세종라이프', rating: 4.1, reviewCount: 570, imageUrl: '/images/logos/fc_new_43.png', description: '믿을 수 있는 상조 서비스', features: ["전국 의전망", "24시간 상담"], phone: '1588-0000', priceRange: '문의', benefits: ["회원 전용 혜택"] },
  { id: 'fc_new_44', name: '삼우라이프', rating: 4.1, reviewCount: 560, imageUrl: '/images/logos/삼우라이프.JPG', description: '믿을 수 있는 상조 서비스', features: ["전국 의전망", "24시간 상담"], phone: '1588-0000', priceRange: '문의', benefits: ["회원 전용 혜택"] },
  { id: 'fc_new_45', name: '태양라이프', rating: 4.1, reviewCount: 550, imageUrl: '/images/logos/태양라이프.JPG', description: '믿을 수 있는 상조 서비스', features: ["전국 의전망", "24시간 상담"], phone: '1588-0000', priceRange: '문의', benefits: ["회원 전용 혜택"] },
  { id: 'fc_new_47', name: '상조114', rating: 4.6, reviewCount: 450, imageUrl: 'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/sangjo/sangjo_114.JPG?t=1770006464561', description: '합리적인 가격과 실속 있는 상품 구성을 자랑하는 상조 서비스', features: ["합리적 가격", "실속 구성", "24시간 상담"], phone: '1588-0000', priceRange: '문의', benefits: ["온라인 가입 추가 할인"] },
];

// Apply real product data
const fmtPrice = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
for (const company of FUNERAL_COMPANIES) {
  const products = SANGJO_PRODUCTS[company.id];
  if (products) {
    company.products = products;
    const prices = products.map(p => p.price);
    company.priceRange = `월 ${fmtPrice(Math.min(...prices))}원 ~ ${fmtPrice(Math.max(...prices))}원`;
  }
}
