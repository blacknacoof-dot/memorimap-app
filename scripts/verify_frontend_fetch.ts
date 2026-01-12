
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
// CRITICAL: Use ANON KEY to simulate Frontend
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase URL or Anon Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
    console.log("🕵️  Verifying Frontend Fetch (ANON KEY)...");

    // 1. Find Preedlife
    const { data: company } = await supabase
        .from('memorial_spaces')
        .select('id, name')
        .ilike('name', '%프리드라이프%')
        .maybeSingle();

    if (!company) { console.log("⚠️  Preedlife not found via Anon Key."); return; }

    console.log(`🔹 Fetching reviews for ${company.name} (${company.id})...`);

    // 2. Fetch Reviews
    const { data: reviews, error } = await supabase
        .from('reviews')
        .select('id, user_name, content')
        .or(`space_id.eq.${company.id},memorial_space_id.eq.${company.id}`)
        .limit(3);

    if (error) {
        console.error("❌ Fetch Error:", error.message);
        return;
    }

    console.log(`📋 Fetched ${reviews?.length} reviews.`);
    if (reviews && reviews.length > 0) {
        reviews.forEach((r, i) => {
            console.log(`   [${i}] user_name: "${r.user_name}" | Content: ${r.content?.substring(0, 20)}...`);
        });
    } else {
        console.log("   (No reviews found)");
    }
}

run();
