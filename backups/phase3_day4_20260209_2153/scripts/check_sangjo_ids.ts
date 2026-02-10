
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
    console.error('Missing Supabase URL or Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSangjoIds() {
    console.log('--- 🔍 Checking Sangjo IDs ---');

    const { data, error } = await supabase
        .from('facilities')
        .select('id, name, category, legacy_id')
        .eq('category', 'sangjo')
        .limit(10);

    if (error) {
        console.error('❌ Query Error:', error.message);
    } else {
        console.log(`Found ${data.length} Sangjo items:`);
        data.forEach(item => {
            console.log(`[${item.name}] ID: ${item.id} (Type: ${typeof item.id}), Legacy ID: ${item.legacy_id}`);
        });
    }
}

checkSangjoIds();
