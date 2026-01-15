const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load .env.local
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
} else {
    console.log(".env.local not found");
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
    process.exit(1);
}

console.log(`Connecting to Supabase at ${supabaseUrl.substring(0, 15)}...`);

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    const { data, error } = await supabase.from('memorial_spaces').select('count', { count: 'exact', head: true });
    if (error) {
        console.error('Connection failed:', error);
    } else {
        console.log('Connection successful! count:', data); // data is null for head:true with count, but confirm no error
        console.log('Supabase is reachable.');
    }
}

testConnection();
