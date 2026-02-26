import { FuneralCompany } from '../../../types';
import { ProductData } from './ChatMessages';

function formatBrandTotalPrice(tagline: string, price: number): string {
    const match = tagline.match(/×\s*(\d+)회/);
    if (match) return `${(price * parseInt(match[1])).toLocaleString()}원`;
    return '';
}

function buildPetProducts(name: string): ProductData[] {
    return [
        {
            id: 1, title: `${name} 베이직`, price: "200,000원", totalPrice: "200,000원",
            desc: "소중한 아이를 위한 기본 장례",
            features: ["개별 화장", "기본 유골함", "추모실 이용", "장례확인서 발급"]
        },
        {
            id: 2, title: `${name} 스탠다드`, price: "400,000원", totalPrice: "400,000원",
            desc: "가장 많이 선택하는 표준 장례",
            features: ["개별 화장", "고급 수의", "오동나무 관", "염습/입관식 진행"],
            badge: "BEST"
        },
        {
            id: 3, title: `${name} 프리미엄`, price: "800,000원", totalPrice: "800,000원",
            desc: "최고의 예우를 갖춘 VIP 장례",
            features: ["VIP 추모실", "최고급 수의/관", "장례 스냅 촬영", "메모리얼 스톤 할인"]
        }
    ];
}

function buildDefaultProducts(name: string): ProductData[] {
    return [
        {
            id: 1, title: `${name} 실속형`, price: "월 30,000원", totalPrice: "3,600,000원",
            desc: "꼭 필요한 서비스만 담은 합리적인 선택",
            features: ["전문 장례지도사 2명", "접객 도우미 4명", "관내 리무진", "오동나무 관"]
        },
        {
            id: 2, title: `${name} 베스트`, price: "월 39,000원", totalPrice: "4,680,000원",
            desc: "가장 많은 고객이 선택한 대표 상품",
            features: ["전국 무료 이송", "리무진 왕복", "고급 수의", "도우미 6명"],
            badge: "BEST"
        },
        {
            id: 3, title: `${name} VIP`, price: "월 55,000원", totalPrice: "6,600,000원",
            desc: "최고의 예우를 위한 고품격 서비스",
            features: ["VIP 의전 팀장", "솔송나무 관", "전국 리무진 무제한", "추모 영상 제작"]
        }
    ];
}

function buildCompanyProducts(company: FuneralCompany): ProductData[] {
    return company.products!.map((p, i) => ({
        id: i + 1,
        title: `${company.name} ${p.name}`,
        price: p.tagline,
        totalPrice: formatBrandTotalPrice(p.tagline, p.price),
        desc: p.description,
        features: (p.includedServices || []).slice(0, 4),
        badge: i === 1 ? 'BEST' : undefined,
    }));
}

export interface BrandConfig {
    name: string;
    themeColor: string;
    logo: string;
    products: ProductData[];
}

export function buildBrandConfig(company: FuneralCompany, isPetCompany: boolean): BrandConfig {
    const name = company.name;
    let products: ProductData[];

    if (isPetCompany) {
        products = buildPetProducts(name);
    } else if (company.products && company.products.length > 0) {
        products = buildCompanyProducts(company);
    } else {
        products = buildDefaultProducts(name);
    }

    return {
        name,
        themeColor: isPetCompany ? "bg-[#78350F]" : "bg-[#005B50]",
        logo: company.imageUrl || (isPetCompany ? "🐾" : "💎"),
        products,
    };
}
