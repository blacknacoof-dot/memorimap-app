
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

async function checkPriceInfo() {
    console.log('--- 🔍 Checking columns in "facilities" table ---');

    // Try to select price_info
    const { data, error } = await supabase
        .from('facilities')
        .select('price_info')
        .limit(1);

    if (error) {
        console.log('❌ price_info column likely missing:', error.message);

        // List all columns to see what we have
        const { data: cols, error: colError } = await supabase
            .from('facilities')
            .select('*')
            .limit(1);

        if (cols && cols.length > 0) {
            console.log('Available columns:', Object.keys(cols[0]));
        }
    } else {
        console.log('✅ price_info column EXISTS in facilities table.');
    }
}

checkPriceInfo();
