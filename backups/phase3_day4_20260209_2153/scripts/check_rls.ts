import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
// USE ANON KEY to simulate frontend
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRLS() {
    console.log("🔍 Checking 'reviews' table access with ANON KEY...");

    // 1. Try to fetch one review
    const { data, error, count } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true });

    if (error) {
        console.error("❌ Error fetching reviews with ANON key:", error);
    } else {
        console.log(`✅ Success! Total reviews visible to ANON: ${count}`);
    }

    // 2. Try to fetch for fc6
    const { data: fc6Reviews, error: fc6Error } = await supabase
        .from('reviews')
        .select('*')
        .eq('facility_id', 'fc6');

    if (fc6Error) {
        console.error("❌ Error fetching fc6 reviews with ANON key:", fc6Error);
    } else {
        console.log(`✅ Success! Reviews for fc6 visible to ANON: ${fc6Reviews?.length}`);
    }
}

checkRLS();
