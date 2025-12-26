import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

// Load Env
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
);

// CSV 파싱 함수
function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
}

// 정규화 함수
function normalizeName(name: string): string {
    return name
        .replace(/\s+/g, '')
        .replace(/[()]/g, '')
        .replace(/재단법인|주식회사|유한회사|\(재\)|\(주\)|\(유\)/g, '')
        .toLowerCase();
}

function normalizeAddress(addr: string): string {
    return addr
        .replace(/\s+/g, '')
        .replace(/[()]/g, '')
        .toLowerCase();
}

async function compareCemeteryData() {
    console.log("🪦 묘지 데이터 비교 시작...\n");

    // 1. CSV 파일 읽기
    const csvPath = path.resolve(process.cwd(), '납골당보안시설자료', '15774129-2025-12-22묘지.csv');

    if (!fs.existsSync(csvPath)) {
        console.error('❌ CSV 파일을 찾을 수 없습니다.');
        return;
    }

    const content = fs.readFileSync(csvPath, 'utf-8');
    const lines = content.split('\n').filter(l => l.trim());

    console.log(`📋 CSV 파일: ${lines.length - 1}개 항목 발견\n`);

    // 2. DB에서 모든 시설 데이터 조회 (type 필터 없이)
    const { data: dbFacilities, error } = await supabase
        .from('memorial_spaces')
        .select('id, name, address, type, data_source');

    if (error) {
        console.error('❌ DB 조회 실패:', error);
        return;
    }

    console.log(`💾 DB: ${dbFacilities?.length || 0}개 전체 시설\n`);

    // 3. CSV 파싱
    const header = lines[0].toLowerCase();

    let csvItems: Array<{
        name: string;
        address: string;
        phone: string;
        normName: string;
        normAddr: string
    }> = [];

    for (let i = 1; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i]);
        if (cols.length < 4) continue;

        // fac_tit (시설명)은 3번째 컬럼, fac_addr (주소)는 4번째 컬럼
        const name = cols[2]?.replace(/"/g, '').trim();
        const addr = cols[3]?.replace(/"/g, '').trim();
        const phone = cols[5]?.replace(/"/g, '').trim();

        if (name && addr) {
            csvItems.push({
                name,
                address: addr,
                phone: phone || '',
                normName: normalizeName(name),
                normAddr: normalizeAddress(addr)
            });
        }
    }

    console.log(`✅ CSV 파싱 완료: ${csvItems.length}개 항목\n`);

    // 4. 매칭 확인
    let exactMatchCount = 0;
    let similarMatchCount = 0;
    let unmatchedCount = 0;

    const exactMatches: any[] = [];
    const similarMatches: any[] = [];
    const unmatchedItems: any[] = [];

    for (const csvItem of csvItems) {
        let exactMatch = null;
        let similarMatch = null;

        for (const db of dbFacilities || []) {
            const dbNormName = normalizeName(db.name);
            const dbNormAddr = normalizeAddress(db.address || '');

            // 정확한 이름 매칭
            if (dbNormName === csvItem.normName) {
                exactMatch = db;
                break;
            }

            // 유사 매칭 (이름이 포함되거나 주소가 유사)
            if (dbNormName.includes(csvItem.normName) || csvItem.normName.includes(dbNormName)) {
                if (!similarMatch) {
                    similarMatch = db;
                }
            }
        }

        if (exactMatch) {
            exactMatchCount++;
            exactMatches.push({
                csvName: csvItem.name,
                dbName: exactMatch.name,
                dbId: exactMatch.id,
                dbType: exactMatch.type,
                dataSource: exactMatch.data_source
            });
        } else if (similarMatch) {
            similarMatchCount++;
            similarMatches.push({
                csvName: csvItem.name,
                csvAddr: csvItem.address,
                dbName: similarMatch.name,
                dbId: similarMatch.id,
                dbType: similarMatch.type
            });
        } else {
            unmatchedCount++;
            unmatchedItems.push(csvItem);
        }
    }

    // 5. 결과 출력
    console.log(`\n📊 매칭 결과:`);
    console.log(`   ✅ 정확히 일치: ${exactMatchCount}개`);
    console.log(`   🔍 유사 일치: ${similarMatchCount}개`);
    console.log(`   ❌ DB에 없음: ${unmatchedCount}개`);
    console.log(`   📈 일치율: ${((exactMatchCount / csvItems.length) * 100).toFixed(1)}%\n`);

    // 6. 상세 보고서 생성
    let report = `# 묘지 데이터 비교 보고서\n\n`;
    report += `**생성일시**: ${new Date().toLocaleString('ko-KR')}\n\n`;
    report += `## 📊 요약\n\n`;
    report += `| 구분 | 개수 |\n`;
    report += `|------|------|\n`;
    report += `| CSV 전체 | ${csvItems.length} |\n`;
    report += `| DB 전체 시설 | ${dbFacilities?.length || 0} |\n`;
    report += `| 정확히 일치 | ${exactMatchCount} |\n`;
    report += `| 유사 일치 | ${similarMatchCount} |\n`;
    report += `| DB에 없음 (신규) | ${unmatchedCount} |\n`;
    report += `| 일치율 | ${((exactMatchCount / csvItems.length) * 100).toFixed(1)}% |\n\n`;

    if (exactMatches.length > 0) {
        report += `## ✅ 정확히 일치하는 시설 (${exactMatchCount}개)\n\n`;
        report += `| CSV 시설명 | DB 시설명 | DB ID | Type | Data Source |\n`;
        report += `|-----------|----------|-------|------|-------------|\n`;
        exactMatches.slice(0, 20).forEach(m => {
            report += `| ${m.csvName} | ${m.dbName} | ${m.dbId} | ${m.dbType} | ${m.dataSource} |\n`;
        });
        if (exactMatches.length > 20) {
            report += `\n... 외 ${exactMatches.length - 20}개\n`;
        }
        report += `\n`;
    }

    if (similarMatches.length > 0) {
        report += `## 🔍 유사 일치하는 시설 (${similarMatchCount}개)\n\n`;
        report += `| CSV 시설명 | CSV 주소 | DB 시설명 | DB ID |\n`;
        report += `|-----------|---------|----------|-------|\n`;
        similarMatches.slice(0, 20).forEach(m => {
            report += `| ${m.csvName} | ${m.csvAddr} | ${m.dbName} | ${m.dbId} |\n`;
        });
        if (similarMatches.length > 20) {
            report += `\n... 외 ${similarMatches.length - 20}개\n`;
        }
        report += `\n`;
    }

    if (unmatchedItems.length > 0) {
        report += `## ❌ DB에 없는 신규 시설 (${unmatchedCount}개)\n\n`;
        report += `이 시설들은 DB에 추가가 필요합니다.\n\n`;
        report += `| 시설명 | 주소 | 전화번호 |\n`;
        report += `|--------|------|----------|\n`;
        unmatchedItems.slice(0, 30).forEach(item => {
            report += `| ${item.name} | ${item.address} | ${item.phone} |\n`;
        });
        if (unmatchedItems.length > 30) {
            report += `\n... 외 ${unmatchedItems.length - 30}개\n`;
        }
        report += `\n`;
    }

    const reportPath = path.resolve(process.cwd(), 'cemetery_comparison_report.md');
    fs.writeFileSync(reportPath, report, 'utf-8');
    console.log(`📄 상세 보고서 생성: ${reportPath}`);

    // 7. 신규 시설 CSV 저장
    if (unmatchedItems.length > 0) {
        let csvContent = "시설명,주소,전화번호\n";
        unmatchedItems.forEach(item => {
            csvContent += `"${item.name}","${item.address}","${item.phone}"\n`;
        });

        const newFacilitiesPath = path.resolve(process.cwd(), 'cemetery_new_facilities.csv');
        fs.writeFileSync(newFacilitiesPath, csvContent, 'utf-8');
        console.log(`📄 신규 시설 목록 저장: ${newFacilitiesPath}`);
    }

    console.log(`\n🎉 비교 완료!`);
}

compareCemeteryData();
