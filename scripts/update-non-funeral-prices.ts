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

// 간소화된 가격 CSV 로드
const csvPath = path.resolve(process.cwd(), 'data', '비장례시설_가격_간소화.csv');
const csvContent = fs.readFileSync(csvPath, 'utf-8');
const csvLines = csvContent.split('\n').slice(1).filter(line => line.trim());

interface SimplifiedPrice {
    type: string;
    name: string;
    개인단: number | null;
    부부단: number | null;
}

const csvData: SimplifiedPrice[] = [];

for (const line of csvLines) {
    const match = line.match(/"([^"]+)","([^"]+)",([^,]*),([^,]*)/);
    if (match) {
        const [, type, name, 개인Str, 부부Str] = match;
        csvData.push({
            type,
            name,
            개인단: 개인Str ? parseFloat(개인Str) : null,
            부부단: 부부Str ? parseFloat(부부Str.replace(/\r/g, '')) : null
        });
    }
}

console.log(`CSV 가격 데이터: ${csvData.length}개 시설\n`);

// DB 타입 매핑
const typeMapping: { [key: string]: string[] } = {
    '묘지': ['park'],
    '봉안시설': ['charnel'],
    '화장시설': ['cremation'],
    '자연장지': ['natural']
};

async function updatePrices() {
    // DB에서 비장례식장 시설 조회
    const { data: dbData, error } = await supabase
        .from('memorial_spaces')
        .select('id, name, address, type, prices')
        .neq('type', 'funeral');

    if (error) {
        console.error('DB Error:', error);
        return;
    }

    console.log(`DB 시설 수: ${dbData?.length || 0}개\n`);

    // 이름 정규화
    const normalizeName = (name: string) => {
        return name
            .replace(/\s+/g, '')
            .replace(/[()（）\[\]【】]/g, '')
            .toLowerCase();
    };

    // CSV 데이터 맵 생성
    const csvMap = new Map<string, SimplifiedPrice>();
    csvData.forEach(c => {
        csvMap.set(normalizeName(c.name), c);
    });

    const matched: { db: any; csv: SimplifiedPrice }[] = [];
    const dbOnly: any[] = [];
    const usedCsvNames = new Set<string>();

    // 매칭
    for (const dbFac of dbData || []) {
        const normName = normalizeName(dbFac.name);

        if (csvMap.has(normName)) {
            matched.push({ db: dbFac, csv: csvMap.get(normName)! });
            usedCsvNames.add(normName);
        } else {
            // 부분 일치
            let found = false;
            for (const [normCsv, csvFac] of csvMap.entries()) {
                if (usedCsvNames.has(normCsv)) continue;
                if (normName.includes(normCsv) || normCsv.includes(normName)) {
                    matched.push({ db: dbFac, csv: csvFac });
                    usedCsvNames.add(normCsv);
                    found = true;
                    break;
                }
            }
            if (!found) {
                dbOnly.push(dbFac);
            }
        }
    }

    // CSV에만 있는 데이터
    const csvOnly: SimplifiedPrice[] = [];
    csvData.forEach(c => {
        if (!usedCsvNames.has(normalizeName(c.name))) {
            csvOnly.push(c);
        }
    });

    console.log('=== 매칭 결과 ===');
    console.log(`매칭됨: ${matched.length}개`);
    console.log(`DB에만 (가격 없음): ${dbOnly.length}개`);
    console.log(`CSV에만 (DB 없음): ${csvOnly.length}개`);

    // 가격 업데이트
    console.log('\n=== 가격 업데이트 시작 ===');
    let updated = 0;
    let failed = 0;

    for (const m of matched) {
        const prices: any[] = [];

        if (m.csv.개인단) {
            prices.push({
                item: '개인단',
                price: `${m.csv.개인단}만원`,
                detail: '1위 기준'
            });
        }

        if (m.csv.부부단) {
            prices.push({
                item: '부부단',
                price: `${m.csv.부부단}만원`,
                detail: '2위 기준'
            });
        }

        if (prices.length > 0) {
            const { error: updateError } = await supabase
                .from('memorial_spaces')
                .update({ prices })
                .eq('id', m.db.id);

            if (updateError) {
                console.error(`실패: ${m.db.name} - ${updateError.message}`);
                failed++;
            } else {
                updated++;
            }
        }
    }

    console.log(`\n업데이트 완료: ${updated}개`);
    console.log(`업데이트 실패: ${failed}개`);

    // 미매칭 리스트 생성
    let report = `# 비장례시설 가격 업데이트 결과\n\n`;
    report += `생성일: ${new Date().toLocaleString('ko-KR')}\n\n`;
    report += `## 요약\n\n`;
    report += `| 항목 | 수량 |\n`;
    report += `|------|------|\n`;
    report += `| ✅ 매칭 & 업데이트 | ${updated}개 |\n`;
    report += `| ❌ DB에만 있음 (가격 없음) | ${dbOnly.length}개 |\n`;
    report += `| ⚠️ CSV에만 있음 (DB 없음) | ${csvOnly.length}개 |\n\n`;

    report += `---\n\n`;
    report += `## 1. 가격 업데이트된 시설 (${updated}개)\n\n`;
    report += `| # | 시설명 | 유형 | 개인단 | 부부단 |\n`;
    report += `|---|--------|------|--------|--------|\n`;
    matched.slice(0, 50).forEach((m, i) => {
        const 개인 = m.csv.개인단 ? `${m.csv.개인단}만원` : '-';
        const 부부 = m.csv.부부단 ? `${m.csv.부부단}만원` : '-';
        report += `| ${i + 1} | ${m.db.name} | ${m.db.type} | ${개인} | ${부부} |\n`;
    });
    if (matched.length > 50) report += `\n... 외 ${matched.length - 50}개\n`;

    report += `\n---\n\n`;
    report += `## 2. 가격 데이터 없는 시설 - DB에만 있음 (${dbOnly.length}개)\n\n`;
    report += `| # | 시설명 | 유형 | 주소 |\n`;
    report += `|---|--------|------|------|\n`;
    dbOnly.forEach((f, i) => {
        const addr = (f.address || '').substring(0, 35);
        report += `| ${i + 1} | ${f.name} | ${f.type} | ${addr} |\n`;
    });

    report += `\n---\n\n`;
    report += `## 3. DB에 없는 시설 - CSV에만 있음 (${csvOnly.length}개)\n\n`;
    report += `| # | 시설명 | 유형 | 개인단 | 부부단 |\n`;
    report += `|---|--------|------|--------|--------|\n`;
    csvOnly.forEach((c, i) => {
        const 개인 = c.개인단 ? `${c.개인단}만원` : '-';
        const 부부 = c.부부단 ? `${c.부부단}만원` : '-';
        report += `| ${i + 1} | ${c.name} | ${c.type} | ${개인} | ${부부} |\n`;
    });

    // 리포트 저장
    const reportPath = path.resolve(process.cwd(), 'scripts', '비장례시설_가격업데이트_결과.md');
    fs.writeFileSync(reportPath, report, 'utf-8');

    console.log(`\n✅ 리포트 저장: ${reportPath}`);
}

updatePrices();
