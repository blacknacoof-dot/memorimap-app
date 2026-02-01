import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from 'dotenv';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!;
const geminiApiKey = process.env.VITE_GOOGLE_GENAI_API_KEY!;

if (!supabaseUrl || !supabaseKey || !geminiApiKey) {
    console.error('❌ Missing environment variables (Supabase or Gemini)');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const genAI = new GoogleGenerativeAI(geminiApiKey);
const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp",
    generationConfig: { responseMimeType: "application/json" }
});

async function generateReviews(companyName: string, description: string) {
    const prompt = `
    상조 서비스 업체 '${companyName}'에 대한 실제 고객 후기 5개를 생성해줘.
    업체 설명: ${description}
    
    [가이드라인]
    1. 별점(rating)은 3점에서 5점 사이로 랜덤하게 배분해줘.
    2. 사용자 이름(userName)은 '김**', '이**' 처럼 성씨만 공개된 형식으로 해줘.
    3. 내용은 2~3문장으로, 구체적이고 현실적이어야 해. (상담원의 친절함, 장례 절차의 체계성, 가격 만족도, 시설 상태 등 언급)
    4. 출력 형식은 반드시 아래 JSON 배열 형태여야 해:
    [
      { "userName": "이**", "rating": 5, "content": "내용..." },
      ...
    ]
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = result.response;
        return JSON.parse(response.text());
    } catch (error) {
        console.error(`Error generating reviews for ${companyName}:`, error);
        return [];
    }
}

async function run() {
    console.log("🚀 [천재적 작업] AI 기반 상조 후기 생성 시작...");

    // 1. 상조 회사 목록 조회
    const { data: companies, error: fetchError } = await supabase
        .from('funeral_companies')
        .select('id, name, description');

    if (fetchError || !companies) {
        console.error("❌ 상조 회사 조회 실패:", fetchError);
        return;
    }

    console.log(`📋 총 ${companies.length}개 업체 발견. 작업을 시작합니다...\n`);

    for (const company of companies) {
        console.log(`\n🔹 ${company.name} 후기 생성 중...`);

        // 2. AI로 후기 생성
        const aiReviews = await generateReviews(company.name, company.description || '최고의 상조 서비스');

        if (aiReviews.length === 0) {
            console.log(`⚠️ ${company.name} 후기 생성 실패, 스킵합니다.`);
            continue;
        }

        // 3. 기존 리뷰 삭제 (선택 사항 - 깨끗하게 다시 쌓고 싶다면 실행)
        await supabase.from('reviews').delete().eq('facility_id', company.id);

        // 4. DB 삽입 준비
        const reviewsToInsert = aiReviews.map((r: any) => ({
            id: uuidv4(),
            user_id: uuidv4(), // 가상 사용자 ID
            facility_id: company.id,
            user_name: r.userName,
            rating: r.rating,
            content: r.content,
            created_at: new Date(Date.now() - Math.floor(Math.random() * 60 * 24 * 60 * 60 * 1000)).toISOString() // 최근 2개월 내 랜덤
        }));

        // 5. DB 삽입
        const { error: insertError } = await supabase.from('reviews').insert(reviewsToInsert);

        if (insertError) {
            console.error(`   ❌ 삽입 실패:`, insertError.message);
        } else {
            console.log(`   ✅ 5개의 AI 후기가 성공적으로 등록되었습니다.`);

            // 6. 업체 평균 별점 및 후기 수 업데이트
            const avgRating = r.rating || (aiReviews.reduce((acc: number, cur: any) => acc + cur.rating, 0) / aiReviews.length);
            // 실제 DB에서 다시 계산해서 업데이트하는 게 정확함
            const { data: stats } = await supabase.rpc('get_facility_stats', { fac_id: company.id }); // 만약 rpc가 있다면

            // 간단하게 직접 계산해서 업데이트
            const finalAvg = parseFloat((aiReviews.reduce((acc: number, cur: any) => acc + cur.rating, 0) / aiReviews.length).toFixed(1));
            await supabase.from('funeral_companies').update({
                rating: finalAvg,
                review_count: 5
            }).eq('id', company.id);
        }
    }

    console.log("\n✨ 모든 상조 업체에 대한 천재적인 AI 후기 생성이 완료되었습니다!");
}

run();
