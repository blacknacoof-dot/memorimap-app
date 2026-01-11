import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase URL or Service Role Key in environment variables.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 1. 대상 업체 리스트 (39개)
const companies = [
    "프리드라이프", "대명스테이션", "교원라이프", "더케이예다함상조", "보람상조",
    "보람재향상조", "JK상조", "늘곁애라이프", "더리본", "효원상조",
    "한강라이프", "부모사랑", "평화상조", "에스제이산림조합", "현대에스라이프",
    "용인공원라이프", "좋은라이프", "우리가족상조", "다온플랜", "금강문화허브",
    "제주상조", "대노복지사업단", "한라상조", "디에스라이프", "위드라이프",
    "바라밀", "우상조", "두레문화", "불국토", "태양상조",
    "아주상조", "대한공무원상조", "매일상조", "삼성개발", "크리스찬상조",
    "대전상조", "전국공무원상조", "유토피아퓨처", "다나상조"
];

// 2. 데이터 템플릿
const introTemplates = [
    "대한민국 상조 문화를 선도하는 {name}입니다. 고객님의 슬픔을 나누고 마지막 가시는 길을 품격 있게 지켜드립니다.",
    "{name}은(는) 정직과 신뢰를 최우선 가치로 여깁니다. 투명한 가격 정책과 진심을 담은 서비스로 유가족분들의 든든한 버팀목이 되겠습니다.",
    "오랜 전통과 노하우를 보유한 {name}. 국가공인 장례지도사의 세심한 손길로 고인의 평안한 안식을 위해 최선을 다합니다.",
    "마지막 이별의 순간, {name}이 곁에 있습니다. 고품격 의전 서비스와 합리적인 비용으로 최고의 예우를 약속드립니다."
];

const featureOptions = [
    "전국 의전망 보유", "24시간 긴급 출동", "국가공인 지도사", "100% 환불 보장",
    "투명한 가격 정찰제", "프리미엄 리무진", "직영 장례식장 혜택", "고객 만족도 1위"
];

// 후기 멘트
const reviewComments = [
    "경황이 없어 당황했는데 지도사님이 처음부터 끝까지 친절하게 챙겨주셔서 정말 감사했습니다.",
    "비용 문제로 걱정이 많았는데 합리적인 상품을 추천해 주셔서 부담 없이 잘 치렀습니다.",
    "새벽 늦은 시간에 연락드렸는데도 바로 와주셔서 든든했습니다. 덕분에 아버님 잘 보내드렸어요.",
    "음식도 깔끔하고 도우미분들도 너무 친절하셨습니다. 조문객분들도 칭찬 많이 하셨네요.",
    "장례 절차를 하나도 몰랐는데 꼼꼼하게 설명해 주셔서 믿음이 갔습니다. 추천합니다."
];

const userNames = ["김**", "이**", "박**", "최**", "정**", "강**", "조**", "윤**", "한**", "오**"];

async function run() {
    console.log("🚀 상조 회사 상세 데이터(소개/특징/후기) 주입 시작...");
    console.log("ℹ️ 이미지는 요청에 따라 제외합니다.");

    for (const name of companies) {
        // ID 조회
        const { data: company } = await supabase.from('memorial_spaces').select('id').ilike('name', `%${name}%`).maybeSingle();

        if (!company) {
            console.log(`⚠️ PASS: ${name} (DB에 없음)`);
            continue;
        }

        // 1. [소개/특징] 데이터 생성
        const description = introTemplates[Math.floor(Math.random() * introTemplates.length)].replace("{name}", name);
        // 이미지 제외: const gallery = ...
        const features = [...featureOptions].sort(() => 0.5 - Math.random()).slice(0, 4);

        // DB 업데이트
        const { error: updateError } = await supabase.from('memorial_spaces').update({
            description,
            // gallery_images: gallery, // 제외
            features
        }).eq('id', company.id);

        if (updateError) {
            console.error(`❌ 업데이트 실패: ${name}`, updateError);
            continue;
        }

        // 2. [후기] 5개 생성
        // 기존 후기가 있는지 확인하고 중복 생성 방지 가능하나, 여기선 덮어쓰거나 추가 (일단 추가)
        const reviews = Array.from({ length: 5 }).map(() => ({
            memorial_space_id: company.id,
            user_name: userNames[Math.floor(Math.random() * userNames.length)],
            content: reviewComments[Math.floor(Math.random() * reviewComments.length)],
            rating: 5, // 5점 고정 or 랜덤
            created_at: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString()
        }));

        const { error: reviewError } = await supabase.from('reviews').insert(reviews);
        if (reviewError) {
            console.error(`❌ 후기 생성 실패: ${name}`, reviewError);
        } else {
            console.log(`✅ 완료: ${name}`);
        }
    }

    console.log("✨ 모든 작업이 완료되었습니다!");
}

run();
