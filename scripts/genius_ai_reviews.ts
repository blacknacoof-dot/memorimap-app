import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from 'dotenv';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!;
const geminiApiKey = process.env.VITE_GOOGLE_GENAI_API_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);
const genAI = new GoogleGenerativeAI(geminiApiKey);
const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: { responseMimeType: "application/json" }
});

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function generateGeniusReviews(companyName: string, description: string) {
    const prompt = `
    상조 서비스 업체 '${companyName}'에 대한 매우 사실적이고 자연스러운 고객 후기 5개를 생성해줘.
    현직 작가가 쓴 것처럼 실제 경험이 녹아든 말투로 작성해줘.
    업체 정보: ${description}
    
    [요청사항]
    1. 별점(rating)은 3~5점 사이로 다양하게 배분 (평균 4.5점 이상 추천).
    2. 후기 작성자(userName)는 성만 공개 (예: 김**, 이**, 최**).
    3. 후기 내용(content)은 업체 고유의 특징을 반영해야 함. 
       - 예: 프리드라이프면 '1위 업체의 체계성', 예다함이면 '교직원공제회 신뢰도' 등.
    4. 칭찬뿐만 아니라 '가격이 조금 비싸지만 가치가 있다'거나 '상담 대기가 있었지만 친절했다'는 식의 현실적인 피드백 포함.
    5. 출력: 반드시 JSON 배열 형식 [{ "userName": "성**", "rating": 5, "content": "..." }, ...]
    `;

    try {
        const result = await model.generateContent(prompt);
        return JSON.parse(result.response.text());
    } catch (e) {
        console.error(`AI generation failed for ${companyName}`, e);
        return [];
    }
}

async function run() {
    console.log("🌟 [Genius Work] AI 기반 고품격 상조 후기 자동 생성 작업 시작...");

    const { data: companies } = await supabase.from('funeral_companies').select('*');
    if (!companies) return;

    // Detect columns
    const { data: sampleReview } = await supabase.from('reviews').select('*').limit(1);
    const availableCols = sampleReview && sampleReview.length > 0 ? Object.keys(sampleReview[0]) : [];
    console.log("📊 Detected Columns:", availableCols);

    const hasUserName = availableCols.includes('user_name');
    const hasFacilityId = availableCols.includes('facility_id');

    for (const company of companies) {
        console.log(`\n💎 ${company.name} 작업 중...`);

        await sleep(1500); // 1.5초 대기
        const reviews = await generateGeniusReviews(company.name, company.description || "");
        if (reviews.length === 0) continue;

        // Clear existing to make it look clean (Optional)
        await supabase.from('reviews').delete().eq(hasFacilityId ? 'facility_id' : 'memorial_space_id', company.id);

        const toInsert = reviews.map((r: any) => {
            const row: any = {
                id: uuidv4(),
                user_id: uuidv4(),
                rating: r.rating,
                content: r.content,
                created_at: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString()
            };
            if (hasFacilityId) row.facility_id = company.id;
            else row.memorial_space_id = company.id;

            if (hasUserName) row.user_name = r.userName;

            return row;
        });

        const { error } = await supabase.from('reviews').insert(toInsert);
        if (error) {
            console.error(`❌ ${company.name} 삽입 에러:`, error.message);
        } else {
            const avg = reviews.reduce((acc: number, cur: any) => acc + cur.rating, 0) / reviews.length;
            await supabase.from('funeral_companies').update({
                rating: parseFloat(avg.toFixed(1)),
                review_count: 5
            }).eq('id', company.id);
            console.log(`✅ ${company.name} 고품격 후기 5개 생성 완료 (평점: ${avg.toFixed(1)})`);
        }
    }

    console.log("\n🎊 모든 상조 회사에 대한 천재적인 후기 생성이 완료되었습니다!");
}

run();
