const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function checkFC6() {
    const { data: fc6Reviews, error } = await supabase
        .from('facility_reviews')
        .select('id, content')
        .eq('facility_id', 'fc6');

    if (error) {
        console.error(error);
    } else {
        console.log(`Reviews with facility_id='fc6': ${fc6Reviews.length}`);
    }
}

checkFC6();
