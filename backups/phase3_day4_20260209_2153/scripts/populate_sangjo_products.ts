
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env.local' });

// 1. Supabase 설정
const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!; // Service Role Key 필요 (Update 권한)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 2. 타입 정의 (Frontend Interface와 일치)
interface ServiceDetail {
    category: string;
    items: string[];
}

interface Product {
    id: string; // Add ID for frontend key
    name: string;
    price: number;
    tagline?: string; // Optional tagline
    description: string; // 마케팅 카피
    serviceDetails: ServiceDetail[]; // HTML 파싱 결과
    badges?: string[]; // 카테고리 (실속형/표준형/고급형)
    faq?: Array<{ q: string; a: string }>;
}

// 3. 39개 상조 회사 리스트
const companies = [
    { name: "프리드라이프", baseProduct: "웅진프리드" },
    { name: "대명스테이션", baseProduct: "대명 라이프" },
    { name: "교원라이프", baseProduct: "베스트라이프" },
    { name: "더케이예다함상조", baseProduct: "예다함" },
    { name: "보람상조", baseProduct: "보람 더베스트" },
    { name: "보람재향상조", baseProduct: "재향 플래티넘" },
    { name: "JK상조", baseProduct: "JK" },
    { name: "늘곁애라이프", baseProduct: "늘곁애" },
    { name: "더리본", baseProduct: "리본" },
    { name: "효원상조", baseProduct: "효원" },
    { name: "한강라이프", baseProduct: "한강" },
    { name: "부모사랑", baseProduct: "부모사랑" },
    { name: "평화상조", baseProduct: "평화" },
    { name: "에스제이산림조합", baseProduct: "SJ 숲" },
    { name: "현대에스라이프", baseProduct: "현대" },
    { name: "용인공원라이프", baseProduct: "용인" },
    { name: "좋은라이프", baseProduct: "좋은" },
    { name: "우리가족상조", baseProduct: "우리" },
    { name: "다온플랜", baseProduct: "다온" },
    { name: "금강문화허브", baseProduct: "금강" },
    { name: "제주상조", baseProduct: "제주" },
    { name: "대노복지사업단", baseProduct: "대노" },
    { name: "한라상조", baseProduct: "한라" },
    { name: "디에스라이프", baseProduct: "DS" },
    { name: "위드라이프", baseProduct: "위드" },
    { name: "바라밀", baseProduct: "바라밀" },
    { name: "우상조", baseProduct: "우" },
    { name: "두레문화", baseProduct: "두레" },
    { name: "불국토", baseProduct: "불국토" },
    { name: "태양상조", baseProduct: "태양" },
    { name: "아주상조", baseProduct: "아주" },
    { name: "대한공무원상조", baseProduct: "공무원" },
    { name: "매일상조", baseProduct: "매일" },
    { name: "삼성개발", baseProduct: "삼성" },
    { name: "크리스찬상조", baseProduct: "크리스찬" },
    { name: "대전상조", baseProduct: "대전" },
    { name: "전국공무원상조", baseProduct: "전공" },
    { name: "유토피아퓨처", baseProduct: "유토피아" },
    { name: "다나상조", baseProduct: "다나" }
];

// 4. 스펙 템플릿 (Raw HTML Data) -> 나중에 파싱됨
const specs: Record<string, any> = {
    "실속형": {
        basePrice: 3900000,
        suffix: "390",
        tagline: "실속형",
        copyTemplates: [
            "{company}의 실속형 상품으로, 꼭 필요한 서비스만 담아 경제적 부담을 줄였습니다.",
            "합리적인 가격으로 품격 있는 이별을 준비하세요. {company}가 정성을 다해 모십니다.",
            "거품은 빼고 정성은 더했습니다. 실용성을 중시하는 분들을 위한 {company}의 베이직 상품입니다."
        ],
        rawHtml: "<ul><li><b>[인력]</b> 국가공인 장례지도사 1명, 의전 도우미 3명 지원</li><li><b>[차량]</b> 버스 또는 리무진 중 택 1 (왕복)</li><li><b>[수의]</b> 엄선된 대마 기계직 수의</li><li><b>[관]</b> 규격 오동나무 관</li><li><b>[상복]</b> 남/녀 상복 기본 수량 제공</li><li><b>[지원]</b> 행정 절차 안내 및 빈소 용품 지원</li></ul>"
    },
    "표준형": {
        basePrice: 4800000,
        suffix: "480",
        tagline: "베스트셀러",
        copyTemplates: [
            "{company} 고객님이 가장 많이 선택하시는 베스트셀러입니다. 리무진과 넉넉한 인력 지원으로 부족함 없는 장례를 약속합니다.",
            "표준화된 고품격 의전 서비스, {company}의 대표 상품입니다. 합리적인 비용으로 최고의 예우를 경험하세요.",
            "후회 없는 선택, {company} 표준형 상품입니다. 고인 전용 리무진과 전문 인력이 마지막 길을 품위 있게 지켜드립니다."
        ],
        rawHtml: "<ul><li><b>[인력]</b> 전문 장례지도사 1명(3일 밀착), 의전 도우미 4명</li><li><b>[차량]</b> 고인 전용 리무진 + 최신형 버스 (왕복 지원)</li><li><b>[수의]</b> 고급 대마 수제 수의 제공</li><li><b>[관]</b> 고급 오동나무 1.5치 관</li><li><b>[입관]</b> 생화 꽃 장식 및 궁중 대렴 서비스</li><li><b>[특전]</b> 웨딩, 크루즈 등 다양한 라이프 케어 서비스 전환 가능</li></ul>"
    },
    "고급형": {
        basePrice: 5600000,
        suffix: "580",
        tagline: "프리미엄",
        copyTemplates: [
            "VVIP를 위한 {company}의 프리미엄 의전 서비스입니다. 지도사 2인 배정과 최고급 용품으로 고귀한 분의 마지막을 빛내드립니다.",
            "최상의 예우와 품격, {company} VIP 상품입니다. 솔송나무 관과 특급 도우미 배정으로 소홀함 없이 모십니다.",
            "가문의 품위를 높여드리는 하이엔드 상조입니다. {company}의 모든 노하우가 집약된 고품격 서비스를 만나보세요."
        ],
        rawHtml: "<ul><li><b>[인력]</b> 특급 장례지도사 2명(장례 총괄), 의전 도우미 5~6명</li><li><b>[차량]</b> 최고급 리무진(링컨/캐딜락 급) + 버스 (거리 무제한)</li><li><b>[수의]</b> 최고급 저마 수의 또는 황실 수의</li><li><b>[관]</b> 품격 있는 솔송나무 관 또는 매장용 관</li><li><b>[제단]</b> 대형 제단 꽃 장식비 지원 확대</li><li><b>[멤버십]</b> VIP 전용 멤버십 혜택 및 건강검진 우대</li></ul>"
    }
};

// 5. 핵심 로직: HTML -> ServiceDetail[] 변환
function parseHtmlToServiceDetails(html: string): ServiceDetail[] {
    const details: ServiceDetail[] = [];
    // 정규식: <li><b>[카테고리]</b> 내용</li>
    const regex = /<li><b>\[(.*?)\]<\/b>\s*(.*?)<\/li>/g;
    let match;

    while ((match = regex.exec(html)) !== null) {
        const category = match[1]; // 예: 인력
        const content = match[2];  // 예: 지도사 1명...

        // 내용에 <br>이 있다면 줄바꿈 처리하거나, 그냥 텍스트로 넣음
        details.push({
            category: category,
            items: [content]
        });
    }
    return details;
}

// 6. 메인 실행 함수
async function populateProducts() {
    console.log("🚀 상조 상품 데이터 주입 시작...");
    let successCount = 0;
    let failCount = 0;

    for (const comp of companies) {
        const products: Product[] = [];

        // 3가지 등급 생성 (실속 -> 표준 -> 고급)
        const tiers = ["실속형", "표준형", "고급형"];

        for (const tier of tiers) {
            const spec = specs[tier];

            // 상품명 생성 (예: 웅진프리드 450)
            let suffix = spec.suffix;
            let price = spec.basePrice;

            if (comp.name === "프리드라이프") {
                if (tier === "실속형") { suffix = "360"; price = 3600000; }
                if (tier === "표준형") { suffix = "450"; price = 4500000; }
                if (tier === "고급형") { suffix = "540"; price = 5400000; }
            }

            const randomCopy = spec.copyTemplates[Math.floor(Math.random() * spec.copyTemplates.length)]
                .replace(/{company}/g, comp.name);

            const serviceDetails = parseHtmlToServiceDetails(spec.rawHtml);
            const uuid = crypto.randomUUID();

            products.push({
                id: uuid,
                name: `${comp.baseProduct} ${suffix}`,
                price: price,
                tagline: spec.tagline,
                description: randomCopy,
                badges: [tier],
                serviceDetails: serviceDetails,
                faq: [
                    { q: `${comp.baseProduct} 상품의 가입 절차는 어떻게 되나요?`, a: "상담 신청을 남겨주시면 전문 상담원이 해피콜을 드려 상세 안내 후 가입을 도와드립니다." },
                    { q: "양도 양수가 가능한가요?", a: "네, 가능합니다. 명의 변경 절차를 통해 가족이나 지인에게 양도하실 수 있습니다." }
                ]
            });
        }

        // price_info 컬럼에 products 배열을 JSON으로 저장
        // Note: Wrapping in { products: [...] } logic to match frontend expectations if necessary.
        // Based on previous inspection, price_info is just a JSONB column. 
        // Usually it's better to store just the array if 'products' is a direct field in the interface.
        // However, the `FuneralCompany` interface has `products?: SangjoProduct[]`. 
        // And `price_info` is usually used as a catch-all.
        // Let's store it as `{ "products": [...] }` so it merges or can be expanded.
        // Wait, let's look at `FuneralCompanySheet` again or `types`. 
        // In `types/index.ts`, `FuneralCompany` has `products?: SangjoProduct[]`.
        // The RPC `search_facilities` likely returns columns. If `products` column doesn't exist, we rely on mapping.
        // Let's assume we need to store it in `price_info` and the frontend or query mapper handles it.
        // Storing as raw array inside price_info might be cleaner if the mapper takes `price_info` as `products`.
        // But to be safe and extensible, let's use `{ products: [...] }`.

        // Correction: The `FuneralCompany` interface in `index.ts` has `products`.
        // If we update `price_info`, we need to make sure the app reads from it.
        // Let's assume the app maps `price_info['products']` to `products` OR `price_info` IS the list.
        // Given the previous user prompt context "price_info 컬럼에 products 배열을 JSON으로 저장", 
        // I will store the array directly inside property `products` of the JSON structure.

        const payload = { products: products };

        const { error } = await supabase
            .from('memorial_spaces')
            .update({ price_info: payload })
            .eq('name', comp.name);

        if (error) {
            console.error(`❌ 실패: ${comp.name}`, error.message);
            failCount++;
        } else {
            console.log(`✅ 업데이트 완료: ${comp.name}`);
            successCount++;
        }
    }

    console.log(`\n✨ 작업 종료: 성공 ${successCount}건, 실패 ${failCount}건`);
}

populateProducts();
