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

async function checkUpdatedImages() {
    console.log('🔍 업데이트된 이미지 확인\n');

    const { data, error } = await supabase
        .from('facilities')
        .select('name, images')
        .eq('category', 'funeral_home')
        .limit(5);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('📊 샘플 5개 시설:\n');
    data.forEach((facility, idx) => {
        console.log(`${idx + 1}. ${facility.name}`);
        if (facility.images && facility.images.length > 0) {
            facility.images.forEach((img: string, imgIdx: number) => {
                const isNew = img.includes('funeral_real');
                const status = isNew ? '✅ 새 이미지' : '⚠️  기본 이미지';
                console.log(`   [${imgIdx + 1}] ${status}`);
                console.log(`       ${img.substring(0, 100)}...`);
            });
        } else {
            console.log('   ❌ 이미지 없음');
        }
        console.log();
    });
}

checkUpdatedImages();
