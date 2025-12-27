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

// 전화번호 정규화 (숫자만 추출)
function normalizePhone(phone: string): string {
    return (phone || '').replace(/[^0-9]/g, '');
}

// 이름 정규화 (특수문자 제거, 소문자)
function normalizeName(name: string): string {
    return (name || '')
        .replace(/[()]/g, '')
        .replace(/\s/g, '')
        .replace(/장례식장|장례문화원|장례원/g, '')
        .toLowerCase();
}

async function matchAndGenerateSQL() {
    // 상세 가격 데이터 로드
    const pricesPath = join(__dirname, '..', 'funeral_prices_detailed.json');
    const pricesData: FacilityPrices[] = JSON.parse(fs.readFileSync(pricesPath, 'utf-8'));

    console.log(`📊 가격 데이터: ${pricesData.length}개 시설\n`);

    // DB 전체 장례식장 조회 (전화번호 포함)
    let allFacilities: any[] = [];
    let page = 0;
    const pageSize = 1000;

    while (true) {
        const { data, error } = await supabase
            .from('memorial_spaces')
            .select('id, name, address, phone, prices, price_range')
            .eq('type', 'funeral')
            .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) {
            console.error('조회 오류:', error.message);
            break;
        }

        if (data && data.length > 0) {
            allFacilities = [...allFacilities, ...data];
            if (data.length < pageSize) break;
            page++;
        } else {
            break;
        }
    }

    console.log(`🏢 DB 장례식장: ${allFacilities.length}개\n`);

    // 매칭 수행
    const matched: {
        dbId: string;
        dbName: string;
        dbPhone: string;
        csvName: string;
        prices: PriceItem[];
        priceRange: string;
    }[] = [];

    for (const fac of allFacilities) {
        // 이미 prices가 있는 경우 스킵
        if (fac.prices && Array.isArray(fac.prices) && fac.prices.length > 0) {
            continue;
        }

        // 가격 데이터 매칭 (이름 기반)
        const normalizedDbName = normalizeName(fac.name);

        const priceInfo = pricesData.find(p => {
            const normalizedCsvName = normalizeName(p.facilityName);

            // 정확 일치
            if (normalizedDbName === normalizedCsvName) return true;

            // 부분 일치 (DB 이름이 CSV에 포함되거나 그 반대)
            if (normalizedDbName.length > 2 && normalizedCsvName.length > 2) {
                if (normalizedDbName.includes(normalizedCsvName) || normalizedCsvName.includes(normalizedDbName)) {
                    return true;
                }
            }

            return false;
        });

        if (priceInfo && priceInfo.prices.length > 0) {
            // 가격 범위 생성
            const roomPrices = priceInfo.prices.filter(p => p.subCategory === '빈소+접객실' || p.subCategory === '접객실');
            const morguePrices = priceInfo.prices.filter(p => p.category === '안치실이용료');

            let priceRange = '';
            if (roomPrices.length > 0) {
                const min = Math.min(...roomPrices.map(p => p.price));
                const max = Math.max(...roomPrices.map(p => p.price));
                priceRange = min === max
                    ? `빈소 ${(min / 10000).toFixed(0)}만원`
                    : `빈소 ${(min / 10000).toFixed(0)}~${(max / 10000).toFixed(0)}만원`;
            }
            if (morguePrices.length > 0) {
                const morgueMin = Math.min(...morguePrices.map(p => p.price));
                if (priceRange) priceRange += ' / ';
                priceRange += `안치실 ${(morgueMin / 10000).toFixed(0)}만원`;
            }

            matched.push({
                dbId: fac.id,
                dbName: fac.name,
                dbPhone: fac.phone || '',
                csvName: priceInfo.facilityName,
                prices: priceInfo.prices,
                priceRange
            });
        }
    }

    console.log(`✅ 매칭됨: ${matched.length}개\n`);

    // SQL 파일 생성
    let sql = '-- 장례식장 가격 일괄 업데이트\n';
    sql += `-- 총 ${matched.length}개 시설\n`;
    sql += '-- 생성일: ' + new Date().toISOString() + '\n\n';

    for (const m of matched) {
        const escapedPrices = JSON.stringify(m.prices).replace(/'/g, "''");
        const escapedRange = m.priceRange.replace(/'/g, "''");

        sql += `-- ${m.dbName} (${m.csvName})\n`;
        sql += `UPDATE memorial_spaces\n`;
        sql += `SET prices = '${escapedPrices}'::jsonb,\n`;
        sql += `    price_range = '${escapedRange}'\n`;
        sql += `WHERE id = '${m.dbId}';\n\n`;
    }

    const sqlPath = join(__dirname, 'update_all_prices.sql');
    fs.writeFileSync(sqlPath, sql, 'utf-8');
    console.log(`✅ SQL 저장: ${sqlPath}`);
    console.log(`📝 총 ${matched.length}개 UPDATE 문 생성`);

    // 샘플 출력
    console.log('\n=== 매칭 샘플 (10개) ===\n');
    for (const m of matched.slice(0, 10)) {
        console.log(`DB: ${m.dbName}`);
        console.log(`CSV: ${m.csvName}`);
        console.log(`가격: ${m.priceRange}`);
        console.log('');
    }
}

matchAndGenerateSQL().catch(console.error);
