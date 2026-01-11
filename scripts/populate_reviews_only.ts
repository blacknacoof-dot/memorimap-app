import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) { process.exit(1); }

const supabase = createClient(supabaseUrl, supabaseKey);

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

const reviewComments = [
    "경황이 없어 당황했는데 지도사님이 처음부터 끝까지 친절하게 챙겨주셔서 정말 감사했습니다.",
    "비용 문제로 걱정이 많았는데 합리적인 상품을 추천해 주셔서 부담 없이 잘 치렀습니다.",
    "새벽 늦은 시간에 연락드렸는데도 바로 와주셔서 든든했습니다. 덕분에 아버님 잘 보내드렸어요.",
    "음식도 깔끔하고 도우미분들도 너무 친절하셨습니다. 조문객분들도 칭찬 많이 하셨네요.",
    "장례 절차를 하나도 몰랐는데 꼼꼼하게 설명해 주셔서 믿음이 갔습니다. 추천합니다."
];

const userNames = ["김**", "이**", "박**", "최**", "정**", "강**", "조**", "윤**", "한**", "오**"];

async function run() {
    console.log("🚀 후기 데이터 주입 시작 (space_id 사용)...");

    for (const name of companies) {
        const { data: company } = await supabase.from('memorial_spaces').select('id').ilike('name', `%${name}%`).maybeSingle();

        if (!company) {
            console.log(`PASS: ${name}`);
            continue;
        }

        const reviews = Array.from({ length: 5 }).map(() => ({
            space_id: company.id, // Using existing column name
            user_id: crypto.randomUUID(), // Fake ID
            user_name: userNames[Math.floor(Math.random() * userNames.length)],
            content: reviewComments[Math.floor(Math.random() * reviewComments.length)],
            rating: 5,
            created_at: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString()
        }));

        const { error } = await supabase.from('reviews').insert(reviews);
        if (error) {
            console.error(`❌ ${name} 실패:`, error.message);
        } else {
            console.log(`✅ ${name} 완료`);
        }
    }
}

run();
