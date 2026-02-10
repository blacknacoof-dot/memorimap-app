
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) { process.exit(1); }

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("🗑️ Deleting '삼성개발'...");

    const { error } = await supabase
        .from('memorial_spaces')
        .delete()
        .eq('name', '삼성개발')
        .eq('type', 'sangjo'); // Ensure we only delete the Sangjo entry

    if (error) {
        console.error("❌ Error deleting company:", error);
    } else {
        console.log("✅ Successfully deleted '삼성개발'.");
    }
}

run();
