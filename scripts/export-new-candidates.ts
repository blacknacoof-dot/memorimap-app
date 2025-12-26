
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

async function exportCandidates() {
    console.log("📄 Exporting Refined New Facility Candidates...");

    // 1. DB 데이터 로드
    let dbFacilities: any[] = [];
    let from = 0;
    const step = 1000;
    let hasMore = true;
    while (hasMore) {
        const { data, error } = await supabase.from('memorial_spaces').select('name, address').eq('type', 'funeral').range(from, from + step - 1);
        if (error) break;
        if (data) {
            dbFacilities = [...dbFacilities, ...data];
            if (data.length < step) hasMore = false;
            else from += step;
        } else hasMore = false;
    }
    const dbItems = dbFacilities.map(f => ({ ...f, normName: normalizeName(f.name), normAddr: normalizeAddress(f.address) }));

    // 2. CSV 데이터 로합
    const csvDir = path.resolve(process.cwd(), '장례식장');
    const csvFiles = fs.readdirSync(csvDir).filter(f => f.endsWith('.csv'));
    const csvItems: any[] = [];

    for (const file of csvFiles) {
        const content = fs.readFileSync(path.join(csvDir, file), 'utf-8');
        const lines = content.split('\n').filter(l => l.trim());

        if (lines.length < 2) continue;

        // 헤더 확인하여 CSV 형식 감지
        const header = lines[0].toLowerCase();
        const hasFacTit = header.includes('fac_tit');
        const hasFacType = header.includes('fac_type');

        for (let i = 1; i < lines.length; i++) {
            const cols = parseCSVLine(lines[i]);
            if (cols.length < 4) continue;

            let name, addr, tel;

            if (hasFacTit && hasFacType) {
                // 새 형식 (fac_type 포함): fac_type,fac_thumb src,fac_tit,fac_addr,fac_tel href,fac_tel,...
                name = cols[2]?.replace(/"/g, '').trim();
                addr = cols[3]?.replace(/"/g, '').trim();
                tel = cols[5]?.replace(/"/g, '').trim();
            } else if (hasFacTit) {
                // 새 형식 (fac_type 없음): fac_thumb src,fac_tit,fac_addr,fac_tel href,fac_tel,...
                name = cols[1]?.replace(/"/g, '').trim();
                addr = cols[2]?.replace(/"/g, '').trim();
                tel = cols[4]?.replace(/"/g, '').trim();
            } else {
                // 기존 형식: 시설구분,시설명,소재지,전화번호,...
                name = cols[1]?.replace(/"/g, '').trim();
                addr = cols[2]?.replace(/"/g, '').trim();
                tel = cols[3]?.replace(/"/g, '').trim();
            }

            if (name && addr) {
                csvItems.push({
                    name,
                    address: addr,
                    tel,
                    source: file,
                    normName: normalizeName(name),
                    normAddr: normalizeAddress(addr)
                });
            }
        }
    }

    // 3. 매칭 로직 (Report와 동일하게)
    const candidates: any[] = [];
    const csvProcessed = new Set<number>();
    const dbMatchedCsvIdx = new Set<number>();

    // DB에 이미 있는 것들은 후보에서 제외
    for (const dbInfo of dbItems) {
        if (dbInfo.name.includes('부산전문')) {
            console.log(`🔍 Found DB entry: ${dbInfo.name}, NormName: ${dbInfo.normName}, NormAddr: ${dbInfo.normAddr}`);
        }
        let foundIdx = csvItems.findIndex((c, idx) => !dbMatchedCsvIdx.has(idx) && c.normName === dbInfo.normName);
        if (foundIdx === -1) {
            foundIdx = csvItems.findIndex((c, idx) => {
                if (dbMatchedCsvIdx.has(idx)) return false;
                const addrMatch = c.normAddr === dbInfo.normAddr && dbInfo.normAddr.length > 5;
                const nameSimilar = c.normName.includes(dbInfo.normName) || dbInfo.normName.includes(c.normName);
                if (dbInfo.name.includes('부산전문') && (addrMatch || nameSimilar)) {
                    console.log(`   💡 Potential Match in Tier 2: ${csvItems[idx].name}`);
                }
                return addrMatch || (nameSimilar && c.normAddr.startsWith(dbInfo.normAddr.substring(0, 10)));
            });
        }
        if (foundIdx !== -1) {
            if (dbInfo.name.includes('부산전문')) {
                console.log(`   ✅ Matched with CSV: ${csvItems[foundIdx].name}`);
            }
            dbMatchedCsvIdx.add(foundIdx);
        }
    }

    // 매칭되지 않은 CSV 항목들만 후보로 등록 (중복 제거 포함)
    const processedCandidateNames = new Set<string>();
    csvItems.forEach((c, idx) => {
        if (!dbMatchedCsvIdx.has(idx)) {
            // 정규화된 이름으로 중복 체크
            if (!processedCandidateNames.has(c.normName)) {
                // DB에 이미 있는지 한 번 더 확인 (안전장치)
                const alreadyInDB = dbItems.some(db =>
                    db.normName === c.normName ||
                    (db.normAddr === c.normAddr && c.normAddr.length > 10)
                );

                if (!alreadyInDB) {
                    candidates.push(c);
                    processedCandidateNames.add(c.normName);
                }
            }
        }
    });

    // 4. CSV 저장
    const outputPath = path.resolve(process.cwd(), '신규_장례식장_등록후보_186.csv');
    let csvContent = "\ufeff시설명,주소,전화번호,출처파일\n"; // UTF-8 BOM
    candidates.forEach(c => {
        csvContent += `"${c.name}","${c.address}","${c.tel}","${c.source}"\n`;
    });

    fs.writeFileSync(outputPath, csvContent, 'utf-8');
    console.log(`✅ Exported ${candidates.length} candidates to ${outputPath}`);
}

exportCandidates();
