import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
);

interface Facility {
    id: number;
    name: string;
    type: string;
    prices: any;
    address: string;
}

// 장례식장 관련 키워드
const funeralKeywords = ['빈소', '접객실', '장례식장', '임대료', '발인', '염습', '안치'];
// 추모시설 관련 키워드
const memorialKeywords = ['봉안', '개인단', '부부단', '1위', '2위', '수목장', '자연장', '평'];

async function findMismatchedData() {
    console.log('🔍 데이터 불일치 검사 시작...\n');

    // 전체 시설 가져오기 (prices가 있는 것만)
    const { data: facilities, error } = await supabase
        .from('memorial_spaces')
        .select('id, name, type, prices, address')
        .not('prices', 'is', null)
        .limit(3000);

    if (error) {
        console.error('❌ DB 조회 실패:', error.message);
        return;
    }

    console.log(`📋 가격 데이터가 있는 시설: ${facilities?.length}개\n`);

    const mismatches: any[] = [];

    facilities?.forEach((f: Facility) => {
        if (!f.prices) return;

        const pricesStr = JSON.stringify(f.prices).toLowerCase();
        const hasFuneralPrices = funeralKeywords.some(k => pricesStr.includes(k));
        const hasMemorialPrices = memorialKeywords.some(k => pricesStr.includes(k));

        let issue = '';

        // 추모공원/봉안시설/공원묘지/자연장인데 장례식장 가격이 있는 경우
        if (['park', 'charnel', 'natural', 'complex'].includes(f.type)) {
            if (hasFuneralPrices && !hasMemorialPrices) {
                issue = `${getTypeName(f.type)}인데 장례식장 가격표가 있음`;
            }
        }

        // 장례식장인데 봉안시설 가격만 있는 경우
        if (f.type === 'funeral') {
            if (hasMemorialPrices && !hasFuneralPrices) {
                issue = `장례식장인데 봉안시설/수목장 가격표가 있음`;
            }
        }

        // 동물장례인데 일반 장례/추모 가격이 있는 경우
        if (f.type === 'pet') {
            if ((hasFuneralPrices || hasMemorialPrices) && !pricesStr.includes('반려') && !pricesStr.includes('펫') && !pricesStr.includes('동물')) {
                issue = `동물장례인데 일반 장례/추모 가격표가 있음`;
            }
        }

        if (issue) {
            mismatches.push({
                id: f.id,
                name: f.name,
                type: f.type,
                typeName: getTypeName(f.type),
                issue,
                address: f.address,
                pricesSample: getPricesSample(f.prices)
            });
        }
    });

    console.log(`\n⚠️ 불일치 발견: ${mismatches.length}개\n`);

    // 결과 출력
    if (mismatches.length > 0) {
        console.log('='.repeat(60));
        mismatches.forEach((m, i) => {
            console.log(`[${i + 1}] ${m.name}`);
            console.log(`    타입: ${m.typeName} (${m.type})`);
            console.log(`    문제: ${m.issue}`);
            console.log(`    가격샘플: ${m.pricesSample}`);
            console.log();
        });
    }

    // 마크다운 보고서 생성
    let report = `# 시설 데이터 불일치 검사 보고서\n\n`;
    report += `**검사일시**: ${new Date().toLocaleString('ko-KR')}\n`;
    report += `**검사 대상**: ${facilities?.length}개 시설\n`;
    report += `**불일치 발견**: ${mismatches.length}개\n\n`;
    report += `---\n\n`;

    if (mismatches.length > 0) {
        report += `## ⚠️ 타입-가격 불일치 시설 목록\n\n`;
        report += `| # | 시설명 | 타입 | 문제 | 가격샘플 |\n`;
        report += `|---|--------|------|------|----------|\n`;

        mismatches.forEach((m, i) => {
            report += `| ${i + 1} | ${m.name} | ${m.typeName} | ${m.issue} | ${m.pricesSample.substring(0, 50)}... |\n`;
        });

        report += `\n---\n\n`;
        report += `## 📋 상세 정보\n\n`;

        mismatches.forEach((m, i) => {
            report += `### ${i + 1}. ${m.name}\n`;
            report += `- **ID**: ${m.id}\n`;
            report += `- **타입**: ${m.typeName} (${m.type})\n`;
            report += `- **문제**: ${m.issue}\n`;
            report += `- **주소**: ${m.address || '없음'}\n`;
            report += `- **가격 데이터 샘플**: \`${m.pricesSample}\`\n\n`;
        });
    } else {
        report += `✅ 모든 시설의 타입과 가격 데이터가 일치합니다.\n`;
    }

    const reportPath = path.resolve(process.cwd(), 'scripts/data_mismatch_report.md');
    fs.writeFileSync(reportPath, report, 'utf-8');
    console.log(`\n📝 보고서 저장: ${reportPath}`);

    // JSON도 저장
    const jsonPath = path.resolve(process.cwd(), 'scripts/data_mismatch_list.json');
    fs.writeFileSync(jsonPath, JSON.stringify(mismatches, null, 2), 'utf-8');
    console.log(`📝 JSON 저장: ${jsonPath}`);
}

function getTypeName(type: string): string {
    const names: Record<string, string> = {
        'funeral': '장례식장',
        'charnel': '봉안시설',
        'natural': '자연장',
        'park': '공원묘지',
        'complex': '복합시설',
        'pet': '동물장례',
        'sea': '해양장'
    };
    return names[type] || type;
}

function getPricesSample(prices: any): string {
    try {
        if (Array.isArray(prices) && prices.length > 0) {
            const first = prices[0];
            return first.name || first.spec || first.price || JSON.stringify(first).substring(0, 80);
        }
        return JSON.stringify(prices).substring(0, 80);
    } catch {
        return '파싱 불가';
    }
}

findMismatchedData();
