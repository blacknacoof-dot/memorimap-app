
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// USE ANON KEY (Mimic Frontend)
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing/Bad Anon Key");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
    console.log("🕵️  Checking RLS Visibility with ANON KEY...");

    // Fetch ANY 5 reviews
    const { data: reviews, error } = await supabase
        .from('reviews')
        .select('*')
        .limit(5);

    if (error) {
        console.error("❌ Error fetching reviews:", error);
        return;
    }

    console.log(`Fetched ${reviews?.length} reviews.`);
    if (reviews && reviews.length > 0) {
        reviews.forEach(r => {
            console.log(`- ID: ${r.id}, Name: '${r.user_name}' (Type: ${typeof r.user_name})`);
        });
    }
}

check();
