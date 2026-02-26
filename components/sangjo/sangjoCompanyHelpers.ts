import { FuneralCompany, Review } from '../../types';
import { generateDefaultReviews } from '../../types/sangjo';

// ==========================================
// ReviewRow -- DB에서 가져온 리뷰 원시 타입
// ==========================================

export type ReviewRow = {
    id: string;
    user_id?: string;
    user_name?: string;
    userName?: string;
    facility_id?: string;
    rating?: number;
    content?: string;
    images?: string[];
    created_at?: string;
};

// ==========================================
// mapReviews -- DB 리뷰 -> Review[] 변환 (없으면 기본 리뷰 반환)
// ==========================================

export function mapReviews(uniqueReviews: ReviewRow[], companyId: string): Review[] {
    const dbReviews = uniqueReviews.map((r): Review => {
        let displayDate = '최근';
        try {
            if (r.created_at) {
                const d = new Date(r.created_at);
                if (!isNaN(d.getTime())) {
                    displayDate = d.toISOString().split('T')[0];
                }
            }
        } catch (e) { /* ignore */ }

        return {
            id: r.id,
            userId: r.user_id || '',
            user_id: r.user_id || '',
            userName: r.user_name || r.userName || '익명',
            facility_id: r.facility_id,
            rating: r.rating || 5,
            content: r.content || '',
            images: r.images || [],
            created_at: r.created_at,
            date: displayDate
        };
    });
    if (dbReviews.length === 0) {
        return generateDefaultReviews(companyId);
    }
    return dbReviews;
}

// ==========================================
// buildProducts -- price_range 기반 동적 상품 3종 생성
// ==========================================

export function buildProducts(
    item: { price_range?: string },
    staticMatch: { priceRange?: string } | undefined
) {
    const range = (item.price_range || '') || (staticMatch?.priceRange || '');
    const match = range.match(/(\d+)~(\d+,?\d*)/);
    const singleMatch = !match && range.match(/(\d+)만?원?~/);

    const build = (min: number, max: number) => {
        const mid = Math.round((min + max) / 2 / 10000) * 10000;
        return [
            {
                id: '1', name: `실속형 (${min / 10000}만)`, price: min,
                description: '합리적인 가격으로 꼭 필요한 서비스만 담은 실속 상품',
                badges: ['실속형', '인기'], tagline: '합리적인 선택',
                includedServices: [] as string[], optionalServices: [] as string[],
                serviceDetails: [
                    { category: '인력', items: ['의전관리사 4명', '장례지도사 1명'] },
                    { category: '용품', items: ['오동나무 1단 관', '기본 수의'] },
                    { category: '차량', items: ['운구차량 200km'] }
                ]
            },
            {
                id: '2', name: `표준형 (${mid / 10000}만)`, price: mid,
                description: '가장 많은 고객님이 선택하시는 표준 의전 프로그램',
                badges: ['표준형', '추천'], tagline: '격조 높은 의전',
                includedServices: [] as string[], optionalServices: [] as string[],
                serviceDetails: [
                    { category: '인력', items: ['의전관리사 6명', '장례지도사 2명'] },
                    { category: '용품', items: ['솔송나무 2단 관', '특수 면수의'] },
                    { category: '차량', items: ['리무진 및 버스 왕복 400km'] }
                ]
            },
            {
                id: '3', name: `고급형 (${max / 10000}만)`, price: max,
                description: '최고급 의전과 프리미엄 서비스를 제공하는 VIP 상품',
                badges: ['고급형', 'VIP'], tagline: '최상의 품격',
                includedServices: [] as string[], optionalServices: [] as string[],
                serviceDetails: [
                    { category: '인력', items: ['의전관리사 8명', '장례지도사 3명', '전담 코디네이터'] },
                    { category: '용품', items: ['프리미엄 편백관', '최고급 실크수의'] },
                    { category: '차량', items: ['VIP 리무진 및 대형버스 전국'] }
                ]
            }
        ];
    };

    if (match) {
        const minPrice = parseInt(match[1].replace(/,/g, '')) * 10000;
        const maxPrice = parseInt(match[2].replace(/,/g, '')) * 10000;
        return build(minPrice, maxPrice);
    }
    if (singleMatch) {
        const minPrice = parseInt(singleMatch[1]) * 10000;
        const maxPrice = minPrice * 3;
        return build(minPrice, maxPrice);
    }
    return build(2000000, 8000000);
}

// ==========================================
// buildGalleryImages -- 갤러리 이미지 빌드 (DB -> static -> fallback)
// ==========================================

const ALL_SANGJO_GALLERY = Array.from({ length: 19 }, (_, i) =>
    `/images/sangjo/gallery/sangjo_gallery_${i + 1}.jpg`
);

function pickRandomGallery(companyIndex: number): string[] {
    const shuffled = [...ALL_SANGJO_GALLERY].sort((a, b) => {
        const ha = (companyIndex * 7 + a.charCodeAt(a.length - 5)) % 19;
        const hb = (companyIndex * 7 + b.charCodeAt(b.length - 5)) % 19;
        return ha - hb;
    });
    return shuffled.slice(0, 4);
}

export function buildGalleryImages(
    item: { gallery_images?: string[] | null; images?: string[] | null; image_url?: string | null },
    staticMatch: { imageUrl?: string } | undefined,
    companyIdx: number
): string[] {
    if (item.gallery_images && item.gallery_images.length > 0) {
        return item.gallery_images;
    }
    if (item.images && item.images.length > 0) {
        return item.images;
    }
    return [
        staticMatch?.imageUrl || item.image_url || '/images/default_sangjo.png',
        ...pickRandomGallery(companyIdx)
    ];
}

// ==========================================
// mapDbCompanyToFuneralCompany -- DB row + static match -> FuneralCompany
// ==========================================

export function mapDbCompanyToFuneralCompany(
    item: Record<string, unknown>,
    staticMatch: FuneralCompany | undefined,
    reviewsByCompany: Map<string, ReviewRow[]>,
    companyIdx: number
): FuneralCompany {
    const dbId = String(item.id).trim();
    const staticId = staticMatch?.id?.toString().trim();

    const reviews = [
        ...(reviewsByCompany.get(dbId) || []),
        ...(staticId ? (reviewsByCompany.get(staticId) || []) : [])
    ];
    const uniqueReviews = Array.from(new Map(reviews.map(r => [r.id, r])).values());

    const products = buildProducts(
        item as { price_range?: string },
        staticMatch
    );
    const galleryImages = buildGalleryImages(
        item as { gallery_images?: string[] | null; images?: string[] | null; image_url?: string | null },
        staticMatch,
        companyIdx
    );

    return {
        ...(item as Record<string, unknown>),
        id: dbId,
        staticId: staticMatch?.id,
        name: item.name as string,
        rating: (item.rating as number) || 4.8,
        reviewCount: (item.review_count as number) || uniqueReviews.length || 5,
        imageUrl: staticMatch?.imageUrl || (item.image_url as string) || '/images/default_sangjo.png',
        description: (item.description as string) || staticMatch?.description || `${item.name}의 프리미엄 상조 서비스입니다.`,
        features: (item.features && (item.features as string[]).length > 0) ? (item.features as string[]) : (staticMatch?.features || ["전국 의전망", "24시간 상담"]),
        phone: (item.phone as string) || (item.contact as string) || '1588-0000',
        priceRange: (item.priceRange as string) || '문의',
        benefits: (item.benefits as string[]) || ["회원 전용 혜택"],
        galleryImages: galleryImages,
        products: products,
        reviews: mapReviews(uniqueReviews, dbId)
    } as FuneralCompany;
}
