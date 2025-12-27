import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import XLSX from 'xlsx';

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

// XLSX 파일 읽기
const xlsxPath = path.resolve(process.cwd(), 'data', '2023년 6월', '1.장사시설 현황_20230601.xlsx');
const workbook = XLSX.readFile(xlsxPath);

console.log('=== XLSX 파일 분석 ===');
console.log('시트 목록:', workbook.SheetNames);

// 첫 번째 시트 분석
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

console.log(`\n시트: ${sheetName}`);
console.log(`총 행 수: ${data.length}`);
console.log('\n헤더 (첫 번째 행):');
console.log(data[0]);

console.log('\n샘플 데이터 (2-10행):');
data.slice(1, 10).forEach((row, i) => {
    console.log(`${i + 2}. ${JSON.stringify(row).substring(0, 150)}`);
});

// 시설명 컬럼 찾기 (보통 "시설명", "업체명", "장례식장명" 등)
const header = data[0] as string[];
let nameColIndex = -1;
let addressColIndex = -1;
let typeColIndex = -1;

header.forEach((col, i) => {
    const colStr = String(col || '').toLowerCase();
    if (colStr.includes('시설명') || colStr.includes('업체명') || colStr.includes('장례식장명')) {
        nameColIndex = i;
    }
    if (colStr.includes('주소') || colStr.includes('소재지')) {
        addressColIndex = i;
    }
    if (colStr.includes('시설구분') || colStr.includes('종류') || colStr.includes('유형')) {
        typeColIndex = i;
    }
});

console.log(`\n컬럼 인덱스 - 시설명: ${nameColIndex}, 주소: ${addressColIndex}, 유형: ${typeColIndex}`);

// 시설 목록 추출 (장례식장만)
interface FacilityFromXlsx {
    name: string;
    address: string;
    type: string;
    row: number;
}

const xlsxFacilities: FacilityFromXlsx[] = [];

for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;

    const name = String(row[nameColIndex] || '').trim();
    const address = addressColIndex >= 0 ? String(row[addressColIndex] || '').trim() : '';
    const type = typeColIndex >= 0 ? String(row[typeColIndex] || '').trim() : '';

    if (name) {
        xlsxFacilities.push({ name, address, type, row: i + 1 });
    }
}

console.log(`\n추출된 시설 수: ${xlsxFacilities.length}개`);

// 유형별 분류
const typeStats = new Map<string, number>();
xlsxFacilities.forEach(f => {
    typeStats.set(f.type, (typeStats.get(f.type) || 0) + 1);
});

console.log('\n시설 유형별 분포:');
typeStats.forEach((count, type) => {
    console.log(`  ${type || '(없음)'}: ${count}개`);
});

// DB 데이터와 매칭
async function matchWithDB() {
    const { data: dbData, error } = await supabase
        .from('memorial_spaces')
        .select('id, name, address, type')
        .eq('type', 'funeral');

    if (error) {
        console.error('DB Error:', error);
        return;
    }

    console.log(`\nDB 장례식장 수: ${dbData?.length || 0}개`);

    // 이름 정규화 함수
    const normalizeName = (name: string) => {
        return name
            .replace(/\s+/g, '')
            .replace(/[()（）\[\]【】]/g, '')
            .replace(/장례식장/g, '')
            .replace(/장례문화원/g, '')
            .replace(/장례원/g, '')
            .toLowerCase();
    };

    // XLSX 이름 맵 생성
    const xlsxNormalizedMap = new Map<string, FacilityFromXlsx>();
    xlsxFacilities.forEach(f => {
        xlsxNormalizedMap.set(normalizeName(f.name), f);
    });

    const matched: { db: any; xlsx: FacilityFromXlsx }[] = [];
    const dbOnly: any[] = [];
    const usedXlsxNames = new Set<string>();

    // DB와 XLSX 매칭
    for (const dbFac of dbData || []) {
        const normDbName = normalizeName(dbFac.name);

        if (xlsxNormalizedMap.has(normDbName)) {
            const xlsxFac = xlsxNormalizedMap.get(normDbName)!;
            matched.push({ db: dbFac, xlsx: xlsxFac });
            usedXlsxNames.add(normDbName);
        } else {
            // 부분 일치 시도
            let found = false;
            for (const [normXlsx, xlsxFac] of xlsxNormalizedMap.entries()) {
                if (usedXlsxNames.has(normXlsx)) continue;
                if (normDbName.includes(normXlsx) || normXlsx.includes(normDbName)) {
                    matched.push({ db: dbFac, xlsx: xlsxFac });
                    usedXlsxNames.add(normXlsx);
                    found = true;
                    break;
                }
            }
            if (!found) {
                dbOnly.push(dbFac);
            }
        }
    }

    // XLSX에만 있는 시설
    const xlsxOnly: FacilityFromXlsx[] = [];
    xlsxFacilities.forEach(f => {
        const norm = normalizeName(f.name);
        if (!usedXlsxNames.has(norm)) {
            xlsxOnly.push(f);
        }
    });

    // 리포트 생성
    let report = `# 장사시설 현황 크로스체크 리포트\n\n`;
    report += `생성일: ${new Date().toLocaleString('ko-KR')}\n\n`;
    report += `## 요약\n\n`;
    report += `| 항목 | 수량 |\n`;
    report += `|------|------|\n`;
    report += `| XLSX 시설 | ${xlsxFacilities.length}개 |\n`;
    report += `| DB 장례식장 | ${dbData?.length || 0}개 |\n`;
    report += `| ✅ 매칭됨 | ${matched.length}개 |\n`;
    report += `| ❌ DB에만 있음 | ${dbOnly.length}개 |\n`;
    report += `| ⚠️ XLSX에만 있음 | ${xlsxOnly.length}개 |\n\n`;

    report += `---\n\n`;
    report += `## 1. 매칭된 업체 (${matched.length}개)\n\n`;
    report += `| # | DB 업체명 | XLSX 업체명 | XLSX 주소 |\n`;
    report += `|---|-----------|-------------|----------|\n`;
    matched.slice(0, 50).forEach((m, i) => {
        const addr = m.xlsx.address.substring(0, 30);
        report += `| ${i + 1} | ${m.db.name} | ${m.xlsx.name} | ${addr} |\n`;
    });
    if (matched.length > 50) report += `\n... 외 ${matched.length - 50}개\n`;

    report += `\n---\n\n`;
    report += `## 2. DB에만 있는 업체 (${dbOnly.length}개)\n\n`;
    report += `XLSX 시설 현황에 없는 업체 (신규 등록 또는 명칭 불일치)\n\n`;
    report += `| # | 업체명 | 주소 |\n`;
    report += `|---|--------|------|\n`;
    dbOnly.slice(0, 50).forEach((f, i) => {
        const addr = (f.address || '').substring(0, 40);
        report += `| ${i + 1} | ${f.name} | ${addr} |\n`;
    });
    if (dbOnly.length > 50) report += `\n... 외 ${dbOnly.length - 50}개\n`;

    report += `\n---\n\n`;
    report += `## 3. XLSX에만 있는 업체 (${xlsxOnly.length}개)\n\n`;
    report += `DB에 추가 필요할 수 있는 업체\n\n`;
    report += `| # | 업체명 | 유형 | 주소 |\n`;
    report += `|---|--------|------|------|\n`;
    xlsxOnly.slice(0, 50).forEach((f, i) => {
        const addr = f.address.substring(0, 35);
        report += `| ${i + 1} | ${f.name} | ${f.type} | ${addr} |\n`;
    });
    if (xlsxOnly.length > 50) report += `\n... 외 ${xlsxOnly.length - 50}개\n`;

    // 리포트 저장
    const reportPath = path.resolve(process.cwd(), 'scripts', '장사시설현황_크로스체크.md');
    fs.writeFileSync(reportPath, report, 'utf-8');

    console.log('\n=== 크로스체크 결과 ===');
    console.log(`매칭: ${matched.length}개`);
    console.log(`DB에만: ${dbOnly.length}개`);
    console.log(`XLSX에만: ${xlsxOnly.length}개`);
    console.log(`\n✅ 리포트 저장: ${reportPath}`);
}

matchWithDB();
