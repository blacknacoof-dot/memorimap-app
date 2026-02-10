import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = 'https://xvmpvzldezpoxxsarizm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2bXB2emxkZXpwb3h4c2FyaXptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NTEwMTksImV4cCI6MjA4MTQyNzAxOX0.TC-SJKzTRANjoLiRi2yg_EHu6xLer2wr-RaJ4AWIv04';
const supabase = createClient(supabaseUrl, supabaseKey);

interface PriceItem {
    category: string;
    subCategory: string;
    name: string;
    detail: string;
    price: number;
    priceDisplay: string;
}

interface FacilityPrices {
    facilityName: string;
    prices: PriceItem[];
}

async function generateTestSQL() {
    // 상세 가격 데이터 로드
    const pricesPath = join(__dirname, '..', 'funeral_prices_detailed.json');
    const pricesData: FacilityPrices[] = JSON.parse(fs.readFileSync(pricesPath, 'utf-8'));

    // DB 장례식장 조회
    const { data: facilities, error } = await supabase
        .from('memorial_spaces')
        .select('id, name, address')
        .eq('type', 'funeral')
        .limit(200);

    if (error) {
        console.error('조회 오류:', error.message);
        return;
    }

    // 매칭 및 SQL 생성
    const matched: { dbName: string; dbId: string; pricesJson: string; pricesSummary: string }[] = [];

    for (const fac of facilities || []) {
        // 가격 정보에서 매칭
        const priceInfo = pricesData.find(p => {
            const pName = p.facilityName?.replace(/[()]/g, '').replace(/\s/g, '').toLowerCase();
            const fName = fac.name?.replace(/[()]/g, '').replace(/\s/g, '').toLowerCase();
            return pName?.includes(fName) || fName?.includes(pName);
        });

        if (priceInfo && priceInfo.prices.length > 0) {
            // JSON 문자열 생성
            const pricesJson = JSON.stringify(priceInfo.prices);

            // 요약 생성 (빈소 최저~최고, 안치실)
            const roomPrices = priceInfo.prices.filter(p => p.subCategory === '빈소+접객실');
            const morguePrices = priceInfo.prices.filter(p => p.category === '안치실이용료');

            let summary = '';
            if (roomPrices.length > 0) {
                const min = Math.min(...roomPrices.map(p => p.price));
                const max = Math.max(...roomPrices.map(p => p.price));
                if (min === max) {
                    summary += `빈소 ${(min / 10000).toFixed(0)}만원`;
                } else {
                    summary += `빈소 ${(min / 10000).toFixed(0)}~${(max / 10000).toFixed(0)}만원`;
                }
            }
            if (morguePrices.length > 0) {
                const morgueMin = Math.min(...morguePrices.map(p => p.price));
                if (summary) summary += ' / ';
                summary += `안치실 ${(morgueMin / 10000).toFixed(0)}만원`;
            }

            matched.push({
                dbName: fac.name,
                dbId: fac.id,
                pricesJson,
                pricesSummary: summary
            });

            if (matched.length >= 10) break;
        }
    }

    console.log('=== 테스트 업데이트 대상 10개 시설 ===\n');

    for (let i = 0; i < matched.length; i++) {
        const m = matched[i];
        console.log(`${i + 1}. ${m.dbName}`);
        console.log(`   가격: ${m.pricesSummary}`);
    }

    // SQL 생성
    let sql = '-- 테스트: 10개 장례식장 상세 가격 업데이트\n\n';

    for (const m of matched) {
        const escapedJson = m.pricesJson.replace(/'/g, "''");
        sql += `-- ${m.dbName}\n`;
        sql += `UPDATE memorial_spaces\n`;
        sql += `SET prices = '${escapedJson}'::jsonb,\n`;
        sql += `    price_range = '${m.pricesSummary}'\n`;
        sql += `WHERE id = '${m.dbId}';\n\n`;
    }

    const sqlPath = join(__dirname, 'test_prices_10.sql');
    fs.writeFileSync(sqlPath, sql, 'utf-8');
    console.log(`\n✅ SQL 저장: ${sqlPath}`);
}

generateTestSQL().catch(console.error);
