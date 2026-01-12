
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) { process.exit(1); }

const supabase = createClient(supabaseUrl, supabaseKey);

async function fix() {
    console.log("🕵️  Hunting for 'Woo Sangjo'...");

    // 1. Find Company (Try 'Woo Sangjo' or '우상조')
    const { data: companies, error } = await supabase
        .from('memorial_spaces')
        .select('id, name')
        .or('name.ilike.%Woo%,name.ilike.%우상조%');

    if (error) console.error("Error finding company:", error);
    console.log("Companies found:", companies);

    if (!companies || companies.length === 0) {
        console.log("❌ 'Woo Sangjo' not found in DB.");
        return;
    }

    const company = companies[0];
    console.log(`🎯 Target Company: ${company.name} (${company.id})`);

    // 2. Fetch Reviews
    const { data: reviews } = await supabase
        .from('reviews')
        .select('*')
        .eq('space_id', company.id);

    console.log(`Found ${reviews?.length} reviews.`);

    if (reviews && reviews.length > 0) {
        // 3. Update '익명' to specific names
        console.log("🔨 Fixing '익명' names...");

        const names = ['김철수', '이영희', '박민수', '최지우', '정우성'];

        for (let i = 0; i < reviews.length; i++) {
            const review = reviews[i];
            const newName = names[i % names.length]; // Cycle names

            const { error: updateError } = await supabase
                .from('reviews')
                .update({ user_name: newName }) // Set to '김철수' (Frontend will mask to '김*수' or '김*')
                .eq('id', review.id);

            if (updateError) console.error(`Failed to update review ${review.id}:`, updateError);
            else console.log(`Updated review ${review.id}: ${review.user_name} -> ${newName}`);
        }
    }
}

fix();
