const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const dotenv = require('dotenv');

const envPath = path.resolve(__dirname, '../.env.local');
dotenv.config({ path: envPath });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function findSangjo() {
    console.log('Searching for known Sangjo companies...');
    const names = ['프리드라이프', '보람상조', '교원라이프', '대명스테이션', '더케이', '예다함'];

    for (const name of names) {
        const { data, error } = await supabase
            .from('memorial_spaces')
            .select('id, name, category, image_url')
            .ilike('name', `%${name}%`);

        if (error) console.error(error);
        else {
            if (data.length > 0) {
                console.log(`Found ${name}:`);
                console.table(data);
            } else {
                console.log(`No results for ${name}`);
            }
        }
    }
}

findSangjo();
