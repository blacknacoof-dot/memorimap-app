
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase URL or Key');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkMemorialSpacesSchema() {
    console.log('--- 🔍 Checking columns in "memorial_spaces" table ---');

    // List all columns to see what we have
    const { data: cols, error: colError } = await supabase
        .from('memorial_spaces')
        .select('*')
        .limit(1);

    if (cols && cols.length > 0) {
        console.log('Available columns in memorial_spaces:', Object.keys(cols[0]));
        // Check if ID is integer
        console.log('Sample ID type:', typeof cols[0].id, cols[0].id);
    } else if (colError) {
        console.log('❌ Error fetching memorial_spaces:', colError.message);
    } else {
        console.log('⚠️ memorial_spaces table is empty or inaccessible.');
    }
}

checkMemorialSpacesSchema();
