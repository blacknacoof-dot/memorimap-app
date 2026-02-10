const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function checkFavs() {
    const targets = ['user_likes', 'favorites'];
    for (const table of targets) {
        console.log(`\n--- ${table} Check ---`);
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            console.log(`Error: ${error.message}`);
        } else if (data && data.length > 0) {
            console.log(`Columns: ${Object.keys(data[0])}`);
            const { data: legacy } = await supabase.from(table).select('*').ilike('facility_id', 'fc%').limit(5);
            console.log(`Legacy Samples:`, legacy);
        } else {
            console.log('Empty table');
        }
    }
}

checkFavs();
