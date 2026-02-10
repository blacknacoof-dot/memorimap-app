import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Manually load .env or .env.local
let envPath = path.resolve(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
    envPath = path.resolve(process.cwd(), '.env.local');
}

if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectColumns() {
    console.log('--- Inspecting Facilities Columns ---');

    // Select * to get all columns
    const { data, error } = await supabase
        .from('facilities')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching one row:', error);
    } else if (data && data.length > 0) {
        console.log('Available Columns:', Object.keys(data[0]));
        console.log('Sample Row:', data[0]);
    } else {
        console.log('Table seems empty.');
    }
}

inspectColumns();
