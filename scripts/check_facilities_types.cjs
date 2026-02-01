const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function checkFacilitiesSchema() {
    // We can't query information_schema directly via PostgREST usually unless RPC is set up.
    // But we can try to guess or use a sample insert or look at existing data.
    const { data, error } = await supabase
        .from('facilities')
        .select('user_id')
        .limit(1);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Sample user_id:', data[0]?.user_id);
    console.log('Type of user_id (JS level):', typeof data[0]?.user_id);
}

checkFacilitiesSchema();
