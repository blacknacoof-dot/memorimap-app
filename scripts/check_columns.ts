
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

async function checkColumns() {
    console.log('--- 🔍 Column Check ---');

    // We can't access information_schema easily via client usually, so we'll select * limit 1 and check keys
    const { data, error } = await supabase
        .from('facilities')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error selecting facility:', error);
    } else if (data && data.length > 0) {
        const sample = data[0];
        console.log('Available keys:', Object.keys(sample));

        if ('images' in sample) console.log('✅ Has "images" column');
        if ('image_url' in sample) console.log('✅ Has "image_url" column');
    } else {
        console.log('No facilities found to check columns.');
    }
}

checkColumns();
