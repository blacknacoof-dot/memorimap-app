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

// 주소 정규화 함수
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
        .replace(/\(.*\)/g, '')
        .replace(/장례식장/g, '')
        .split(',')[0].trim();
}

function normalizeName(name: string): string {
    return name
        .replace(/\s+/g, '')
        .replace(/\(주\)|\(유\)|주식회사|유한회사/g, '')
        .replace(/학교법인|사회복지법인|의료법인/g, '')
        .replace(/한림대학교|인제대학교|계명대학교|순천향대학교|가톨릭대학교|고려대학교|한양대학교|연세대학교|건양대학교|원광대학교|대구대학교|경상대학교|경북대학교|부산대학교|충남대학교|충북대학교|전남대학교|전북대학교|강원대학교|제주대학교/g, '')
        .replace(/대학교|부속|의료원|문화원|장례문화원|장례예식장|장례식장|장례원|예지원|국화원/g, '')
        .toLowerCase();
}

async function verifyCandidates() {
    console.log("🔍 Verifying Candidate List Against Database...\n");

    // 1. DB 데이터 로드
    let dbFacilities: any[] = [];
    let from = 0;
    const step = 1000;
    let hasMore = true;

    while (hasMore) {
        const { data, error } = await supabase
            .from('memorial_spaces')
            .select('name, address, type')
            .eq('type', 'funeral')
            .range(from, from + step - 1);

        if (error) break;
        if (data) {
            dbFacilities = [...dbFacilities, ...data];
            if (data.length < step) hasMore = false;
            else from += step;
        } else hasMore = false;
    }

    console.log(`📦 Loaded ${dbFacilities.length} facilities from DB`);

    const dbItems = dbFacilities.map(f => ({
        ...f,
        normName: normalizeName(f.name),
        normAddr: normalizeAddress(f.address)
    }));

    // 2. 후보 CSV 로드
    const candidateFile = path.resolve(process.cwd(), '신규_장례식장_등록후보_186.csv');
    const content = fs.readFileSync(candidateFile, 'utf-8');
    const lines = content.split('\n').filter(l => l.trim());

    const alreadyExists: any[] = [];
    const trulyNew: any[] = [];

    for (let i = 1; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i]);
        if (cols.length < 3) continue;

        const name = cols[0]?.replace(/"/g, '').trim();
        const address = cols[1]?.replace(/"/g, '').trim();
        const phone = cols[2]?.replace(/"/g, '').trim();

        if (!name || !address) continue;

        const normName = normalizeName(name);
        const normAddr = normalizeAddress(address);

        // DB에서 매칭 시도
        const match = dbItems.find(db => {
            // 1순위: 이름 일치
            if (db.normName === normName) return true;

            // 2순위: 주소 완전 일치
            if (db.normAddr === normAddr && normAddr.length > 10) return true;

            // 3순위: 이름 유사 + 주소 부분 일치
            const nameSimilar = db.normName.includes(normName) || normName.includes(db.normName);
            const addrSimilar = db.normAddr.startsWith(normAddr.substring(0, 15)) ||
                normAddr.startsWith(db.normAddr.substring(0, 15));

            return nameSimilar && addrSimilar && normAddr.length > 10;
        });

        if (match) {
            alreadyExists.push({
                candidateName: name,
                candidateAddr: address,
                dbName: match.name,
                dbAddr: match.address,
                matchType: match.normName === normName ? '이름 일치' :
                    match.normAddr === normAddr ? '주소 일치' : '유사 매칭'
            });
        } else {
            trulyNew.push({ name, address, phone });
        }
    }

    // 3. 보고서 생성
    console.log(`\n📊 검증 결과:`);
    console.log(`   - 이미 DB에 존재: ${alreadyExists.length}개`);
    console.log(`   - 진짜 신규: ${trulyNew.length}개\n`);

    let report = `# 신규 후보 검증 보고서\n\n`;
    report += `**생성일시**: ${new Date().toLocaleString('ko-KR')}\n\n`;
    report += `## 📊 요약\n\n`;
    report += `| 구분 | 개수 |\n`;
    report += `|------|------|\n`;
    report += `| 후보 총 개수 | ${lines.length - 1} |\n`;
    report += `| 이미 DB에 존재 | ${alreadyExists.length} |\n`;
    report += `| 진짜 신규 | ${trulyNew.length} |\n\n`;

    if (alreadyExists.length > 0) {
        report += `## ⚠️ 이미 DB에 존재하는 시설 (${alreadyExists.length}개)\n\n`;
        report += `| 후보 시설명 | 후보 주소 | DB 시설명 | DB 주소 | 매칭 유형 |\n`;
        report += `|------------|----------|-----------|---------|----------|\n`;
        alreadyExists.forEach(item => {
            report += `| ${item.candidateName} | ${item.candidateAddr} | ${item.dbName} | ${item.dbAddr} | ${item.matchType} |\n`;
        });
        report += `\n`;
    }

    if (trulyNew.length > 0) {
        report += `## ✨ 진짜 신규 시설 (${trulyNew.length}개)\n\n`;
        report += `| 시설명 | 주소 | 전화번호 |\n`;
        report += `|--------|------|----------|\n`;
        trulyNew.forEach(item => {
            report += `| ${item.name} | ${item.address} | ${item.phone} |\n`;
        });
        report += `\n`;
    }

    const reportPath = path.resolve(process.cwd(), 'candidate_verification_report.md');
    fs.writeFileSync(reportPath, report, 'utf-8');

    console.log(`✅ 보고서 생성 완료: ${reportPath}`);
}

verifyCandidates();
