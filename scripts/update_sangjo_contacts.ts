import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) { process.exit(1); }

const supabase = createClient(supabaseUrl, supabaseKey);

const contactMap: Record<string, string> = {
    "프리드라이프": "1588-3740",
    "대명스테이션": "1588-2227",
    "교원라이프": "1899-0020",
    "더케이예다함상조": "1566-6644",
    "보람상조": "1588-7979",
    "보람재향상조": "1588-7979",
    "JK상조": "1599-4484",
    "늘곁애라이프": "1577-6250",
    "더리본": "1644-3651",
    "효원상조": "1588-8873",
    "한강라이프": "1688-0972",
    "부모사랑": "1566-0114",
    "평화상조": "1588-1774",
    "에스제이산림조합": "1800-3535",
    "현대에스라이프": "1544-9083",
    "용인공원라이프": "02-762-4444",
    "좋은라이프": "1644-7934",
    "우리가족상조": "070-8144-5294",
    "다온플랜": "1577-1555",
    "금강문화허브": "1544-4945",
    "제주상조": "064-751-1024",
    "대노복지사업단": "1588-3543",
    "한라상조": "1588-7979",
    "디에스라이프": "1577-7883",
    "위드라이프": "1688-2877",
    "바라밀": "1544-9083",
    "우상조": "1588-0000",
    "두레문화": "1588-9517",
    "불국토": "02-3270-3377",
    "태양상조": "1588-0393",
    "아주상조": "1899-2646",
    "대한공무원상조": "1577-1323",
    "매일상조": "053-256-5891",
    "삼성개발": "053-745-8100",
    "크리스찬상조": "1644-4491",
    "대전상조": "1588-7979",
    "전국공무원상조": "1577-1323",
    "유토피아퓨처": "1599-7904",
    "다나상조": "1588-3145"
};

async function run() {
    console.log("🚀 상조 회사 연락처 업데이트 시작...");

    for (const [name, contact] of Object.entries(contactMap)) {
        // Find company ID by name partial match to be safe, or exact match
        const { data: company } = await supabase
            .from('memorial_spaces')
            .select('id, name')
            .ilike('name', `%${name}%`)
            .maybeSingle();

        if (!company) {
            console.log(`⚠️ PASS: ${name} (DB 미발견)`);
            continue;
        }

        // Update phone
        const { error } = await supabase
            .from('memorial_spaces')
            .update({ phone: contact })
            .eq('id', company.id);

        if (error) {
            console.error(`❌ ${company.name} 업데이트 실패:`, error.message);
        } else {
            console.log(`✅ ${company.name} 연락처 업데이트: ${contact}`);
        }
    }
}

run();
