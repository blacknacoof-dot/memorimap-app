const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function checkNames() {
    const { data: missing, error } = await supabase
        .from('facility_reviews')
        .select('id, author_name')
        .is('author_name', null)
        .limit(10);

    if (error) {
        console.error(error);
    } else {
        console.log(`Reviews with missing author_name: ${missing.length}`);
        console.log(missing);
    }
}

checkNames();
