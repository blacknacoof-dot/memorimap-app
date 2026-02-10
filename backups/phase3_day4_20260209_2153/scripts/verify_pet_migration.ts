
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyMigration() {
    console.log('=== Migration Verification ===\n');

    const keywords = ['%펫%', '%동물%', '%강아지%', '%21그램%', '%포레스트%'];

    // 1. facilities 테이블: category 컬럼 사용
    const { data: facilities, error: fError } = await supabase
        .from('facilities')
        .select('id, name, category, target_audience')  // ✅ facility_type -> category
        .eq('category', 'funeral_home')                 // ✅ 수정됨
        .or(keywords.map(k => `name.ilike.${k}`).join(','));

    if (fError) {
        console.error('Error checking facilities:', fError);
    } else {
        if (facilities.length === 0) {
            console.log('✅ No pet facilities in "funeral_home" category');
        } else {
            console.error(`❌ Found ${facilities.length} pet facilities in funeral_home:`);
            facilities.forEach(f => console.log(`   - ${f.name} (${f.id})`));
        }
    }

    // 2. memorial_spaces 확인 (변경 없음)
    const { data: spaces, error: sError } = await supabase
        .from('memorial_spaces')
        .select('id, name, category')
        .eq('category', '장례식장')
        .or(keywords.map(k => `name.ilike.${k}`).join(','));

    if (sError) {
        console.error('Error checking memorial_spaces:', sError);
    } else {
        if (spaces.length === 0) {
            console.log('✅ No pet facilities in "장례식장" category');
        } else {
            console.error(`❌ Found ${spaces.length} pet facilities still in 장례식장:`);
            spaces.forEach(s => console.log(`   - ${s.name} (${s.id})`));
        }
    }
}

verifyMigration();
