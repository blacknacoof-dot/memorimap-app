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

async function checkBrokenSangjo() {
    const { data, error } = await supabase
        .from('facilities')
        .select('name, address')
        .eq('category', 'sangjo');

    if (error) {
        console.error('Error:', error);
        return;
    }

    const brokenImages = data.filter(f => {
        return JSON.stringify(f).includes('places.googleapis.com');
    });

    console.log('깨진 이미지 상조 회사:\n');
    brokenImages.forEach((f, i) => {
        console.log(`${i + 1}. ${f.name}`);
        console.log(`   주소: ${f.address || 'N/A'}\n`);
    });
}

checkBrokenSangjo();
