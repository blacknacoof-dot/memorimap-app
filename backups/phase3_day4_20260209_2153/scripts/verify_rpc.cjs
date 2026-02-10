const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const dotenv = require('dotenv');

const envPath = path.resolve(__dirname, '../.env.local');
dotenv.config({ path: envPath });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function verifyRPC() {
    console.log('Calling search_facilities RPC...');

    const { data, error } = await supabase.rpc('search_facilities', {
        lat: 37.5665,
        lng: 126.9780,
        radius_meters: 5000,
        filter_category: null
    });

    if (error) {
        console.error('RPC Failed:', error.message);
        console.error('Hint: The function might be referencing the old "type" column.');
    } else {
        console.log('RPC Success!');
        console.log('Returned rows:', data.length);
        if (data.length > 0) {
            console.log('Sample row keys:', Object.keys(data[0]));
            console.log('Sample row category:', data[0].category);
        }
    }
}

verifyRPC();
