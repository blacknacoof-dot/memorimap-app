const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function checkCounts() {
    for (const table of ['user_likes', 'favorites']) {
        const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
        console.log(`${table} count: ${count}, error: ${error?.message || 'none'}`);
    }
}

checkCounts();
