import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const envPath = path.resolve(process.cwd(), '.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));
const supabase = createClient(envConfig.VITE_SUPABASE_URL!, envConfig.VITE_SUPABASE_SERVICE_ROLE_KEY!);

async function check() {
    console.log('=== DB 가격 데이터 확인 ===\n');

    // 비장례시설 중 가격 있는 것 확인
    const { data, error } = await supabase
        .from('memorial_spaces')
        .select('id, name, type, prices')
        .neq('type', 'funeral')
        .limit(20);

    if (error) {
        console.error('Error:', error);
        return;
    }

    let withPrices = 0;
    let withoutPrices = 0;

    console.log('샘플 시설 (처음 20개):');
    data?.forEach((f, i) => {
        const hasPrices = f.prices && Array.isArray(f.prices) && f.prices.length > 0;
        if (hasPrices) withPrices++;
        else withoutPrices++;

        console.log(`${i + 1}. [${f.type}] ${f.name}`);
        console.log(`   가격: ${hasPrices ? JSON.stringify(f.prices) : '없음'}`);
    });

    console.log(`\n샘플 중 가격 있음: ${withPrices}개 / 없음: ${withoutPrices}개`);

    // 특정 시설 확인 (매칭됐어야 할 시설)
    const { data: testData } = await supabase
        .from('memorial_spaces')
        .select('id, name, type, prices')
        .ilike('name', '%경주공원%')
        .limit(5);

    console.log('\n=== 경주공원 검색 결과 ===');
    testData?.forEach(f => {
        console.log(`${f.name} [${f.type}]: ${JSON.stringify(f.prices)}`);
    });
}

check();
