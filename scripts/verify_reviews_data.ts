import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) { process.exit(1); }
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('🔍 Verifying Reviews in DB...');

    // 1. Get a Sangjo company
    const { data: company } = await supabase.from('memorial_spaces').select('id, name').ilike('name', '%프리드라이프%').single();

    if (!company) {
        console.log('❌ Sangjo company not found');
        return;
    }
    console.log(`✅ Company Found: ${company.name} (${company.id})`);

    // 2. Check reviews using space_id
    const { data: reviews, error } = await supabase.from('reviews').select('*').eq('space_id', company.id);

    if (error) {
        console.error('❌ DB Select Error:', error);
    } else {
        console.log(`✅ Reviews count using space_id: ${reviews.length}`);
        if (reviews.length > 0) console.log('Sample:', reviews[0]);
    }
}

check();
