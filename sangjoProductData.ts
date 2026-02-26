import { SangjoProduct, ServiceDetail } from './types';

const ECO_SVC: ServiceDetail[] = [
  { category: '인력', items: ['장례지도사 1명', '염습집례사 1명', '장례도우미 2명'] },
  { category: '차량', items: ['리무진 왕복 200km', '장의버스 왕복 200km'] },
  { category: '용품', items: ['수의(화장용)', '화장용관', '입관용품 기본'] },
  { category: '부가', items: ['상복 남3벌 여3벌', '빈소용품 기본', '유골함(목함)'] },
];

const STD_SVC: ServiceDetail[] = [
  { category: '인력', items: ['장례지도사 1명', '염습집례사 2명', '장례도우미 4명'] },
  { category: '차량', items: ['리무진 왕복 300km', '장의버스 왕복 300km'] },
  { category: '용품', items: ['수의(매장용)', '오동관(15-25mm)', '입관용품 15종'] },
  { category: '부가', items: ['상복 남5벌 여5벌', '빈소용품(향초/부의록/명패/위패)', '꽃장식 20만원', '유골함(진공함)'] },
];

const PRM_SVC: ServiceDetail[] = [
  { category: '인력', items: ['장례지도사 1명', '염습집례사 3명', '장례도우미 6명'] },
  { category: '차량', items: ['리무진 왕복 전국', '장의버스 왕복 전국'] },
  { category: '용품', items: ['황금수의', '향나무관(솔송관)', '입관용품 프리미엄'] },
  { category: '부가', items: ['상복 남7벌 여7벌', '빈소용품 고급', '꽃장식 30만원', '고급 진공 유골함'] },
];

const TIERS = [ECO_SVC, STD_SVC, PRM_SVC];
const DESCS = [
  '꼭 필요한 서비스만 담은 합리적인 선택',
  '가장 많은 고객이 선택한 대표 상품',
  '최고의 예우를 위한 고품격 서비스',
];

function fmt(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function flat(d: ServiceDetail[]): string[] {
  return d.flatMap(s => s.items);
}

function make(
  id: string,
  prices: [number, number, number],
  pay: number,
  opts?: { names?: [string, string, string]; features?: string[] }
): SangjoProduct[] {
  const names = opts?.names || ['실속형', '표준형', '고급형'];
  const suffix = pay > 0 ? ` × ${pay}회` : '';
  const extra = opts?.features || ['만기시 100% 환급'];
  return prices.map((p, i) => ({
    id: `prod-${id}-${i + 1}`,
    name: names[i],
    price: p,
    tagline: `월 ${fmt(p)}원${suffix}`,
    description: DESCS[i],
    serviceDetails: TIERS[i],
    includedServices: flat(TIERS[i]),
    optionalServices: [],
    distinguishingFeatures: extra,
  }));
}

export const SANGJO_PRODUCTS: Record<string, SangjoProduct[]> = {
  fc_new_1: make('fc_new_1', [33000, 66000, 99000], 0, {
    names: ['실속형', '멤버십', '고급형'],
    features: ['만기시 100% 환급', '대한민국 선수금 1위'],
  }),
  fc_new_2: make('fc_new_2', [27600, 55200, 82800], 150, {
    features: ['만기시 100% 환급', '교원예움장례식장 우선 예약'],
  }),
  fc_new_3: make('fc_new_3', [33000, 66000, 99000], 200, {
    names: ['스마트케어 2구좌', '스마트케어 4구좌', '스마트케어 6구좌'],
    features: ['만기시 100% 환급', '가전제품 포함', '제휴카드 월 25,000원 할인'],
  }),
  fc_new_4: make('fc_new_4', [29900, 49900, 79900], 200),
  fc_new_5: make('fc_new_5', [19900, 29900, 39900], 200, {
    names: ['보람 199', '보람 299', '보람 399'],
  }),
  fc_new_6: make('fc_new_6', [27000, 47000, 77000], 180),
  fc_new_7: make('fc_new_7', [23000, 43000, 73000], 200),
  fc_new_9: make('fc_new_9', [25000, 45000, 75000], 200),
  fc_new_10: make('fc_new_10', [26000, 46000, 76000], 200),
  fc_new_11: make('fc_new_11', [24000, 44000, 74000], 200),
  fc_new_12: make('fc_new_12', [20000, 40000, 70000], 200),
  fc_new_13: make('fc_new_13', [22000, 42000, 72000], 200),
  fc_new_14: make('fc_new_14', [21000, 41000, 71000], 200),
  fc_new_15: make('fc_new_15', [15800, 35800, 65800], 200),
  fc_new_16: make('fc_new_16', [13600, 33600, 63600], 200),
  fc_new_18: make('fc_new_18', [3600, 23600, 53600], 200),
  fc_new_19: make('fc_new_19', [18900, 38900, 68900], 200),
  fc_new_20: make('fc_new_20', [18000, 38000, 68000], 200),
  fc_new_21: make('fc_new_21', [17600, 37600, 67600], 200),
  fc_new_22: make('fc_new_22', [14400, 34400, 64400], 200),
  fc_new_23: make('fc_new_23', [13300, 33300, 63300], 200),
  fc_new_24: make('fc_new_24', [13700, 33700, 63700], 200),
  fc_new_25: make('fc_new_25', [19800, 39800, 69800], 200),
  fc_new_26: make('fc_new_26', [10900, 30900, 60900], 200),
  fc_new_27: make('fc_new_27', [9900, 29900, 59900], 200),
  fc_new_28: make('fc_new_28', [9000, 29000, 59000], 200),
  fc_new_29: make('fc_new_29', [9500, 29500, 59500], 200),
  fc_new_30: make('fc_new_30', [8200, 28200, 58200], 200),
  fc_new_31: make('fc_new_31', [7600, 27600, 57600], 200),
  fc_new_32: make('fc_new_32', [6500, 26500, 56500], 200),
  fc_new_33: make('fc_new_33', [6100, 26100, 56100], 200),
  fc_new_34: make('fc_new_34', [5500, 25500, 55500], 200),
  fc_new_35: make('fc_new_35', [6600, 26600, 56600], 200),
  fc_new_36: make('fc_new_36', [5300, 25300, 55300], 200),
  fc_new_37: make('fc_new_37', [5000, 25000, 55000], 200),
  fc_new_38: make('fc_new_38', [4700, 24700, 54700], 200),
};
