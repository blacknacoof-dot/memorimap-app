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

if (!GOOGLE_API_KEY) {
    console.warn("⚠️ Google AI API 키를 찾을 수 없습니다. (VITE_GOOGLE_GENAI_API_KEY 또는 VITE_GOOGLE_AI_API_KEY)");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const genAI = GOOGLE_API_KEY ? new GoogleGenerativeAI(GOOGLE_API_KEY) : null;

const USER_NAMES = ["김지수", "이민호", "박서연", "최준혁", "정다은", "강현우", "윤지아", "송민재"];

// 🔥 시설 유형별 맞춤 프롬프트 맥락
const TYPE_CONTEXTS: Record<string, string> = {
    funeral: "장례식장 - 고인을 배웅하는 엄숙하고 경건한 분위기, 유가족에 대한 배려, 장례 절차 안내",
    charnel: "납골당/봉안당 - 조용하고 평화로운 안식처, 관리 상태, 접근성, 추모 공간의 정결함",
    natural: "수목장/자연장 - 자연 속 안식, 친환경적 분위기, 산책로와 자연경관, 힐링과 위안",
    sea: "해양장 - 바다와 함께하는 영면, 고요한 바다 풍경, 배웅 절차의 정중함",
    pet: "반려동물장 - 소중한 반려동물과의 이별, 세심한 배려, 추모 공간의 아늑함",
    park: "추모공원 - 넓고 쾌적한 공간, 다양한 장묘 선택지, 가족 방문에 적합한 시설",
    complex: "종합 장묘 시설 - 장례식장과 납골당 등이 결합된 복합 시설, 원스톱 서비스의 편리함"
};

/**
 * 📝 AI 실패 시 사용할 폴백 리뷰
 */
function generateFallbackReviews(name: string, type: string) {
    const templates = [
        { rating: 5.0, content: `${name}은 정말 조용하고 평화로운 곳이에요. 마음의 위안을 얻었습니다.` },
        { rating: 4.8, content: `시설이 깨끗하고 관리가 잘 되어 있어서 좋았어요. 직원분들도 친절하셨습니다.` },
        { rating: 4.5, content: `교통편이 편리하고 주차 공간도 충분해서 방문하기 좋았습니다.` },
        { rating: 4.7, content: `분위기가 차분하고 정돈된 느낌이라 좋았습니다. 감사합니다.` },
        { rating: 4.9, content: `시설이 전반적으로 만족스럽네요. 고인을 모시기에 부족함이 없는 곳이라 추천드립니다.` }
    ];
    return templates;
}

/**
 * 🤖 Gemini AI를 사용하여 시설별 맞춤 리뷰와 별점 생성
 */
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
✅ 구체적인 경험 묘사 (예: "주차장이 넓어서 편했어요", "직원분이 차분하게 설명해주셔서")
✅ 긍정적이되 과장 없이 진정성 있게
✅ 각 리뷰는 서로 다른 장점에 초점

출력 형식 (반드시 JSON 배열만):
[
  {"rating": 5.0, "content": "리뷰 내용..."},
  {"rating": 4.5, "content": "리뷰 내용..."},
  {"rating": 4.8, "content": "리뷰 내용..."},
  {"rating": 4.3, "content": "리뷰 내용..."},
  {"rating": 4.7, "content": "리뷰 내용..."}
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
        console.error(`   ⚠️ ${name} AI 리뷰 생성 실패:`, e.message);
        return generateFallbackReviews(name, type);
    }
}

async function enrich() {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🚀 memorimap 지능형 리뷰 보강 엔진 시작 (이미지 보호)");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    let page = 0;
    const pageSize = 50;
    let totalProcessed = 0;
    let successCount = 0;
    let failCount = 0;

    while (true) {
        const { data: facilities, error } = await supabase
            .from('memorial_spaces')
            .select('*')
            .eq('is_verified', false) // 업체가 직접 관리하는 시설은 AI 리뷰 생성 제외
            .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) {
            console.error("❌ 데이터를 불러올 수 없습니다.", error);
            break;
        }

        if (!facilities || facilities.length === 0) break;

        console.log(`\n📦 페이지 ${page + 1} 처리 중 (${facilities.length}개 시설)...`);

        for (const f of facilities) {
            console.log(`  📍 [${++totalProcessed}] 시설: ${f.name}`);

            const aiReviews = await generateAIReviews(f.name, f.type);

            if (!aiReviews || !Array.isArray(aiReviews)) {
                failCount++;
                continue;
            }

            const reviewBatch = aiReviews.slice(0, 5).map((r: any, i: number) => ({
                facility_id: f.id,
                user_id: `ai-bot-${i}`,
                author_name: USER_NAMES[i % USER_NAMES.length],
                rating: Number(r.rating) || 5.0,
                content: (r.content || "훌륭한 시설입니다.").substring(0, 500),
                source: 'google',
                is_active: true
            }));

            // facility_reviews 테이블에만 업서트 (photos 필드를 명시적으로 제외하여 기존 데이터 보존)
            const { error: rError } = await supabase
                .from('facility_reviews')
                .upsert(reviewBatch, { onConflict: 'facility_id, user_id, source' });

            if (rError) {
                console.error("    ❌ DB 저장 실패:", rError.message);
                failCount++;
            } else {
                console.log(`    ✅ 고품질 리뷰 5개 및 별점 반영 완료`);
                successCount++;
            }

            await new Promise(r => setTimeout(r, 400));
        }

        page++;
    }

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🎉 보강 작업 완료!");
    console.log(`✅ 성공: ${successCount}개 시설`);
    console.log(`❌ 실패: ${failCount}개 시설`);
    console.log(`📝 총 처리: ${totalProcessed}개`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

enrich();
