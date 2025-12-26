
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

// CSV Parsing
function parseCSVLine(line: string): string[] {
    // Simple parser handling quotes
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
    } catch (e) { return null; }
}

async function searchKakao(query: string): Promise<any> {
    if (!KAKAO_API_KEY) return null;
    try {
        const response = await axios.get('https://dapi.kakao.com/v2/local/search/keyword.json', {
            params: { query: query, size: 1 },
            headers: { 'Authorization': `KakaoAK ${KAKAO_API_KEY}` }
        });
        return response.data;
    } catch (e) { return null; }
}

async function verifySanbunJang() {
    console.log("🌊 산분장 데이터 교차 검증 및 업데이트 시작...\n");

    const csvPath = path.resolve(process.cwd(), '납골당보안시설자료/15774129-2025-12-22산분장.csv');
    if (!fs.existsSync(csvPath)) {
        console.error("❌ CSV 파일을 찾을 수 없습니다:", csvPath);
        return;
    }

    const content = fs.readFileSync(csvPath, 'utf-8');
    const lines = content.split('\n').filter(l => l.trim());

    // Header: fac_type,fac_thumb src,fac_tit,fac_addr,fac_tel href,fac_tel,fac_update
    // Indices based on inspection:
    // 0: type, 1: thumb, 2: name, 3: addr, 5: tel
    const header = parseCSVLine(lines[0]);
    const nameIdx = header.findIndex(h => h.includes('fac_tit'));
    const addrIdx = header.findIndex(h => h.includes('fac_addr'));
    const imgIdx = header.findIndex(h => h.includes('fac_thumb'));
    const telIdx = header.findIndex(h => h.trim() === 'fac_tel');

    for (let i = 1; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i]);
        if (cols.length <= nameIdx) continue;

        const rawName = cols[nameIdx].trim();
        const address = cols[addrIdx] ? cols[addrIdx].trim().replace(/"/g, '') : '';
        const imageUrl = cols[imgIdx] ? cols[imgIdx].trim() : '';
        const phone = cols[telIdx] ? cols[telIdx].trim() : '';

        // Determine Type
        // 바다 -> sea, natural -> natural
        let type = 'natural'; // default
        if (rawName.includes('바다') || rawName.includes('해양')) type = 'sea';

        console.log(`Processing: ${rawName} (${type})`);

        // Check DB
        const { data: matched } = await supabase
            .from('memorial_spaces')
            .select('*')
            .ilike('name', rawName.split('(')[0].trim()); // relaxed match

        let target = matched && matched.length > 0 ? matched[0] : null;

        if (target) {
            // Update
            console.log(`✅ [MATCH] Existing ID: ${target.id}`);
            const updates: any = {};
            if (imageUrl && (!target.image_url || target.image_url.includes('unsplash'))) updates.image_url = imageUrl;
            if (!target.phone && phone) updates.phone = phone;
            if (target.type !== type) {
                // If existing is 'funeral' but name says 'Sea', maybe strictly 'sea'? 
                // Careful not to overwrite if it's a complex.
                // But for 'Sea', it's usually distinct.
                if (type === 'sea') updates.type = 'sea';
            }

            if (Object.keys(updates).length > 0) {
                await supabase.from('memorial_spaces').update(updates).eq('id', target.id);
                console.log(`   Updated: ${Object.keys(updates).join(', ')}`);
            }
        } else {
            // Verify & Add
            const naverRes = await searchNaver(rawName);
            const kakaoRes = await searchKakao(rawName);

            let isVerified = false;
            let lat = null;
            let lng = null;
            let source = 'cvs_unverified';

            if (naverRes?.items?.length > 0 || kakaoRes?.documents?.length > 0) {
                isVerified = true;
                source = 'csv_verified_cross';

                if (kakaoRes?.documents?.length > 0) {
                    lat = parseFloat(kakaoRes.documents[0].y);
                    lng = parseFloat(kakaoRes.documents[0].x);
                } else if (naverRes?.items?.length > 0) {
                    // Need KATEC to WGS84 for Naver search/local if using that endpoint
                    // Skipping coords if only Naver found for simplicity in this quick script
                    // Or default to null coords.
                }
            }

            if (isVerified) {
                const newFac = {
                    name: rawName,
                    address: address,
                    image_url: imageUrl || null,
                    phone: phone || null,
                    type: type,
                    is_verified: true,
                    data_source: source,
                    lat: lat,
                    lng: lng,
                    rating: 0,
                    review_count: 0
                };
                const { error } = await supabase.from('memorial_spaces').insert([newFac]);
                if (error) console.error(`   ❌ Insert Failed: ${error.message}`);
                else console.log(`   ✨ Added New Facility`);
            } else {
                console.log(`   ⚠️  Unverified (Skipped)`);
            }
        }
    }
}

verifySanbunJang();
