import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!);

// Map of Company Name -> Image URL
// You can replace the placeholder URLs with actual image links (e.g., from an S3 bucket or public URL)
const imageMap: Record<string, string> = {
    "보람상조": "https://placehold.co/600x400/ededed/1a1a1a/png?text=BORAM",
    "보람재향상조": "https://placehold.co/600x400/ededed/1a1a1a/png?text=BORAM+Jaehyang",
    "JK상조": "https://placehold.co/600x400/ededed/1a1a1a/png?text=JK+Life",
    "늘곁애라이프": "https://placehold.co/600x400/ededed/1a1a1a/png?text=Neulgyeotae",
    "더리본": "https://placehold.co/600x400/ededed/1a1a1a/png?text=The+Reborn",
    "한강라이프": "https://placehold.co/600x400/ededed/1a1a1a/png?text=Hangang+Life",
    "평화상조": "https://placehold.co/600x400/ededed/1a1a1a/png?text=Pyeonghwa",
    "에스제이산림조합": "https://placehold.co/600x400/ededed/006400/png?text=SJ+Forest",
    "좋은라이프": "https://placehold.co/600x400/ededed/1a1a1a/png?text=Good+Life",
    "우리가족상조": "https://placehold.co/600x400/ededed/1a1a1a/png?text=Woori+Family",
    "다온플랜": "https://placehold.co/600x400/ededed/1a1a1a/png?text=Daon+Plan",
    "금강문화허브": "https://placehold.co/600x400/ededed/1a1a1a/png?text=Geumgang",
    "제주상조": "https://placehold.co/600x400/ededed/1a1a1a/png?text=Jeju+Sangjo",
    "디에스라이프": "https://placehold.co/600x400/ededed/1a1a1a/png?text=DS+Life",
    "위드라이프": "https://placehold.co/600x400/ededed/1a1a1a/png?text=With+Life",
    "바라밀": "https://placehold.co/600x400/ededed/1a1a1a/png?text=Baramil",
    "우상조": "https://placehold.co/600x400/ededed/1a1a1a/png?text=Woo+Sangjo",
    "두레문화": "https://placehold.co/600x400/ededed/1a1a1a/png?text=Dure+Culture",
    "불국토": "https://placehold.co/600x400/ededed/1a1a1a/png?text=Bulgukto",
    "태양상조": "https://placehold.co/600x400/ededed/1a1a1a/png?text=Sun+Sangjo",
    "아주상조": "https://placehold.co/600x400/ededed/1a1a1a/png?text=Aju+Sangjo",
    "대한공무원상조": "https://placehold.co/600x400/ededed/1a1a1a/png?text=KCS",
    "매일상조": "https://placehold.co/600x400/ededed/1a1a1a/png?text=Maeil",
    "삼성개발": "https://placehold.co/600x400/ededed/1a1a1a/png?text=Samsung+Dev",
    "대전상조": "https://placehold.co/600x400/ededed/1a1a1a/png?text=Daejeon",
    "전국공무원상조": "https://placehold.co/600x400/ededed/1a1a1a/png?text=National+Official",
    "다나상조": "https://placehold.co/600x400/ededed/1a1a1a/png?text=Dana"
};

async function run() {
    console.log("🚀 Updating Sangjo Images...");

    for (const [name, url] of Object.entries(imageMap)) {
        // Find by name
        const { data: company } = await supabase
            .from('memorial_spaces')
            .select('id, name')
            .ilike('name', `%${name}%`)
            .maybeSingle();

        if (!company) {
            console.log(`⚠️ PASS: ${name} (DB Not Found)`);
            continue;
        }

        // Update image_url
        const { error } = await supabase
            .from('memorial_spaces')
            .update({ image_url: url })
            .eq('id', company.id);

        if (error) {
            console.error(`❌ ${company.name} Failed:`, error.message);
        } else {
            console.log(`✅ ${company.name} Image Updated!`);
        }
    }
}

run();
