const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function checkFC6Detail() {
    const { data, error } = await supabase
        .from('funeral_companies')
        .select('name')
        .eq('id', 'fc6')
        .single();

    if (error) {
        console.log('FC6 not found in funeral_companies');
    } else {
        console.log('FC6 Name:', data.name);
    }
}

checkFC6Detail();
