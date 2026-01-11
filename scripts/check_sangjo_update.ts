import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Force load .env.local from CWD
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Try known variable names
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    // Debug: print what we found (masked)
    console.log('Available Env Keys:', Object.keys(process.env).filter(k => k.includes('SUPABASE')));
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('🔍 Checking Memorial Spaces update...');
    const { data, error } = await supabase
        .from('memorial_spaces')
        .select('name, description, features')
        .ilike('name', '%프리드라이프%')
        .maybeSingle();

    if (error) {
        console.error('❌ Error fetching memorial_space:', error);
    } else if (data) {
        console.log(`✅ Name: ${data.name}`);
        console.log(`✅ Description Present: ${!!data.description}`);
        console.log(`✅ Features Present: ${data.features && data.features.length > 0}`);
    } else {
        console.log('⚠️ Facility not found');
    }

    console.log('\n🔍 Checking Reviews table access...');
    const { data: reviews, error: reviewError } = await supabase
        .from('reviews')
        .select('count', { count: 'exact', head: true });

    if (reviewError) {
        console.error('❌ Reviews Table Error:', reviewError);
    } else {
        console.log(`✅ Reviews Table Accessible. Count: ${reviews}`);
    }
}

check();
