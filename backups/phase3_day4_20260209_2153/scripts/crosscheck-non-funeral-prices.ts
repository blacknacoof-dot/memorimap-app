import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import iconv from 'iconv-lite';

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

// CSV 파일 읽기 (EUC-KR 인코딩)
const csvPath = path.resolve(process.cwd(), 'data', '2023년 6월', '3.장사시설(장례식장제외)가격정보_20230601.csv');
const buffer = fs.readFileSync(csvPath);
const content = iconv.decode(buffer, 'euc-kr');

const lines = content.split('\n').filter(line => line.trim());
console.log('=== CSV 파일 분석 ===');
console.log(`총 라인 수: ${lines.length}\n`);

console.log('헤더:');
console.log(lines[0]);

console.log('\n샘플 데이터 (처음 15줄):');
lines.slice(1, 16).forEach((line, i) => {
    console.log(`${i + 2}. ${line.substring(0, 200)}`);
});

// 헤더 파싱
const header = lines[0].split(',').map(h => h.trim());
console.log('\n헤더 컬럼:', header);

// 시설명 컬럼 인덱스 찾기
let facilityNameIdx = header.findIndex(h => h.includes('시설명') || h.includes('장례식장명'));
let addressIdx = header.findIndex(h => h.includes('주소') || h.includes('소재지'));
let categoryIdx = header.findIndex(h => h.includes('시설종류') || h.includes('구분'));
let itemIdx = header.findIndex(h => h.includes('항목') || h.includes('품목'));
let priceIdx = header.findIndex(h => h.includes('금액') || h.includes('가격'));
let detailIdx = header.findIndex(h => h.includes('세부') || h.includes('비고'));

console.log(`\n컬럼 인덱스:`);
console.log(`  시설명: ${facilityNameIdx}, 주소: ${addressIdx}`);
console.log(`  시설종류: ${categoryIdx}, 항목: ${itemIdx}`);
console.log(`  금액: ${priceIdx}, 세부: ${detailIdx}`);

// 시설 유형별 집계
const facilityTypes = new Map<string, number>();
const facilities = new Map<string, { name: string; type: string; prices: { item: string; detail: string; price: number }[] }>();

for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    if (cols.length < 5) continue;

    // 인덱스 조정 (실제 데이터 구조에 맞게)
    const type = cols[0]?.trim();
    const name = cols[2]?.trim();
    const item = cols[3]?.trim();
    const subItem = cols[4]?.trim();
    const detail = cols[5]?.trim();
    const unit = cols[6]?.trim();
    const priceStr = cols[7]?.trim().replace(/\r/g, '');

    if (!name) continue;

    facilityTypes.set(type, (facilityTypes.get(type) || 0) + 1);

    const priceWon = parseInt(priceStr?.replace(/,/g, '') || '0');
    const priceManwon = priceWon > 0 ? Math.round(priceWon / 10000 * 10) / 10 : 0;

    const key = `${type}|${name}`;
    if (!facilities.has(key)) {
        facilities.set(key, { name, type, prices: [] });
    }

    if (priceWon > 0) {
        facilities.get(key)!.prices.push({
            item: `${item}${subItem ? '-' + subItem : ''}`,
            detail: detail || unit || '',
            price: priceManwon
        });
    }
}

console.log('\n=== 시설 유형별 분포 ===');
facilityTypes.forEach((count, type) => {
    console.log(`${type}: ${count}건`);
});

console.log(`\n시설 수: ${facilities.size}개`);

// DB에서 비장례식장 시설 조회
async function matchAndReport() {
    // memorial_spaces에서 type이 funeral이 아닌 것들 조회
    const { data: dbData, error } = await supabase
        .from('memorial_spaces')
        .select('id, name, address, type, prices')
        .neq('type', 'funeral');

    if (error) {
        console.error('DB Error:', error);
        return;
    }

    console.log(`\nDB 비장례식장 시설 수: ${dbData?.length || 0}개`);

    // 타입별 분류
    const dbTypes = new Map<string, number>();
    dbData?.forEach(f => {
        dbTypes.set(f.type, (dbTypes.get(f.type) || 0) + 1);
    });
    console.log('\nDB 시설 유형별 분포:');
    dbTypes.forEach((count, type) => {
        console.log(`  ${type}: ${count}개`);
    });

    // 이름 정규화 함수
    const normalizeName = (name: string) => {
        return name
            .replace(/\s+/g, '')
            .replace(/[()（）\[\]【】]/g, '')
            .toLowerCase();
    };

    // CSV 시설 정규화 맵
    const csvNormMap = new Map<string, typeof facilities extends Map<any, infer V> ? V : never>();
    facilities.forEach((fac, key) => {
        csvNormMap.set(normalizeName(fac.name), fac);
    });

    const matched: { db: any; csv: any; }[] = [];
    const dbOnly: any[] = [];
    const usedCsvNames = new Set<string>();

    // 매칭
    for (const dbFac of dbData || []) {
        const normName = normalizeName(dbFac.name);

        if (csvNormMap.has(normName)) {
            const csvFac = csvNormMap.get(normName)!;
            matched.push({ db: dbFac, csv: csvFac });
            usedCsvNames.add(normName);
        } else {
            // 부분 일치
            let found = false;
            for (const [normCsv, csvFac] of csvNormMap.entries()) {
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

    // CSV에만 있는 시설
    const csvOnly: any[] = [];
    facilities.forEach((fac, key) => {
        if (!usedCsvNames.has(normalizeName(fac.name))) {
            csvOnly.push(fac);
        }
    });

    // 리포트 생성
    let report = `# 장사시설(장례식장 제외) 가격 크로스체크 리포트\n\n`;
    report += `생성일: ${new Date().toLocaleString('ko-KR')}\n\n`;
    report += `## 요약\n\n`;
    report += `| 항목 | 수량 |\n`;
    report += `|------|------|\n`;
    report += `| CSV 시설 | ${facilities.size}개 |\n`;
    report += `| DB 시설 | ${dbData?.length || 0}개 |\n`;
    report += `| ✅ 매칭됨 | ${matched.length}개 |\n`;
    report += `| ❌ DB에만 있음 | ${dbOnly.length}개 |\n`;
    report += `| ⚠️ CSV에만 있음 | ${csvOnly.length}개 |\n\n`;

    report += `---\n\n`;
    report += `## 1. 매칭된 시설 - 가격 업데이트 대상 (${matched.length}개)\n\n`;
    report += `| # | DB 시설명 | CSV 시설명 | 유형 | 가격 항목수 |\n`;
    report += `|---|-----------|------------|------|------------|\n`;
    matched.slice(0, 50).forEach((m, i) => {
        report += `| ${i + 1} | ${m.db.name} | ${m.csv.name} | ${m.csv.type} | ${m.csv.prices.length}개 |\n`;
    });
    if (matched.length > 50) report += `\n... 외 ${matched.length - 50}개\n`;

    report += `\n---\n\n`;
    report += `## 2. DB에만 있는 시설 - 가격 데이터 없음 (${dbOnly.length}개)\n\n`;
    report += `| # | 시설명 | 유형 | 주소 |\n`;
    report += `|---|--------|------|------|\n`;
    dbOnly.slice(0, 50).forEach((f, i) => {
        const addr = (f.address || '').substring(0, 35);
        report += `| ${i + 1} | ${f.name} | ${f.type} | ${addr} |\n`;
    });
    if (dbOnly.length > 50) report += `\n... 외 ${dbOnly.length - 50}개\n`;

    report += `\n---\n\n`;
    report += `## 3. CSV에만 있는 시설 - DB에 없음 (${csvOnly.length}개)\n\n`;
    report += `| # | 시설명 | 유형 | 가격 항목수 |\n`;
    report += `|---|--------|------|------------|\n`;
    csvOnly.slice(0, 50).forEach((f, i) => {
        report += `| ${i + 1} | ${f.name} | ${f.type} | ${f.prices.length}개 |\n`;
    });
    if (csvOnly.length > 50) report += `\n... 외 ${csvOnly.length - 50}개\n`;

    // 정리된 가격 데이터 CSV 생성
    let priceDataCsv = '시설유형,시설명,항목,세부내용,가격(만원)\n';
    matched.forEach(m => {
        m.csv.prices.forEach((p: any) => {
            priceDataCsv += `"${m.csv.type}","${m.csv.name}","${p.item}","${p.detail}",${p.price}\n`;
        });
    });

    // 파일 저장
    const reportPath = path.resolve(process.cwd(), 'scripts', '비장례시설_가격_크로스체크.md');
    fs.writeFileSync(reportPath, report, 'utf-8');

    const pricePath = path.resolve(process.cwd(), 'data', '비장례시설_가격_정리.csv');
    fs.writeFileSync(pricePath, '\ufeff' + priceDataCsv, 'utf-8');

    console.log('\n=== 크로스체크 결과 ===');
    console.log(`매칭: ${matched.length}개`);
    console.log(`DB에만: ${dbOnly.length}개`);
    console.log(`CSV에만: ${csvOnly.length}개`);
    console.log(`\n✅ 리포트: ${reportPath}`);
    console.log(`✅ 가격 CSV: ${pricePath}`);
}

matchAndReport();
