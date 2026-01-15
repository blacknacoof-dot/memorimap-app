const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env.local
const envPath = path.resolve(__dirname, '../.env.local');
const result = dotenv.config({ path: envPath });

if (result.error) {
    console.error('Error loading .env.local:', result.error);
    process.exit(1);
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyCategories() {
    console.log('Verifying facility categories...');

    // Inspect columns by fetching one row
    const { data, error } = await supabase
        .from('memorial_spaces')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching data:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log('Available columns:', Object.keys(data[0]));
        console.log('First row category/type:', { category: data[0].category, type: data[0].type });
    } else {
        console.log('No data found in memorial_spaces');
    }
}

verifyCategories();
