
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase Credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    console.log("🔍 Inspecting Reviews for 프리드라이프...");

    // 1. Find the Facility ID
    const { data: facility, error: fError } = await supabase
        .from('memorial_spaces')
        .select('id, name')
        .ilike('name', '%프리드라이프%')
        .maybeSingle();

    if (fError || !facility) {
        console.error("❌ Facility not found:", fError);
        return;
    }

    console.log(`✅ Facility Found: ${facility.name} (${facility.id})`);

    // 2. Fetch Reviews trying all possible column names
    // We select * to see all columns
    const { data: reviews, error: rError } = await supabase
        .from('reviews')
        .select('*')
        .or(`space_id.eq.${facility.id},memorial_space_id.eq.${facility.id}`);

    if (rError) {
        console.error("❌ Error fetching reviews:", rError);
        return;
    }

    console.log(`📋 Found ${reviews?.length} reviews.`);
    if (reviews && reviews.length > 0) {
        console.log("First 3 reviews raw data:", JSON.stringify(reviews.slice(0, 3), null, 2));
    } else {
        console.log("No reviews found.");
    }
}

inspect();
