import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) { process.exit(1); }

const supabase = createClient(supabaseUrl, supabaseKey);

type CategoryKey = 'leader' | 'tradition' | 'transparency' | 'expert';

// 카테고리별 회사 분류
const categories: Record<CategoryKey, string[]> = {
    leader: ["프리드라이프", "보람상조", "대명스테이션", "보람재향상조", "더리본"],
    tradition: ["효원상조", "평화상조", "늘곁애라이프", "한강라이프", "재향군인회상조회", "JK상조"],
    transparency: ["교원라이프", "더케이예다함상조", "교원라이프", "좋은라이프", "부모사랑", "에스제이산림조합"],
    expert: [
        "용인공원라이프", "우리가족상조", "다온플랜", "금강문화허브", "제주상조",
        "대노복지사업단", "한라상조", "디에스라이프", "위드라이프", "바라밀",
        "우상조", "두레문화", "불국토", "태양상조", "아주상조",
        "대한공무원상조", "매일상조", "삼성개발", "크리스찬상조",
        "대전상조", "전국공무원상조", "유토피아퓨처", "다나상조", "현대에스라이프"
    ]
};

// 소개글 템플릿
const templates: Record<CategoryKey, string> = {
    leader: "대한민국 1등 상조, {name}입니다. 고객님의 마지막 순간까지 품격 있는 예우를 다합니다. 전국 직영망과 전문 장례지도사의 세심한 서비스로 가장 든든한 버팀목이 되겠습니다.",
    tradition: "오랜 전통의 {name}이 함께합니다. 고유의 장례 예법과 정성을 담아 마지막 가시는 길을 아름답게 지켜드립니다. 숙련된 전문가의 노하우로 경황없는 유가족분들께 평안을 드립니다.",
    transparency: "정직과 신뢰의 {name}입니다. 투명한 가격 정찰제와 고객 중심 서비스로 거품 없는 합리적인 장례 문화를 만들어갑니다. 진심을 다하는 서비스로 고객님의 슬픔을 함께 나누겠습니다.",
    expert: "장례 의전의 전문가, {name}입니다. 24시간 언제든 상담 가능한 전문 인력과 고품격 리무진 서비스로 차별화된 경험을 제공합니다. 고인에게는 최고의 예를, 가족에게는 깊은 위로를 드립니다."
};

// 특징 풀 (랜덤 조합용)
const commonFeatures = [
    "전국 의전망", "24시간 긴급 출동", "국가공인 지도사", "100% 환불 보장",
    "투명한 가격 정찰제", "프리미엄 리무진", "직영 장례식장 혜택", "사전 장례 컨설팅"
];

// 카테고리별 우선 노출 특징
const categoryFeatures: Record<CategoryKey, string[]> = {
    leader: ["업계 1위", "전국 직영망", "프리미엄 의전", "무료 사전상담"],
    tradition: ["오랜 전통", "전문 장례지도사", "고품격 의전", "종교별 장례"],
    transparency: ["투명한 가격", "100% 환불 보장", "부당요구 근절", "안심 서비스"],
    expert: ["국가공인 지도사", "24시간 상담", "맞춤형 장례", "원스톱 서비스"]
};

async function run() {
    console.log("🚀 상조 회사 콘텐츠 고도화 작업 시작...");

    const allCompanies = [
        ...categories.leader, ...categories.tradition, ...categories.transparency, ...categories.expert
    ];

    for (const name of allCompanies) {
        // Find company ID
        const { data: company } = await supabase.from('memorial_spaces').select('id').ilike('name', `%${name}%`).maybeSingle();

        if (!company) {
            console.log(`⚠️ PASS: ${name} (DB 미발견)`);
            continue;
        }

        // Determine category
        let category: CategoryKey = 'expert';
        if (categories.leader.includes(name)) category = 'leader';
        else if (categories.tradition.includes(name)) category = 'tradition';
        else if (categories.transparency.includes(name)) category = 'transparency';

        // 1. Description
        const description = templates[category].replace("{name}", name);

        // 2. Features (Category specific + Random common ones, total 4-5)
        const specificFeats = categoryFeatures[category];
        const randomFeats = commonFeatures
            .filter(f => !specificFeats.includes(f))
            .sort(() => 0.5 - Math.random())
            .slice(0, 2); // Add 2 random ones

        const features = [...specificFeats, ...randomFeats].slice(0, 5); // Max 5

        // Update
        const { error } = await supabase
            .from('memorial_spaces')
            .update({
                description,
                features
            })
            .eq('id', company.id);

        if (error) {
            console.error(`❌ ${name} 업데이트 실패:`, error.message);
        } else {
            console.log(`✅ ${name} 업데이트 완료 (${category})`);
        }
    }
}

run();
