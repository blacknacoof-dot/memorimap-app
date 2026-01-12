
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase Credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const targetCompanies = [
    "프리드라이프",
    "더케이예다함",
    "보람상조",
    "대명스테이션",
    "교원라이프"
];

const userNames = ["김**", "이**", "박**", "최**", "정**", "강**", "조**", "윤**", "장**", "임**"];
const comments = [
    "상담원분이 너무 친절하셔서 믿고 맡길 수 있었습니다.",
    "장례 절차가 복잡해서 걱정했는데 하나하나 잘 설명해주셨네요.",
    "역시 업계 1위답게 서비스가 체계적이네요. 감사합니다.",
    "갑작스러운 일이라 당황했는데 큰 도움이 되었습니다.",
    "가격 대비 서비스 품질이 훌륭했습니다. 주변에도 추천할게요."
];

async function run() {
    console.log("☢️  Starting Nuclear Review Fix...");

    for (const companyName of targetCompanies) {
        // 1. Find Company
        const { data: company } = await supabase
            .from('memorial_spaces')
            .select('id')
            .ilike('name', `%${companyName}%`)
            .maybeSingle();

        if (!company) {
            console.log(`⚠️  Could not find company: ${companyName}`);
            continue;
        }

        console.log(`🔹 Processing ${companyName} (${company.id})...`);

        // 2. DELETE existing reviews
        const { error: deleteError } = await supabase
            .from('reviews')
            .delete()
            .or(`space_id.eq.${company.id},memorial_space_id.eq.${company.id}`);

        if (deleteError) {
            console.error(`   ❌ Delete failed:`, deleteError.message);
        } else {
            console.log(`   ✅ Cleared existing reviews.`);
        }

        // 3. INSERT new reviews
        const newReviews = Array.from({ length: 5 }).map(() => ({
            space_id: company.id,            // For potential legacy compat via string
            memorial_space_id: company.id,   // Explicit foreign key
            user_id: crypto.randomUUID(),    // Random UUID
            user_name: userNames[Math.floor(Math.random() * userNames.length)], // Explicit Masked Name
            content: comments[Math.floor(Math.random() * comments.length)],
            rating: Math.floor(Math.random() * 3) + 3, // 3~5
            created_at: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString()
        }));

        const { error: insertError } = await supabase
            .from('reviews')
            .insert(newReviews);

        if (insertError) {
            console.error(`   ❌ Insert failed:`, insertError.message);
        } else {
            console.log(`   ✅ Inserted 5 fresh reviews with masked names.`);
        }
    }

    console.log("\n✅ Fix Complete. Please refresh your app.");
}

run();
