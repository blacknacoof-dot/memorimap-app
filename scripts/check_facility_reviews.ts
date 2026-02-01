
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFacilityReviews() {
    console.log('Checking for "facility_reviews" entity...');

    // Check if it exists and what type it is
    const { data: tableInfo, error } = await supabase.from('facility_reviews').select('*').limit(1);

    if (error) {
        console.log('facility_reviews access failed:', error.message);
    } else {
        console.log('facility_reviews exists. Sample data keys:', tableInfo?.[0] ? Object.keys(tableInfo[0]) : 'Empty');
    }

    // Try to get view definition if possible
    // Since we can't run raw SQL, we'll try to guess by checking common column names
}

checkFacilityReviews();
