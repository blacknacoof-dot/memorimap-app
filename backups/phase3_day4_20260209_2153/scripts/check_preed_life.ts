
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) { process.exit(1); }

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPreed() {
    console.log("🕵️  Hunting for Preed Life...");

    // 1. Find Company
    const { data: companies } = await supabase
        .from('memorial_spaces')
        .select('*')
        .ilike('name', '%프리드라이프%'); // Preed Life

    console.log("Companies found:", companies);

    if (companies && companies.length > 0) {
        for (const c of companies) {
            // 2. Reviews for this company
            const { data: reviews } = await supabase
                .from('reviews')
                .select('*')
                .eq('space_id', c.id);
            console.log(`Company ${c.name} (ID: ${c.id}) has ${reviews?.length} reviews.`);
            if (reviews && reviews.length > 0) {
                console.log("Sample Review:", reviews[0]);
            }
        }
    }
}

checkPreed();
