
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('URL:', supabaseUrl ? 'Found' : 'Missing');
console.log('Key:', supabaseKey ? 'Found' : 'Missing');

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFacility() {
    console.log('Checking distinct types...');

    // distinct is not directly supported easily in simple select via js client without some tricks or rpc, 
    // but we can just fetch a bunch and see.
    const { data, error } = await supabase
        .from('memorial_spaces')
        .select('type')
        .range(0, 500);

    if (error) {
        console.error('Error:', error);
        return;
    }

    const types = new Set(data.map(d => d.type));
    console.log('Found types:', Array.from(types));
}

checkFacility();
