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

function analyzePrices(prices: PriceItem[] | null): { status: string; samplePrice: string } {
    if (!prices || prices.length === 0) {
        return { status: '❌ 없음', samplePrice: '-' };
    }

    let priceExamples: string[] = [];
    for (const item of prices) {
        const price = item.price || item.가격 || item.규격;
        const itemName = item.item || item.품목 || '';

        if (price) {
            const priceStr = String(price);
            if (priceStr.match(/\d/)) {
                priceExamples.push(`${itemName}: ${priceStr}`);
            } else {
                priceExamples.push(`${itemName}: ${priceStr} (불완전)`);
            }
        }
    }

    if (priceExamples.length === 0) {
        return { status: '❌ 없음', samplePrice: '-' };
    }

    const hasNumber = priceExamples.some(p => p.match(/\d/));
    if (hasNumber) {
        return { status: '✅ 있음', samplePrice: priceExamples.slice(0, 2).join(' / ') };
    } else {
        return { status: '⚠️ 불완전', samplePrice: priceExamples.slice(0, 2).join(' / ') };
    }
}

async function generateFullList() {
    console.log('장례식장 전체 리스트 생성 중...\n');

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

    // Generate markdown report
    let report = `# 장례식장 전체 가격 현황 리포트\n\n`;
    report += `생성일: ${new Date().toLocaleString('ko-KR')}\n\n`;
    report += `## 요약\n\n`;
    report += `- **총 장례식장**: ${facilities.length}개\n`;

    let withPrice = 0;
    let withoutPrice = 0;
    let incomplete = 0;

    const withPriceList: { name: string; verified: boolean; address: string; sample: string }[] = [];
    const withoutPriceList: { name: string; verified: boolean; address: string }[] = [];

    for (const f of facilities) {
        const { status, samplePrice } = analyzePrices(f.prices);
        if (status === '✅ 있음') {
            withPrice++;
            withPriceList.push({ name: f.name, verified: f.is_verified, address: f.address, sample: samplePrice });
        } else if (status === '⚠️ 불완전') {
            incomplete++;
            withoutPriceList.push({ name: f.name, verified: f.is_verified, address: f.address });
        } else {
            withoutPrice++;
            withoutPriceList.push({ name: f.name, verified: f.is_verified, address: f.address });
        }
    }

    report += `- **가격 정보 있음**: ${withPrice}개 ✅\n`;
    report += `- **가격 정보 없음/불완전**: ${withoutPrice + incomplete}개 ❌\n\n`;

    report += `---\n\n`;
    report += `## 가격 정보 없는 시설 목록 (${withoutPriceList.length}개)\n\n`;
    report += `| # | 시설명 | 인증 | 주소 |\n`;
    report += `|---|--------|------|------|\n`;

    withoutPriceList.forEach((f, i) => {
        const verified = f.verified ? '✓' : '';
        report += `| ${i + 1} | ${f.name} | ${verified} | ${f.address} |\n`;
    });

    report += `\n---\n\n`;
    report += `## 가격 정보 있는 시설 목록 (${withPriceList.length}개)\n\n`;
    report += `| # | 시설명 | 인증 | 가격 예시 |\n`;
    report += `|---|--------|------|----------|\n`;

    withPriceList.forEach((f, i) => {
        const verified = f.verified ? '✓' : '';
        const sample = f.sample.length > 50 ? f.sample.substring(0, 47) + '...' : f.sample;
        report += `| ${i + 1} | ${f.name} | ${verified} | ${sample} |\n`;
    });

    // Write to file
    const outputPath = path.resolve(process.cwd(), 'scripts', 'funeral-price-report.md');
    fs.writeFileSync(outputPath, report, 'utf-8');

    console.log(`✅ 리포트 생성 완료: ${outputPath}`);
    console.log(`\n📊 요약:`);
    console.log(`   - 총 장례식장: ${facilities.length}개`);
    console.log(`   - 가격 있음: ${withPrice}개`);
    console.log(`   - 가격 없음/불완전: ${withoutPrice + incomplete}개`);
}

generateFullList();
