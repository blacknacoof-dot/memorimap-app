
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

// 명칭/주소 정규화 함수들 (매칭용)
function normalizeName(name: string): string {
    return name
        .replace(/\s+/g, '')
        .replace(/\(주\)|\(유\)|주식회사|유한회사/g, '')
        .replace(/장례식장|장례문화원|장례원/g, '')
        .toLowerCase();
}

function normalizeAddress(addr: string): string {
    if (!addr) return '';
    return addr
        .replace(/\s+/g, '')
        .replace(/\(.*\)/g, '')
        .replace(/장례식장/g, '')
        .split(',')[0].trim();
}

async function syncData() {
    console.log("🔄 Starting Official Funeral Data Synchronization...\n");

    // 1. DB 데이터 로드
    let dbFacilities: any[] = [];
    let from = 0;
    const step = 1000;
    let hasMore = true;

    while (hasMore) {
        const { data, error } = await supabase
            .from('memorial_spaces')
            .select('*')
            .eq('type', 'funeral')
            .range(from, from + step - 1);

        if (error) {
            console.error("❌ DB Fetch Error:", error);
            break;
        }

        if (data) {
            dbFacilities = [...dbFacilities, ...data];
            if (data.length < step) hasMore = false;
            else from += step;
        } else hasMore = false;
    }

    console.log(`📦 Loaded ${dbFacilities.length} facilities from DB.`);

    // 2. CSV 데이터 로합
    const csvDir = path.resolve(process.cwd(), '장례식장');
    const csvFiles = fs.readdirSync(csvDir).filter(f => f.endsWith('.csv'));
    const csvData: any[] = [];

    for (const file of csvFiles) {
        const content = fs.readFileSync(path.join(csvDir, file), 'utf-8');
        const lines = content.split('\n').filter(l => l.trim());

        if (lines.length < 2) continue;

        // 헤더 확인하여 CSV 형식 감지
        const header = lines[0].toLowerCase();
        const isNewFormat = header.includes('fac_tit') && header.includes('fac_addr');

        for (let i = 1; i < lines.length; i++) {
            const cols = parseCSVLine(lines[i]);
            if (cols.length < 4) continue;

            let facType, imageUrl, name, address, phone;

            if (isNewFormat) {
                // 새 형식: fac_thumb src,fac_tit,fac_addr,fac_tel href,fac_tel,...
                imageUrl = cols[0]?.replace(/"/g, '').trim();
                name = cols[1]?.replace(/"/g, '').trim();
                address = cols[2]?.replace(/"/g, '').trim();
                phone = cols[4]?.replace(/"/g, '').trim();
                facType = '공설';
            } else {
                // 기존 형식: 시설구분,시설명,소재지,전화번호,...
                facType = cols[0];
                imageUrl = cols[1]?.replace(/"/g, '').trim();
                name = cols[2]?.replace(/"/g, '').trim();
                address = cols[3]?.replace(/"/g, '').trim();
                phone = cols[5]?.replace(/"/g, '').trim();
            }

            if (name && address) {
                csvData.push({
                    name,
                    address,
                    phone: phone || '',
                    imageUrl: imageUrl || '',
                    normName: normalizeName(name),
                    normAddr: normalizeAddress(address)
                });
            }
        }
    }

    console.log(`📋 Loaded ${csvData.length} facilities from e-Sky CSVs.`);

    // 3. 매칭 및 동기화 업데이트
    let updateCount = 0;
    const dbItems = dbFacilities.map(f => ({ ...f, normName: normalizeName(f.name), normAddr: normalizeAddress(f.address) }));

    for (const dbFac of dbItems) {
        // 매칭 시도
        let csvMatch = csvData.find(c => c.normName === dbFac.normName);

        if (!csvMatch) {
            // 주소 기반 2차 매칭
            csvMatch = csvData.find(c => {
                const nameSimilar = c.normName.includes(dbFac.normName) || dbFac.normName.includes(c.normName);
                const addrSimilar = c.normAddr.startsWith(dbFac.normAddr.substring(0, 10)) ||
                    dbFac.normAddr.startsWith(c.normAddr.substring(0, 10));
                return nameSimilar && addrSimilar;
            });
        }

        if (csvMatch) {
            // 데이터 업데이트 (공식 정보로 동기화)
            const { error: updateError } = await supabase
                .from('memorial_spaces')
                .update({
                    name: csvMatch.name, // 공식 명칭으로 보정
                    address: csvMatch.address, // 공식 주소로 보정
                    phone: csvMatch.phone || dbFac.phone, // 공식 전화번호 (없으면 기존 유지)
                    image_url: csvMatch.imageUrl || dbFac.image_url, // 공식 사진
                    data_source: 'esky',
                    is_verified: true
                })
                .eq('id', dbFac.id);

            if (updateError) {
                console.error(`   ❌ Failed to sync ${dbFac.name}:`, updateError.message);
            } else {
                updateCount++;
                if (updateCount % 100 === 0) console.log(`   ... synced ${updateCount} facilities`);
            }
        }
    }

    console.log(`\n✨ Finished. Successfully synchronized ${updateCount} facilities with official data.`);
}

syncData();
