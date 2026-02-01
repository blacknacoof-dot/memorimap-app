import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnose() {
    console.log('--- Table: reviews ---');
    const { count: reviewsCount, error: e1 } = await supabase.from('reviews').select('*', { count: 'exact', head: true });
    console.log('Count:', reviewsCount, e1 || '');

    console.log('\n--- Table: facility_reviews ---');
    const { count: facilityReviewsCount, error: e2 } = await supabase.from('facility_reviews').select('*', { count: 'exact', head: true });
    console.log('Count:', facilityReviewsCount, e2 || '');
}

diagnose();
