
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) { process.exit(1); }

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixAll() {
    console.log("🕵️  Hunting for ALL anonymous reviews...");

    // 1. Fetch Reviews where user_name is null OR '익명'
    const { data: reviews, error } = await supabase
        .from('reviews')
        .select('*')
        .or('user_name.is.null,user_name.eq.익명');

    if (error) {
        console.error("Error finding reviews:", error);
        return;
    }

    console.log(`Found ${reviews?.length} anonymous reviews to fix.`);

    if (reviews && reviews.length > 0) {
        console.log("🔨 Fixing names...");

        const surnames = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임'];
        const givenNames = ['철수', '영희', '민수', '지우', '우성', '민재', '서연', '하준', '지아', '서준'];

        for (const review of reviews) {
            // Generate random name
            const randomSurname = surnames[Math.floor(Math.random() * surnames.length)];
            const randomGiven = givenNames[Math.floor(Math.random() * givenNames.length)];
            const newName = randomSurname + randomGiven; // e.g., 김철수

            // Update
            const { error: updateError } = await supabase
                .from('reviews')
                .update({ user_name: newName })
                .eq('id', review.id);

            if (updateError) console.error(`Failed to update review ${review.id}:`, updateError);
            // else console.log(`Updated review ${review.id} -> ${newName}`);
        }
        console.log("✅ All done!");
    } else {
        console.log("🎉 No anonymous reviews found! Everything is clean.");
    }
}

fixAll();
