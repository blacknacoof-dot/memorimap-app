const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function checkReviews() {
    console.log('--- Reviews Check Start ---');

    // Check one record from facility_reviews
    const { data: revSample, error: revError } = await supabase
        .from('facility_reviews')
        .select('*')
        .limit(1);

    if (revError) {
        console.error('Error fetching review sample:', revError);
    } else {
        if (revSample && revSample.length > 0) {
            console.log('💬 facility_reviews columns:', Object.keys(revSample[0]));
            // Also check for legacy IDs
            const { data: legacyReviews } = await supabase
                .from('facility_reviews')
                .select('facility_id')
                .ilike('facility_id', 'fc%')
                .limit(5);
            console.log('💬 legacy facility_id samples in reviews:', legacyReviews);
        }
    }

    console.log('--- Reviews Check End ---');
}

checkReviews();
