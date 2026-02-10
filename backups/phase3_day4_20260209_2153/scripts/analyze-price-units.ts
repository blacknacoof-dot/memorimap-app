import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseKey = envConfig.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface PriceItem {
    item?: string;
    품목?: string;
    detail?: string;
    세부내용?: string;
    price?: string | number;
    가격?: string | number;
    규격?: string;
}

async function analyzePriceUnits() {
    console.log('=== 장례식장 가격 단위 분석 ===\n');

    const { data, error } = await supabase
        .from('memorial_spaces')
        .select('id, name, prices')
        .eq('type', 'funeral')
        .not('prices', 'is', null);

    if (error) {
        console.error('Error:', error);
        return;
    }

    // 가격 분포 분석
    const priceValues: { name: string; item: string; price: number; raw: string }[] = [];

    for (const facility of data || []) {
        if (!facility.prices || !Array.isArray(facility.prices)) continue;

        for (const priceItem of facility.prices as PriceItem[]) {
            const price = priceItem.price || priceItem.가격;
            const itemName = priceItem.item || priceItem.품목 || '(항목명 없음)';

            if (price) {
                const priceStr = String(price);
                // 숫자만 추출
                const numericMatch = priceStr.match(/[\d,]+/);
                if (numericMatch) {
                    const numericValue = parseInt(numericMatch[0].replace(/,/g, ''));
                    if (!isNaN(numericValue) && numericValue > 0) {
                        priceValues.push({
                            name: facility.name,
                            item: itemName,
                            price: numericValue,
                            raw: priceStr
                        });
                    }
                }
            }
        }
    }

    console.log(`총 가격 항목 수: ${priceValues.length}개\n`);

    // 가격 범위 분석
    const ranges = {
        '1-100': 0,           // 1원~100원 (만원 단위라면 1만원~100만원)
        '101-1000': 0,        // 101원~1000원 (만원 단위라면 101만원~1,000만원)
        '1001-10000': 0,      // 1,001원~10,000원
        '10001-100000': 0,    // 10,001원~100,000원
        '100001-1000000': 0,  // 100,001원~1,000,000원
        '1000001+': 0         // 1,000,001원 이상
    };

    for (const pv of priceValues) {
        if (pv.price <= 100) ranges['1-100']++;
        else if (pv.price <= 1000) ranges['101-1000']++;
        else if (pv.price <= 10000) ranges['1001-10000']++;
        else if (pv.price <= 100000) ranges['10001-100000']++;
        else if (pv.price <= 1000000) ranges['100001-1000000']++;
        else ranges['1000001+']++;
    }

    console.log('=== 가격 분포 ===');
    console.log(`1~100: ${ranges['1-100']}개 (만원 단위라면 1만원~100만원)`);
    console.log(`101~1,000: ${ranges['101-1000']}개`);
    console.log(`1,001~10,000: ${ranges['1001-10000']}개`);
    console.log(`10,001~100,000: ${ranges['10001-100000']}개`);
    console.log(`100,001~1,000,000: ${ranges['100001-1000000']}개`);
    console.log(`1,000,001 이상: ${ranges['1000001+']}`);

    // 샘플 출력 - 각 범위별로 몇 개씩
    console.log('\n=== 가격 샘플 ===');

    // 1~100 범위 샘플 (만원 단위일 가능성 높음)
    const lowPrices = priceValues.filter(p => p.price <= 100).slice(0, 5);
    if (lowPrices.length > 0) {
        console.log('\n[1~100 범위] (만원 단위일 가능성):');
        lowPrices.forEach(p => {
            console.log(`  ${p.name} - ${p.item}: ${p.price} (원본: ${p.raw})`);
        });
    }

    // 1,001~10,000 범위 샘플
    const midLowPrices = priceValues.filter(p => p.price > 1000 && p.price <= 10000).slice(0, 5);
    if (midLowPrices.length > 0) {
        console.log('\n[1,001~10,000 범위]:');
        midLowPrices.forEach(p => {
            console.log(`  ${p.name} - ${p.item}: ${p.price} (원본: ${p.raw})`);
        });
    }

    // 10,001~100,000 범위 샘플
    const midPrices = priceValues.filter(p => p.price > 10000 && p.price <= 100000).slice(0, 5);
    if (midPrices.length > 0) {
        console.log('\n[10,001~100,000 범위]:');
        midPrices.forEach(p => {
            console.log(`  ${p.name} - ${p.item}: ${p.price} (원본: ${p.raw})`);
        });
    }

    // 100,001~1,000,000 범위 샘플
    const highPrices = priceValues.filter(p => p.price > 100000 && p.price <= 1000000).slice(0, 5);
    if (highPrices.length > 0) {
        console.log('\n[100,001~1,000,000 범위]:');
        highPrices.forEach(p => {
            console.log(`  ${p.name} - ${p.item}: ${p.price} (원본: ${p.raw})`);
        });
    }

    // 1,000,001 이상 샘플
    const veryHighPrices = priceValues.filter(p => p.price > 1000000).slice(0, 5);
    if (veryHighPrices.length > 0) {
        console.log('\n[1,000,001 이상]:');
        veryHighPrices.forEach(p => {
            console.log(`  ${p.name} - ${p.item}: ${p.price.toLocaleString()} (원본: ${p.raw})`);
        });
    }

    // 결론
    console.log('\n=== 분석 결과 ===');
    const under100Percent = (ranges['1-100'] / priceValues.length * 100).toFixed(1);
    const over100kPercent = ((ranges['100001-1000000'] + ranges['1000001+']) / priceValues.length * 100).toFixed(1);

    console.log(`1~100 범위 비율: ${under100Percent}%`);
    console.log(`10만원 이상 비율: ${over100kPercent}%`);

    if (parseFloat(under100Percent) > 50) {
        console.log('\n⚠️ 결론: 가격이 만원 단위로 저장되어 있을 가능성이 높습니다.');
        console.log('   예: 30 = 30만원, 100 = 100만원');
    } else if (parseFloat(over100kPercent) > 50) {
        console.log('\n✅ 결론: 가격이 원 단위로 저장되어 있습니다.');
        console.log('   예: 300000 = 30만원, 1000000 = 100만원');
    } else {
        console.log('\n⚠️ 결론: 가격 단위가 혼재되어 있을 수 있습니다.');
    }
}

analyzePriceUnits();
