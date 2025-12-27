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

interface FuneralFacility {
    id: number;
    name: string;
    address: string;
    prices: PriceItem[] | null;
    is_verified: boolean;
}

function analyzePrices(prices: PriceItem[] | null): { status: string; details: string } {
    if (!prices || prices.length === 0) {
        return { status: 'NO_PRICE', details: '가격 정보 없음' };
    }

    let hasActualPrice = false;
    let hasPlaceholder = false;
    let priceDetails: string[] = [];

    for (const item of prices) {
        const price = item.price || item.가격 || item.규격;
        const itemName = item.item || item.품목 || '';

        if (price) {
            const priceStr = String(price);

            // Check if it's just a placeholder without actual value
            if (priceStr === '임대료' ||
                priceStr.match(/^임대료\s*$/) ||
                priceStr.match(/임대료\([^)]+\)\s*기준\s*$/) ||
                priceStr.match(/임대료\s*기준/) ||
                !priceStr.match(/\d/)) {
                hasPlaceholder = true;
                priceDetails.push(`${itemName}: ${priceStr} (불완전)`);
            } else {
                hasActualPrice = true;
                priceDetails.push(`${itemName}: ${priceStr}`);
            }
        } else {
            hasPlaceholder = true;
        }
    }

    if (hasActualPrice && !hasPlaceholder) {
        return { status: 'COMPLETE', details: priceDetails.join(' | ') };
    } else if (hasActualPrice && hasPlaceholder) {
        return { status: 'PARTIAL', details: priceDetails.join(' | ') };
    } else {
        return { status: 'PLACEHOLDER_ONLY', details: priceDetails.join(' | ') };
    }
}

async function auditFuneralPrices() {
    console.log('=== 장례식장 가격 데이터 감사 ===\n');

    const { data, error } = await supabase
        .from('memorial_spaces')
        .select('id, name, address, prices, is_verified')
        .eq('type', 'funeral')
        .order('name');

    if (error) {
        console.error('Error:', error);
        return;
    }

    const facilities = data as FuneralFacility[];
    console.log(`총 장례식장 수: ${facilities.length}개\n`);

    const categories = {
        COMPLETE: [] as FuneralFacility[],
        PARTIAL: [] as FuneralFacility[],
        PLACEHOLDER_ONLY: [] as FuneralFacility[],
        NO_PRICE: [] as FuneralFacility[]
    };

    const analysis: { facility: FuneralFacility; status: string; details: string }[] = [];

    for (const facility of facilities) {
        const { status, details } = analyzePrices(facility.prices);
        categories[status as keyof typeof categories].push(facility);
        analysis.push({ facility, status, details });
    }

    // Summary
    console.log('=== 요약 ===');
    console.log(`✅ 완전한 가격 정보: ${categories.COMPLETE.length}개`);
    console.log(`⚠️ 부분적 가격 정보: ${categories.PARTIAL.length}개`);
    console.log(`❌ 플레이스홀더만 있음: ${categories.PLACEHOLDER_ONLY.length}개`);
    console.log(`🔹 가격 정보 없음: ${categories.NO_PRICE.length}개`);
    console.log('');

    // Details for PLACEHOLDER_ONLY
    if (categories.PLACEHOLDER_ONLY.length > 0) {
        console.log('\n=== 플레이스홀더만 있는 시설 (수정 필요) ===');
        categories.PLACEHOLDER_ONLY.forEach((f, i) => {
            const verified = f.is_verified ? '✓인증' : '';
            console.log(`${i + 1}. ${f.name} ${verified}`);
            console.log(`   주소: ${f.address}`);
            const { details } = analyzePrices(f.prices);
            console.log(`   현재: ${details}`);
            console.log('');
        });
    }

    // Details for NO_PRICE
    if (categories.NO_PRICE.length > 0) {
        console.log('\n=== 가격 정보 없는 시설 ===');
        categories.NO_PRICE.slice(0, 20).forEach((f, i) => {
            const verified = f.is_verified ? '✓인증' : '';
            console.log(`${i + 1}. ${f.name} ${verified} - ${f.address}`);
        });
        if (categories.NO_PRICE.length > 20) {
            console.log(`... 외 ${categories.NO_PRICE.length - 20}개`);
        }
    }

    // Sample of COMPLETE
    console.log('\n=== 완전한 가격 정보 예시 (처음 5개) ===');
    categories.COMPLETE.slice(0, 5).forEach((f, i) => {
        const verified = f.is_verified ? '✓인증' : '';
        console.log(`${i + 1}. ${f.name} ${verified}`);
        const { details } = analyzePrices(f.prices);
        console.log(`   가격: ${details.substring(0, 100)}${details.length > 100 ? '...' : ''}`);
    });
}

auditFuneralPrices();
