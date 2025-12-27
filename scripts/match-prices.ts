import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = 'https://xvmpvzldezpoxxsarizm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2bXB2emxkZXpwb3h4c2FyaXptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NTEwMTksImV4cCI6MjA4MTQyNzAxOX0.TC-SJKzTRANjoLiRi2yg_EHu6xLer2wr-RaJ4AWIv04';
const supabase = createClient(supabaseUrl, supabaseKey);

async function matchPrices() {
    // 가격 정보 로드
    const pricesPath = join(__dirname, '..', 'funeral_prices.json');
    const prices = JSON.parse(fs.readFileSync(pricesPath, 'utf-8'));

    // DB 장례식장 조회
    const { data: facilities, error } = await supabase
        .from('memorial_spaces')
        .select('id, name, address')
        .eq('type', 'funeral')
        .limit(50);

    if (error) {
        console.error('조회 오류:', error.message);
        return;
    }

    console.log('=== DB에 있는 장례식장 샘플 (50개) ===\n');

    let matchCount = 0;

    for (const fac of facilities || []) {
        // 가격 정보에서 매칭 시도
        const priceInfo = prices.find((p: any) => {
            const pName = p.장례식장명?.replace(/[()]/g, '').replace(/\s/g, '');
            const fName = fac.name?.replace(/[()]/g, '').replace(/\s/g, '');
            return pName?.includes(fName) || fName?.includes(pName);
        });

        if (priceInfo) {
            matchCount++;
            console.log(`✅ ${fac.name}`);
            console.log(`   가격: 빈소 ${priceInfo.빈소접객실 || '-'} / 안치실 ${priceInfo.안치실이용료 || '-'}`);
        } else {
            console.log(`❌ ${fac.name} (가격 정보 없음)`);
        }
    }

    console.log(`\n매칭됨: ${matchCount}/50개`);
}

matchPrices().catch(console.error);
