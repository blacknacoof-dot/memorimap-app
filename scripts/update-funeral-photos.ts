
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

// 이름 정규화
function normalizeName(name: string): string {
    return name
        .replace(/\s+/g, '')
        .replace(/\(주\)|\(유\)|주식회사|유한회사/g, '')
        .replace(/장례식장|장례문화원|장례원/g, '')
        .toLowerCase();
}

// 주소 정규화
function normalizeAddress(addr: string): string {
    if (!addr) return '';
    return addr
        .replace(/\s+/g, '')
        .replace(/\(.*\)/g, '')
        .replace(/장례식장/g, '')
        .split(',')[0].trim();
}

async function syncPhotos() {
    console.log("📸 Starting Funeral Photo Sync from e-Sky CSVs...");

    // 1. DB 데이터 로드 (모든 장례식장)
    let dbFacilities: any[] = [];
    let from = 0;
    const step = 1000;
    let hasMore = true;

    while (hasMore) {
        const { data, error } = await supabase
            .from('memorial_spaces')
            .select('id, name, address, phone, image_url')
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

    console.log(`📦 Loaded ${dbFacilities.length} funeral facilities from DB.`);

    // 2. CSV 데이터 로드
    const csvDir = path.resolve(process.cwd(), '장례식장');
    const csvFiles = fs.readdirSync(csvDir).filter(f => f.endsWith('.csv'));
    const csvData: Array<{ name: string, address: string, imageUrl: string, normName: string, normAddr: string }> = [];

    for (const file of csvFiles) {
        const content = fs.readFileSync(path.join(csvDir, file), 'utf-8');
        const lines = content.split('\n').filter(l => l.trim());

        for (let i = 1; i < lines.length; i++) {
            const cols = parseCSVLine(lines[i]);
            if (cols.length < 4) continue;

            const imageUrl = cols[1]?.replace(/"/g, '').trim();
            const name = cols[2]?.replace(/"/g, '').trim();
            const address = cols[3]?.replace(/"/g, '').trim();

            if (name && imageUrl && imageUrl.startsWith('http')) {
                csvData.push({
                    name,
                    address,
                    imageUrl,
                    normName: normalizeName(name),
                    normAddr: normalizeAddress(address)
                });
            }
        }
    }

    console.log(`📋 Found ${csvData.length} facilities with photos in CSVs.`);

    // 3. 매칭 및 업데이트
    let updateCount = 0;
    const dbItems = dbFacilities.map(f => ({ ...f, normName: normalizeName(f.name), normAddr: normalizeAddress(f.address) }));

    for (const dbFac of dbItems) {
        // 이미 사진이 있는 경우 건너뛸지 말지는 사용자가 '업데이트' 원하니 진행
        // 1순위: 이름이 거의 일치
        let match = csvData.find(c => c.normName === dbFac.normName);

        // 2순위: 이름 부분 일치 + 주소 유사 (사용자 요청: 미세한 주소 차이 허용)
        if (!match) {
            match = csvData.find(c => {
                const nameSimilar = c.normName.includes(dbFac.normName) || dbFac.normName.includes(c.normName);
                const addrSimilar = c.normAddr.startsWith(dbFac.normAddr.substring(0, 10)) ||
                    dbFac.normAddr.startsWith(c.normAddr.substring(0, 10));
                return nameSimilar && addrSimilar;
            });
        }

        if (match) {
            // 정보 업데이트 (사진 정보만)
            const { error: updateError } = await supabase
                .from('memorial_spaces')
                .update({ image_url: match.imageUrl })
                .eq('id', dbFac.id);

            if (updateError) {
                console.error(`   ❌ Failed to update ${dbFac.name}: ${updateError.message}`);
            } else {
                updateCount++;
                if (updateCount % 50 === 0) console.log(`   ... updated ${updateCount} photos`);
            }
        }
    }

    console.log(`\n✨ Finished. Successfully updated ${updateCount} funeral facility photos.`);
}

syncPhotos();
