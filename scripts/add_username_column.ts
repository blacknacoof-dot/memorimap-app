import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fix() {
    console.log("🛠️ Adding user_name column to reviews table...");

    // We can't easily add a column via Supabase JS SDK without RPC or direct SQL.
    // Let's try to see if we can use a raw SQL approach if available, 
    // or just use a different column like 'images' temporarily? No, that's bad.

    // Check if we have an RPC to execute SQL
    const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: "ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS user_name TEXT;"
    });

    if (error) {
        console.error("❌ Failed to add column via RPC:", error.message);
        console.log("Please add 'user_name' column to 'reviews' table manually in Supabase SQL Editor if possible.");
    } else {
        console.log("✅ Column added successfully!");
    }
}

fix();
