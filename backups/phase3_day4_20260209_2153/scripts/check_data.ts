import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Manually load .env or .env.local
let envPath = path.resolve(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
    envPath = path.resolve(process.cwd(), '.env.local');
}

console.log('Loading env from:', envPath);
if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
} else {
    console.error('No .env or .env.local file found.');
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing in environment variables.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
    console.log('--- Checking DB Content ---');

    // 1. Check 'facilities' table
    const { count: facCount, error: facError } = await supabase
        .from('facilities')
        .select('*', { count: 'exact', head: true });

    if (facError) console.error('Error querying facilities:', facError.message);
    else console.log(`Build-in Facilities Count: ${facCount}`);

    // 2. Check 'funeral_companies' table
    const { count: compCount, error: compError } = await supabase
        .from('funeral_companies') // Checking if this table exists and has data
        .select('*', { count: 'exact', head: true });

    if (compError) console.error('Error querying funeral_companies:', compError.message);
    else console.log(`Funeral Companies Count: ${compCount}`);

    // 3. Sample Data from Facilities
    if (facCount && facCount > 0) {
        const { data, error } = await supabase.from('facilities').select('id, name').limit(3);
        if (error) console.error('Error fetching facility samples:', error);
        console.log('Sample Facilities:', data);
    }

    // 4. Sample Data from Companies
    if (compCount && compCount > 0) {
        const { data, error } = await supabase.from('funeral_companies').select('id, name').limit(3);
        if (error) console.error('Error fetching company samples:', error);
        console.log('Sample Companies:', data);
    }
}

checkData();
