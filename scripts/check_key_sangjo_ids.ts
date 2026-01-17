
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

async function checkSpecificIds() {
    console.log('--- 🔍 Checking IDs for Major Sangjo Companies ---');

    const keywords = ['교원', '프리드', '대명', '보람', '예다함', '부모사랑'];

    for (const keyword of keywords) {
        const { data } = await supabase
            .from('facilities')
            .select('id, name, legacy_id')
            .ilike('name', `%${keyword}%`)
            .limit(5);

        if (data && data.length > 0) {
            console.log(`\nResults for "${keyword}":`);
            data.forEach(item => {
                console.log(` - [${item.name}] ID: ${item.id} (Type: ${typeof item.id}), Legacy: ${item.legacy_id}`);
            });
        } else {
            console.log(`\nNo results for "${keyword}"`);
        }
    }
}

checkSpecificIds();
