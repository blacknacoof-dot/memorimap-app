import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
dotenv.config({ path: path.resolve(rootDir, '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

async function analyze() {
    console.log('🔍 공원묘지 이미지 출처 분석 중...');

    const { data: facilities } = await supabase
        .from('facilities')
        .select('*')
        .eq('category', 'cemetery');

    if (!facilities) return;

    let uniqueCount = 0;
    let defaultCount = 0;
    let randomizationCount = 0; // 우리가 방금 돌린 랜덤 이미지

    facilities.forEach(f => {
        if (!f.images || f.images.length === 0) {
            defaultCount++; // 없음 = 기본(으로 칠지, 그냥 없음으로 칠지. 일단 자체 이미지는 아님)
            return;
        }

        // 이미지 URL 분석
        const urls = f.images as string[];
        const isCustom = urls.some(url => {
            // 우리가 넣은 것들 제외
            if (url.includes('defaults/')) return false;
            if (url.includes('cemetery_random/')) return false;
            if (url.includes('natural_random/')) return false;
            if (url.includes('columbarium_random/')) return false;
            if (url.includes('placeholder')) return false;

            // 그 외(Google, 다른 폴더 등)는 자체 이미지로 간주
            return true;
        });

        if (isCustom) {
            uniqueCount++;
            // console.log(`   [자체] ${f.name}: ${urls[0].substring(0, 40)}...`);
        } else {
            // 우리가 넣은 랜덤인지, 아니면 그냥 기본인지(또는 없음)
            if (urls.some(u => u.includes('_random/'))) randomizationCount++;
            else defaultCount++;
        }
    });

    console.log(`\n📊 분석 결과 (총 ${facilities.length}개 공원묘지):`);
    console.log(`   ✅ 업체 자체 이미지 보유: ${uniqueCount}곳`);
    console.log(`   🎨 랜덤/기본 이미지 사용: ${defaultCount + randomizationCount}곳`);
    console.log(`      (랜덤 배분됨: ${randomizationCount}곳, 기타/없음: ${defaultCount}곳)`);
}

analyze();
