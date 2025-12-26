
import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
);

async function processFourPaws() {
    console.log("🔍 '포포즈 반려동물장례식장 김포점' 확인 중...");

    const nameQuery = '포포즈%김포%';
    const { data: existing, error } = await supabase
        .from('memorial_spaces')
        .select('*')
        .ilike('name', nameQuery);

    if (existing && existing.length > 0) {
        console.log(`✅ 이미 존재합니다: ${existing[0].name} (ID: ${existing[0].id})`);
        console.log(`   Address: ${existing[0].address}`);
        console.log(`   Image: ${existing[0].image_url}`);
        // We will update it in next steps if needed
    } else {
        console.log("⚠️  DB에 존재하지 않습니다. 신규 추가가 필요합니다.");
    }
}

processFourPaws();
