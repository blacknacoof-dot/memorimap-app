
import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import axios from 'axios';

// Load Env
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
);

// API Config
const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID || '';
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET || '';
const KAKAO_API_KEY = process.env.VITE_KAKAO_REST_API_KEY || '';

// CSV Parsing
function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);
    return result;
}

// API Functions
async function searchNaver(query: string): Promise<any> {
    if (!NAVER_CLIENT_ID) return null;
    try {
        const response = await axios.get('https://openapi.naver.com/v1/search/local.json', {
            params: { query: query, display: 1 },
            headers: {
                'X-Naver-Client-Id': NAVER_CLIENT_ID,
                'X-Naver-Client-Secret': NAVER_CLIENT_SECRET
            }
        });
        return response.data;
    } catch (e) {
        return null;
    }
}

async function searchKakao(query: string): Promise<any> {
    if (!KAKAO_API_KEY) return null;
    try {
        const response = await axios.get('https://dapi.kakao.com/v2/local/search/keyword.json', {
            params: { query: query, size: 1 },
            headers: { 'Authorization': `KakaoAK ${KAKAO_API_KEY}` }
        });
        return response.data;
    } catch (e) {
        return null;
    }
}

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    console.log("🚀 봉안시설 교차 검증 및 업데이트 시작...\n");

    const csvPath = path.resolve(process.cwd(), '납골당보안시설자료/15774129-2025-12-22봉안시설.csv');
    if (!fs.existsSync(csvPath)) {
        console.error("❌ CSV 파일을 찾을 수 없습니다:", csvPath);
        return;
    }

    const content = fs.readFileSync(csvPath, 'utf-8');
    const lines = content.split('\n').filter(l => l.trim());

    // Header parsing
    // fac_type,fac_thumb src,fac_tit,fac_addr,fac_tel href,fac_tel
    const header = parseCSVLine(lines[0]);
    const nameIdx = header.findIndex(h => h.includes('fac_tit'));
    const addrIdx = header.findIndex(h => h.includes('fac_addr'));
    const imgIdx = header.findIndex(h => h.includes('fac_thumb'));
    const telIdx = header.findIndex(h => h.trim() === 'fac_tel'); // trim check

    if (nameIdx === -1 || imgIdx === -1) {
        console.error("❌ CSV 헤더 파싱 실패 (필수 컬럼 누락)");
        return;
    }

    let stats = {
        total: 0,
        updated: 0,
        added: 0,
        skipped: 0,
        error: 0
    };

    for (let i = 1; i < lines.length; i++) {
        stats.total++;
        const cols = parseCSVLine(lines[i]);
        if (cols.length <= nameIdx) continue;

        const rawName = cols[nameIdx].trim();
        const address = cols[addrIdx] ? cols[addrIdx].trim().replace(/"/g, '') : '';
        let imageUrl = cols[imgIdx] ? cols[imgIdx].trim() : '';
        const phone = cols[telIdx] ? cols[telIdx].trim() : '';

        // 정제된 이름
        let cleanName = rawName.replace(/\(주\)|\(재\)/g, '').trim();
        // 괄호 처리: '별그리다(사담재)' -> '별그리다'로 검색? 아니면 전체 이름?
        // 일단 전체 이름으로 시도하고 없으면 괄호 앞부분으로 재시도 전략은 복잡하니, ILIKE로 시도.

        if (!rawName) continue;

        // DB 검색
        const { data: existing, error: dbError } = await supabase
            .from('memorial_spaces')
            .select('*')
            .or(`name.eq.${rawName},name.eq.${cleanName},address.ilike.%${address.split(' ')[0]}%`) // 주소 매칭은 너무 넓을 수 있음. 이름 위주.
            .ilike('name', `%${cleanName.split('(')[0]}%`) // 이름의 앞부분 매칭 시도
            .limit(1); // 일단 하나만 가져와본다? 아니면 정확한 매칭을 위해 필터링.

        // Supabase OR query is tricky. Let's stick to name match mostly.
        const { data: matchedFacilities } = await supabase
            .from('memorial_spaces')
            .select('*')
            .ilike('name', cleanName); // Case insensitive exact matchish

        let target = matchedFacilities && matchedFacilities.length > 0 ? matchedFacilities[0] : null;

        // If not found, try removing parentheses content if present
        if (!target && cleanName.includes('(')) {
            const baseName = cleanName.split('(')[0].trim();
            if (baseName.length > 2) {
                const { data: baseMatch } = await supabase.from('memorial_spaces').select('*').ilike('name', baseName).limit(1);
                if (baseMatch && baseMatch.length > 0) target = baseMatch[0];
            }
        }

        if (target) {
            // Found -> Update
            const updates: any = {};
            let shouldUpdate = false;

            // Image Update (If CSV has image and DB has Unsplash/Null)
            if (imageUrl && (!target.image_url || target.image_url.includes('unsplash'))) {
                updates.image_url = imageUrl;
                shouldUpdate = true;
            }

            // Info Update
            if (!target.phone && phone) {
                updates.phone = phone;
                shouldUpdate = true;
            }
            if (!target.address && address) {
                updates.address = address;
                shouldUpdate = true;
            }
            // Type Update? If 'funeral' but actually 'charnel'? 
            // Better to verify type. But don't overwrite blindly.

            if (shouldUpdate) {
                await supabase.from('memorial_spaces').update(updates).eq('id', target.id);
                console.log(`✅ [UPDATE] ${rawName} : 사진/정보 업데이트 완료`);
                stats.updated++;
            } else {
                // console.log(`   [SKIP] ${rawName} : 이미 최신 정보`);
                stats.skipped++;
            }

        } else {
            // Not Found -> Verify & Add
            if (!address) {
                // address required for verification essentially
                stats.skipped++;
                continue;
            }

            // Cross Verification
            let naverRes = await searchNaver(rawName);
            let kakaoRes = await searchKakao(rawName);

            // Retry with address if name search fails?
            // Optional optimization.

            let isVerified = false;
            let lat = null;
            let lng = null;
            let source = 'cvs_unverified';

            if (naverRes?.items?.length > 0 && kakaoRes?.documents?.length > 0) {
                // Both found -> High Confidence
                isVerified = true;
                source = 'csv_verified_cross';
                // Prefer Naver Coordinates? Or Kakao? 
                // Naver is katec usually or latlng depending on endpoint?
                // search/local returns mapx, mapy (KATEC). Need conversion?
                // Wait, add-yeongju.ts divided by 10,000,000. That implies LatLng (WGS84) but multiplied? 
                // Naver Search API returns KATEC usually. Wait.
                // Naver 'v1/search/local.json' returns mapx/mapy as integer string?
                // Documentation says: "KATEC 좌표계...". 
                // But add-yeongju.ts handles them directly as lat/lng? (div by 1e7) -> This suggests TM128 or KATEC? 
                // Actually Kakao returns WGS84 (x, y). Let's use Kakao coordinates for simplicity if available.
                const kDoc = kakaoRes.documents[0];
                lat = parseFloat(kDoc.y);
                lng = parseFloat(kDoc.x);
            } else if (kakaoRes?.documents?.length > 0) {
                // Kakao only
                isVerified = true;
                source = 'csv_verified_kakao';
                const kDoc = kakaoRes.documents[0];
                lat = parseFloat(kDoc.y);
                lng = parseFloat(kDoc.x);
            } else if (naverRes?.items?.length > 0) {
                // Naver only
                isVerified = true;
                source = 'csv_verified_naver';
                // Coordinate conversion tricky if Naver Search.
                // Skip coords if unknown, rely on address enrichment later?
                // Or just insert without coords.
            }

            if (isVerified) {
                const newFacility = {
                    name: rawName,
                    address: address, // Use CSV address or API address? CSV is "official" source here.
                    image_url: imageUrl || null,
                    phone: phone || null,
                    type: 'charnel', // Default for this file
                    is_verified: true,
                    data_source: source,
                    lat: lat,
                    lng: lng,
                    rating: 0,
                    review_count: 0
                };

                const { error: insertError } = await supabase.from('memorial_spaces').insert([newFacility]);
                if (insertError) {
                    console.error(`❌ [INSERT FAIL] ${rawName}:`, insertError.message);
                    stats.error++;
                } else {
                    console.log(`✨ [NEW] ${rawName} : 신규 추가 (${source})`);
                    stats.added++;
                }
            } else {
                console.log(`⚠️  [UNVERIFIED] ${rawName} : 검색 결과 없음 (스킵)`);
                stats.skipped++;
            }

            await sleep(100); // Rate limit
        }
    }

    console.log("\n📊 최종 결과:");
    console.log(`- 전체: ${stats.total}`);
    console.log(`- 업데이트: ${stats.updated}`);
    console.log(`- 신규 추가: ${stats.added}`);
    console.log(`- 스킵: ${stats.skipped}`);
    console.log(`- 에러: ${stats.error}`);
}

main();
