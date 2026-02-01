const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function listTables() {
    const tables = ['facilities', 'funeral_companies', 'facility_reviews', 'sangjo_favorites'];

    for (const table of tables) {
        const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
        if (!error) {
            console.log(`✅ Table exists: ${table} (Count: ${count})`);
        } else {
            console.log(`❌ Table lookup error: ${table} (${error.code || error.message})`);
        }
    }
}

listTables();
