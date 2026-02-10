
import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import axios from 'axios';

const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
);

// API Config
const NAVER_CLIENT_ID = process.env.VITE_NAVER_CLIENT_ID || '';
const NAVER_CLIENT_SECRET = process.env.VITE_NAVER_CLIENT_SECRET || '';
const KAKAO_API_KEY = process.env.VITE_KAKAO_REST_API_KEY || '';

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

// Reuse search logic
async function searchNaver(query: string) { /* ... */
    if (!NAVER_CLIENT_ID) return null;
    try {
        const response = await axios.get('https://openapi.naver.com/v1/search/local.json', {
            params: { query: query, display: 1 },
            headers: { 'X-Naver-Client-Id': NAVER_CLIENT_ID, 'X-Naver-Client-Secret': NAVER_CLIENT_SECRET }
        });
        return response.data;
    } catch (e) { return null; }
}
async function searchKakao(query: string) { /* ... */
    if (!KAKAO_API_KEY) return null;
    try {
        const response = await axios.get('https://dapi.kakao.com/v2/local/search/keyword.json', {
            params: { query: query, size: 1 },
            headers: { 'Authorization': `KakaoAK ${KAKAO_API_KEY}` }
        });
        return response.data;
    } catch (e) { return null; }
}

async function verifyNaturalBurials() {
    console.log("🌲 자연장/수목장 데이터 교차 검증 시작...\n");
    const filename = '15774129-2025-12-22자연장지 수목장 불교 기독교 천주교.csv';
    const csvPath = path.resolve(process.cwd(), `납골당보안시설자료/${filename}`);

    if (!fs.existsSync(csvPath)) {
        console.error("❌ CSV 파일을 찾을 수 없습니다:", csvPath);
        return;
    }

    const content = fs.readFileSync(csvPath, 'utf-8');
    const lines = content.split('\n').filter(l => l.trim());

    // Header check
    const header = parseCSVLine(lines[0]);
    const nameIdx = header.findIndex(h => h.includes('fac_tit'));
    const addrIdx = header.findIndex(h => h.includes('fac_addr'));
    const imgIdx = header.findIndex(h => h.includes('fac_thumb'));
    const telIdx = header.findIndex(h => h.trim() === 'fac_tel');

    let stats = { total: lines.length - 1, updated: 0, added: 0, skipped: 0 };

    for (let i = 1; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i]);
        if (cols.length <= nameIdx) continue;

        let rawName = cols[nameIdx].trim();
        const address = cols[addrIdx] ? cols[addrIdx].trim().replace(/"/g, '') : '';
        const imageUrl = cols[imgIdx] ? cols[imgIdx].trim() : '';
        const phone = cols[telIdx] ? cols[telIdx].trim() : '';

        // Remove parenthesis for matching
        const cleanName = rawName.split('(')[0].trim().replace(/\s+/g, '');

        // Check DB
        const { data: matched } = await supabase
            .from('memorial_spaces')
            .select('*')
            .ilike('name', rawName.split('(')[0].trim()); // relaxed

        let target = matched && matched.length > 0 ? matched[0] : null;

        // Try stricter match if many results
        if (matched && matched.length > 1) {
            const exact = matched.find((m: any) => m.name.replace(/\s+/g, '') === cleanName);
            if (exact) target = exact;
        }

        if (target) {
            const updates: any = {};
            if (imageUrl && (!target.image_url || target.image_url.includes('unsplash'))) updates.image_url = imageUrl;
            if (!target.phone && phone) updates.phone = phone;
            // Force type to 'natural' if it's currently something else generic?
            // Actually 'park' and 'natural' can overlap. Keep existing if it makes sense.
            // If existing is 'charnel' but this says 'natural', maybe we should update?
            // "natural" is distinct in our system.
            if (target.type !== 'natural') {
                // Update type only if currently null or generic 'other'
                // Or if name strongly suggests natural. 
                // Let's trust the CSV "Natural Burial" classification for now, 
                // unless it's a big complex ('complex' type).
                if (target.type !== 'complex') updates.type = 'natural';
            }

            if (Object.keys(updates).length > 0) {
                await supabase.from('memorial_spaces').update(updates).eq('id', target.id);
                stats.updated++;
                // console.log(`   Updated: ${target.name}`);
            } else {
                stats.updated++; // Count as matched/checked
            }
        } else {
            // New verification
            const naverRes = await searchNaver(rawName);
            const kakaoRes = await searchKakao(rawName);

            let isVerified = false;
            let lat = null, lng = null;
            let source = 'csv_unverified';

            if (naverRes?.items?.length > 0 || kakaoRes?.documents?.length > 0) {
                isVerified = true;
                source = 'csv_verified_cross';
                if (kakaoRes?.documents?.length > 0) {
                    lat = parseFloat(kakaoRes.documents[0].y);
                    lng = parseFloat(kakaoRes.documents[0].x);
                }
            }

            if (isVerified) {
                const newFac = {
                    name: rawName,
                    address: address,
                    image_url: imageUrl || null,
                    phone: phone || null,
                    type: 'natural',
                    is_verified: true,
                    data_source: source,
                    lat: lat,
                    lng: lng,
                    rating: 0,
                    review_count: 0
                };
                const { error } = await supabase.from('memorial_spaces').insert([newFac]);
                if (!error) {
                    stats.added++;
                    // console.log(`   Added: ${rawName}`);
                }
            } else {
                stats.skipped++;
            }
        }
        if (i % 20 === 0) console.log(`Processing... ${i}/${lines.length}`);
    }

    console.log("\n📊 결과 요약:");
    console.log(`- 전체: ${stats.total}`);
    console.log(`- 업데이트/매칭: ${stats.updated}`);
    console.log(`- 신규 추가: ${stats.added}`);
    console.log(`- 스킵: ${stats.skipped}`);
}

verifyNaturalBurials();
