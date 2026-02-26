export interface Product {
    id: number;
    title: string;
    price: string;
    totalPrice: string;
    desc: string;
    features: string[];
    badge?: string;
}

export type ScenarioStep =
    | 'MAIN_MENU'
    | 'PRODUCTS'
    | 'BUDGET_SELECT'
    | 'SCALE_SELECT'
    | 'RECOMMEND'
    | 'FORM'
    | 'COMPLETE';

export interface BotMessage {
    id: number;
    text: string;
    options?: { label: string; action: string; variant?: 'primary' | 'danger' | 'default' }[];
    products?: Product[];
    isUser?: boolean;
}

export const PRODUCTS: Product[] = [
    {
        id: 1,
        title: '실속형',
        price: '월 30,000원',
        totalPrice: '3,600,000원',
        desc: '꼭 필요한 서비스만 담은 합리적인 선택',
        features: ['전문 장례지도사 2명', '접객 도우미 4명', '관내 리무진', '오동나무 관'],
    },
    {
        id: 2,
        title: '베스트',
        price: '월 39,000원',
        totalPrice: '4,680,000원',
        desc: '가장 많은 고객이 선택한 대표 상품',
        features: ['전국 무료 이송', '리무진 왕복', '고급 수의', '도우미 6명'],
        badge: 'BEST',
    },
    {
        id: 3,
        title: 'VIP',
        price: '월 55,000원',
        totalPrice: '6,600,000원',
        desc: '최고의 예우를 위한 고품격 서비스',
        features: ['VIP 의전 팀장', '솔송나무 관', '전국 리무진 무제한', '추모 영상 제작'],
    },
];

export function formatTotalPrice(tagline: string, price: number): string {
    const match = tagline.match(/×\s*(\d+)회/);
    if (match) return `${(price * parseInt(match[1])).toLocaleString()}원`;
    return '';
}

export const BUDGET_OPTIONS = [
    { label: '~300만원', value: '300', recommend: 1 },
    { label: '~500만원', value: '500', recommend: 2 },
    { label: '~700만원', value: '700', recommend: 2 },
    { label: '700만원 이상', value: '700+', recommend: 3 },
];

export const SCALE_OPTIONS = [
    { label: '소규모 (30명 이하)', value: 'small' },
    { label: '중규모 (30~100명)', value: 'medium' },
    { label: '대규모 (100명 이상)', value: 'large' },
];
