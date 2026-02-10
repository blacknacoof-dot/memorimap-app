const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const dotenv = require('dotenv');

const envPath = path.resolve(__dirname, '../.env.local');
dotenv.config({ path: envPath });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function checkCounts() {
    console.log('Checking category counts...');

    const { data, error } = await supabase
        .from('memorial_spaces')
        .select('category');

    if (error) {
        console.error('Error:', error);
        return;
    }

    const counts = {};
    data.forEach(row => {
        const cat = row.category || 'NULL';
        counts[cat] = (counts[cat] || 0) + 1;
    });

    console.table(counts);
}

checkCounts();
