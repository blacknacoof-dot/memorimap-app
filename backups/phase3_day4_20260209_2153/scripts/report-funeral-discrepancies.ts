
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

// CSV 파싱 함수 (따옴표 처리)
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

// 주소 정규화 함수 (비교용)
function normalizeAddress(addr: string): string {
    if (!addr) return '';
    return addr
        .replace(/\s+/g, '')
        .replace(/부산광역시/g, '부산')
        .replace(/서울특별시/g, '서울')
        .replace(/대구광역시/g, '대구')
        .replace(/인천광역시/g, '인천')
        .replace(/광주광역시/g, '광주')
        .replace(/대전광역시/g, '대전')
        .replace(/울산광역시/g, '울산')
        .replace(/세종특별자치시/g, '세종')
        .replace(/경기도/g, '경기')
        .replace(/강원특별자치도|강원도/g, '강원')
        .replace(/충청북도/g, '충북')
        .replace(/충청남도/g, '충남')
        .replace(/전북특별자치도|전라북도/g, '전북')
        .replace(/전라남도/g, '전남')
        .replace(/경상북도/g, '경북')
        .replace(/경상남도/g, '경남')
        .replace(/제주특별자치도|제주도/g, '제주')
        .replace(/\(.*\)/g, '') // 괄호 안의 내용(법정동 등) 제거
        .replace(/장례식장/g, '') // 주소 필드에 포함된 '장례식장' 단어 제거
        .split(',')[0].trim(); // 첫 번째 쉼표까지만 사용
}

// 이름 정규화 함수 (더 가혹하게)
function normalizeName(name: string): string {
    return name
        .replace(/\s+/g, '')
        .replace(/\(주\)|\(유\)|주식회사|유한회사/g, '')
        .replace(/학교법인|사회복지법인|의료법인/g, '')
        .replace(/한림대학교|인제대학교|계명대학교|순천향대학교|가톨릭대학교|고려대학교|한양대학교|연세대학교|건양대학교|원광대학교|대구대학교|경상대학교|경북대학교|부산대학교|충남대학교|충북대학교|전남대학교|전북대학교|강원대학교|제주대학교/g, '')
        .replace(/대학교|부속|의료원|문화원|장례문화원|장례예식장|장례식장|장례원|예지원|국화원/g, '')
        .toLowerCase();
}

async function generateReport() {
    console.log("📊 Starting Funeral Facility Discrepancy Report...\n");

    // 1. DB에서 모든 장례식장 데이터 가져오기 (Pagination 처리)
    let dbFacilities: any[] = [];
    let from = 0;
    const step = 1000;
    let hasMore = true;

    while (hasMore) {
        const { data, error } = await supabase
            .from('memorial_spaces')
            .select('id, name, address, phone, type')
            .eq('type', 'funeral')
            .range(from, from + step - 1);

        if (error) {
            console.error("❌ DB Error during fetch:", error);
            break;
        }

        if (data) {
            dbFacilities = [...dbFacilities, ...data];
            if (data.length < step) {
                hasMore = false;
            } else {
                from += step;
            }
        } else {
            hasMore = false;
        }
    }

    console.log(`📦 DB에서 ${dbFacilities.length}개 장례식장 로드 완료`);

    // 2. CSV 파일들 읽기
    const csvDir = path.resolve(process.cwd(), '장례식장');
    const csvFiles = fs.readdirSync(csvDir).filter(f => f.endsWith('.csv'));

    console.log(`📁 ${csvFiles.length}개 CSV 파일 발견\n`);

    const csvFacilities: Array<{
        name: string;
        address: string;
        phone: string;
        type: string;
        source: string;
    }> = [];

    // CSV 파일들 파싱
    for (const file of csvFiles) {
        const filePath = path.join(csvDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n').filter(l => l.trim());

        if (lines.length < 2) continue;

        // 헤더 확인하여 CSV 형식 감지
        const header = lines[0].toLowerCase();
        const isNewFormat = header.includes('fac_tit') && header.includes('fac_addr');

        for (let i = 1; i < lines.length; i++) {
            const cols = parseCSVLine(lines[i]);
            if (cols.length < 4) continue;

            let name, address, phone, facType;

            if (isNewFormat) {
                // 새 형식: fac_thumb src,fac_tit,fac_addr,fac_tel href,fac_tel,...
                name = cols[1]?.replace(/"/g, '').trim();
                address = cols[2]?.replace(/"/g, '').trim();
                phone = cols[4]?.replace(/"/g, '').trim();
                facType = '공설'; // 새 형식은 대부분 공설
            } else {
                // 기존 형식: 시설구분,시설명,소재지,전화번호,...
                facType = cols[0]?.replace(/"/g, '').trim();
                name = cols[1]?.replace(/"/g, '').trim();
                address = cols[2]?.replace(/"/g, '').trim();
                phone = cols[3]?.replace(/"/g, '').trim();
            }

            if (name && address) {
                csvFacilities.push({
                    name,
                    address,
                    phone: phone || '',
                    type: facType || '사설',
                    source: file
                });
            }
        }
    }

    console.log(`📋 CSV에서 총 ${csvFacilities.length}개 시설 파싱 완료\n`);

    // 3. 비교 분석
    const matched: Array<{ db: any, csv: any }> = [];
    const onlyInDB: any[] = [];
    const onlyInCSV: any[] = [];

    const dbItems = dbFacilities.map(f => ({ ...f, normName: normalizeName(f.name), normAddr: normalizeAddress(f.address) }));
    const csvItems = csvFacilities.map(f => ({ ...f, normName: normalizeName(f.name), normAddr: normalizeAddress(f.address) }));

    const csvProcessed = new Set<number>();

    for (const dbInfo of dbItems) {
        // 1순위: 이름이 거의 일치하는 경우
        let foundIdx = csvItems.findIndex((c, idx) => !csvProcessed.has(idx) && c.normName === dbInfo.normName);

        // 2순위: 주소가 정확히 일치하거나 매우 유사한 경우 (이름이 부분 일치할 때)
        if (foundIdx === -1) {
            foundIdx = csvItems.findIndex((c, idx) => {
                if (csvProcessed.has(idx)) return false;
                const addrMatch = c.normAddr === dbInfo.normAddr && dbInfo.normAddr.length > 5;
                const nameSimilar = c.normName.includes(dbInfo.normName) || dbInfo.normName.includes(c.normName);
                return addrMatch || (nameSimilar && c.normAddr.startsWith(dbInfo.normAddr.substring(0, 10)));
            });
        }

        if (foundIdx !== -1) {
            matched.push({ db: dbInfo, csv: csvItems[foundIdx] });
            csvProcessed.add(foundIdx);
        } else {
            onlyInDB.push(dbInfo);
        }
    }

    // CSV에만 있는 것
    csvItems.forEach((c, idx) => {
        if (!csvProcessed.has(idx)) {
            onlyInCSV.push(c);
        }
    });

    // 4. 보고서 생성
    let report = `# 장례식장 데이터 불일치 보고서\n\n`;
    report += `**생성일시**: ${new Date().toLocaleString('ko-KR')}\n\n`;
    report += `## 📊 요약\n\n`;
    report += `| 구분 | 개수 |\n`;
    report += `|------|------|\n`;
    report += `| DB 총 시설 수 | ${dbFacilities.length} |\n`;
    report += `| CSV 총 시설 수 | ${csvFacilities.length} |\n`;
    report += `| 일치하는 시설 | ${matched.length} |\n`;
    report += `| DB에만 존재 | ${onlyInDB.length} |\n`;
    report += `| CSV에만 존재 (신규 추가 필요) | ${onlyInCSV.length} |\n\n`;

    // DB에만 있는 시설 (폐업 의심)
    if (onlyInDB.length > 0) {
        report += `## ⚠️ DB에만 존재하는 시설 (${onlyInDB.length}개)\n\n`;
        report += `> e하늘 공식 데이터에 없는 시설입니다. 폐업했거나 네이버 전용 데이터일 수 있습니다.\n\n`;
        report += `| 시설명 | 주소 | 전화번호 |\n`;
        report += `|--------|------|----------|\n`;
        onlyInDB.forEach(f => {
            report += `| ${f.name} | ${f.address || '-'} | ${f.phone || '-'} |\n`;
        });
        report += `\n`;
    }

    // CSV에만 있는 시설 (신규)
    if (onlyInCSV.length > 0) {
        report += `## ✨ CSV에만 존재하는 시설 (${onlyInCSV.length}개)\n\n`;
        report += `> e하늘 공식 데이터에는 있지만 DB에 없는 신규 시설입니다.\n\n`;
        report += `| 시설명 | 주소 | 전화번호 | 출처 파일 |\n`;
        report += `|--------|------|----------|----------|\n`;
        onlyInCSV.forEach(f => {
            report += `| ${f.name} | ${f.address} | ${f.phone} | ${f.source} |\n`;
        });
        report += `\n`;
    }

    // 일치하는 시설 중 정보 차이가 있는 경우
    const infoMismatches = matched.filter(m => {
        const phoneMatch = m.db.phone === m.csv.phone || !m.csv.phone;
        const addressSimilar = m.db.address?.includes(m.csv.address.split(' ')[0]) ||
            m.csv.address?.includes(m.db.address?.split(' ')[0]);
        return !phoneMatch || !addressSimilar;
    });

    if (infoMismatches.length > 0) {
        report += `## 🔄 정보 불일치 시설 (${infoMismatches.length}개)\n\n`;
        report += `> 시설명은 일치하지만 전화번호나 주소가 다른 경우입니다.\n\n`;
        report += `| 시설명 | DB 전화 | CSV 전화 | DB 주소 | CSV 주소 |\n`;
        report += `|--------|---------|----------|---------|----------|\n`;
        infoMismatches.forEach(m => {
            report += `| ${m.db.name} | ${m.db.phone || '-'} | ${m.csv.phone || '-'} | ${m.db.address || '-'} | ${m.csv.address || '-'} |\n`;
        });
        report += `\n`;
    }

    // 파일로 저장
    const reportPath = path.resolve(process.cwd(), 'funeral_discrepancy_report.md');
    fs.writeFileSync(reportPath, report, 'utf-8');

    console.log(`\n✅ 보고서 생성 완료: ${reportPath}`);
    console.log(`\n📈 결과:`);
    console.log(`   - 일치: ${matched.length}개`);
    console.log(`   - DB 전용: ${onlyInDB.length}개`);
    console.log(`   - CSV 전용 (신규): ${onlyInCSV.length}개`);
    console.log(`   - 정보 불일치: ${infoMismatches.length}개`);
}

generateReport();
