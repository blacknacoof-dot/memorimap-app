
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// ES Module dirname workaround
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

async function checkIdType() {
    console.log('--- 🔍 ID Type Check ---');

    const { data, error } = await supabase
        .from('facilities')
        .select('id, name')
        .limit(1);

    if (error) {
        console.error('Error selecting facility:', error);
    } else if (data && data.length > 0) {
        const sample = data[0];
        console.log('Sample ID:', sample.id);
        console.log('Type of ID (JS):', typeof sample.id);
    } else {
        console.log('No facilities found.');
    }

    // Also try to check the definition using a trick if possible, but data inspection is usually enough for UUID vs Number
}

checkIdType();
