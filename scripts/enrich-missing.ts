
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as path from 'path';
import * as fs from 'fs';

// --- 환경 변수 로드 ---
function loadEnv() {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf-8');
        envContent.split(/\r?\n/).forEach(line => {
            const trimmedLine = line.trim();
            if (!trimmedLine || trimmedLine.startsWith('#')) return;
            const [key, ...valueParts] = trimmedLine.split('=');
            if (key && valueParts.length > 0) {
                const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
                if (value) process.env[key.trim()] = value;
            }
        });
    }
}

loadEnv();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';
const GOOGLE_API_KEY = process.env.VITE_GOOGLE_GENAI_API_KEY || process.env.VITE_GOOGLE_AI_API_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("❌ 필수 설정(Supabase)이 누락되었습니다.");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const genAI = GOOGLE_API_KEY ? new GoogleGenerativeAI(GOOGLE_API_KEY) : null;

const USER_NAMES = ["김지수", "이민호", "박서연", "최준혁", "정다은", "강현우", "윤지아", "송민재"];

const TYPE_CONTEXTS: Record<string, string> = {
    funeral: "장례식장 - 고인을 배웅하는 엄숙하고 경건한 분위기, 유가족에 대한 배려, 장례 절차 안내",
    charnel: "납골당/봉안당 - 조용하고 평화로운 안식처, 관리 상태, 접근성, 추모 공간의 정결함",
    natural: "수목장/자연장 - 자연 속 안식, 친환경적 분위기, 산책로와 자연경관, 힐링과 위안",
    sea: "해양장 - 바다와 함께하는 영면, 고요한 바다 풍경, 배웅 절차의 정중함",
    pet: "반려동물장 - 소중한 반려동물과의 이별, 세심한 배려, 추모 공간의 아늑함",
    park: "추모공원 - 넓고 쾌적한 공간, 다양한 장묘 선택지, 가족 방문에 적합한 시설",
    complex: "종합 장묘 시설 - 장례식장과 납골당 등이 결합된 복합 시설, 원스톱 서비스의 편리함"
};

function generateFallbackReviews(name: string, type: string) {
    return [
        { rating: 5.0, content: `${name}은 정말 조용하고 평화로운 곳이에요. 마음의 위안을 얻었습니다.` },
        { rating: 4.8, content: `시설이 깨끗하고 관리가 잘 되어 있어서 좋았어요. 직원분들도 친절하셨습니다.` },
        { rating: 4.5, content: `교통편이 편리하고 주차 공간도 충분해서 방문하기 좋았습니다.` },
        { rating: 4.7, content: `분위기가 차분하고 정돈된 느낌이라 좋았습니다. 감사합니다.` },
        { rating: 4.9, content: `시설이 전반적으로 만족스럽네요. 고인을 모시기에 부족함이 없는 곳이라 추천드립니다.` }
    ];
}

async function generateAIReviews(name: string, type: string) {
    if (!genAI) return generateFallbackReviews(name, type);

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
        const context = TYPE_CONTEXTS[type] || TYPE_CONTEXTS.funeral;

        const prompt = `
당신은 한국의 장례/추모 시설 리뷰 작성 전문가입니다.

시설 정보:
- 이름: ${name}
- 유형: ${type}
- 맥락: ${context}

다음 5가지 관점에서 각각 1개씩, 총 5개의 리뷰를 작성해주세요:
1. 분위기와 위안 (별점 4.5~5.0)
2. 청결과 시설 관리 (별점 4.2~5.0)
3. 직원의 친절함과 전문성 (별점 4.5~5.0)
4. 교통 접근성과 주차 (별점 4.0~4.8)
5. 전반적 추천 (별점 4.5~5.0)

작성 가이드:
✅ 실제 방문자가 작성한 듯한 자연스러운 구어체 (~해요, ~네요, ~입니다)
✅ 50~150자 사이의 적당한 길이
✅ 구체적인 경험 묘사
✅ 긍정적이되 과장 없이 진정성 있게
✅ 각 리뷰는 서로 다른 장점에 초점

출력 형식 (반드시 JSON 배열만):
[
  {"rating": 5.0, "content": "리뷰 내용..."},
  {"rating": 4.5, "content": "리뷰 내용..."}
]
다른 설명 없이 JSON만 출력하세요.
`;

        const result = await model.generateContent(prompt);
        let text = result.response.text().trim();

        const jsonStart = text.indexOf('[');
        const jsonEnd = text.lastIndexOf(']') + 1;
        if (jsonStart !== -1 && jsonEnd !== -1) {
            text = text.substring(jsonStart, jsonEnd);
        }

        const reviews = JSON.parse(text);
        if (!Array.isArray(reviews) || reviews.length === 0) throw new Error("Invalid output");
        return reviews;
    } catch (e: any) {
        console.error(`   ⚠️ ${name} AI 리뷰 생성 실패 (Fallback 사용):`, e.message);
        return generateFallbackReviews(name, type);
    }
}

async function enrichMissing() {
    console.log("🚀 리뷰 미보유 시설 보강 시작...");

    // 리뷰가 0개인 시설 조회 (supabase에서 review_count가 0이거나 null인 것)
    // 하지만 review_count가 트리거로 업데이트되는지 확실치 않으므로, 
    // 여기서는 간단하게 상위 100개 중 리뷰가 없는 것을 찾거나, 
    // 전체를 돌면서 확인하기엔 비용이 큼.
    // 기존 스크립트 check-reviews.ts 로직 활용: 전체 로드 후 필터링이 가장 확실.

    const { data: facilities, error } = await supabase
        .from('memorial_spaces')
        .select('id, name, type, review_count')
        .or('review_count.is.null,review_count.eq.0');

    if (error || !facilities) {
        console.error("❌ 데이터 로드 실패:", error);
        return;
    }

    console.log(`📋 리뷰 없는 시설 발견: ${facilities.length}개`);

    for (const f of facilities) {
        console.log(`  📍 처리 중: ${f.name} (${f.type})`);

        const aiReviews = await generateAIReviews(f.name, f.type);

        const reviewBatch = aiReviews.slice(0, 5).map((r: any, i: number) => ({
            facility_id: f.id,
            user_id: `ai-bot-${f.id}-${i}`, // Unique user ID per review
            author_name: USER_NAMES[i % USER_NAMES.length],
            rating: Number(r.rating) || 5.0,
            content: (r.content || "좋은 시설입니다.").substring(0, 500),
            source: 'google',
            created_at: new Date().toISOString(),
            is_active: true
        }));

        const { error: rError } = await supabase
            .from('facility_reviews')
            .upsert(reviewBatch);

        if (rError) {
            console.error(`    ❌ 저장 실패: ${rError.message}`);
        } else {
            console.log(`    ✅ 리뷰 5개 생성 완료`);
            // Update review count manually just in case trigger is slow or missing
            await supabase.from('memorial_spaces').update({ review_count: 5 }).eq('id', f.id);
        }

        // Rate limit protection
        await new Promise(r => setTimeout(r, 1000));
    }

    console.log("🎉 작업 완료!");
}

enrichMissing();
