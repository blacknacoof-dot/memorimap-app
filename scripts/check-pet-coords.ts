
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import axios from 'axios';

// Load Env
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
);

const NAVER_CLIENT_ID = process.env.VITE_NAVER_CLIENT_ID || '';
const NAVER_CLIENT_SECRET = process.env.VITE_NAVER_CLIENT_SECRET || '';
const KAKAO_API_KEY = process.env.VITE_KAKAO_REST_API_KEY || '';

async function searchNaver(query: string) {
    if (!NAVER_CLIENT_ID) return null;
    try {
        const response = await axios.get('https://openapi.naver.com/v1/search/local.json', {
            params: { query: query, display: 1 },
            headers: { 'X-Naver-Client-Id': NAVER_CLIENT_ID, 'X-Naver-Client-Secret': NAVER_CLIENT_SECRET }
        });
        const item = response.data.items[0];
        if (item && item.mapx && item.mapy) {
            // Naver returns KATECH or TM128? No it returns Transformed TM128 usually, or just weird numbers.
            // Actually Naver Search API returns mapx mapy as integer string?
            // Wait, documentation says: "KATECH coordinates converted to integer".
            // This is useless without proj4js conversion.
            // Let's use Kakao instead for reliable WGS84.
            return null;
        }
        return null;
    } catch (e) { return null; }
}

async function searchKakao(query: string) {
    if (!KAKAO_API_KEY) return null;
    try {
        const response = await axios.get('https://dapi.kakao.com/v2/local/search/keyword.json', {
            params: { query: query, size: 1 },
            headers: { 'Authorization': `KakaoAK ${KAKAO_API_KEY}` }
        });
        const item = response.data.documents[0];
        if (item && item.y && item.x) {
            return { lat: parseFloat(item.y), lng: parseFloat(item.x) };
        }
        return null;
    } catch (e) { return null; }
}

async function fixPetCoords() {
    console.log("🔧 Fixing Pet Facility Coordinates...");

    const { data: facilities, error } = await supabase
        .from('memorial_spaces')
        .select('id, name, address')
        .eq('type', 'pet')
        .is('lat', null); // Only fetch nulls

    if (error || !facilities) {
        console.error("Fetch error:", error);
        return;
    }

    console.log(`Found ${facilities.length} facilities with missing coordinates.`);

    let fixed = 0;

    for (const f of facilities) {
        console.log(`Processing: ${f.name} (${f.address})`);

        // Try Kakao first (WGS84 native)
        let coords = await searchKakao(f.address); // Search by address first
        if (!coords) coords = await searchKakao(f.name); // Then by name

        if (coords) {
            console.log(`  ✅ Found: ${coords.lat}, ${coords.lng}`);
            await supabase.from('memorial_spaces').update({
                lat: coords.lat,
                lng: coords.lng
            }).eq('id', f.id);
            fixed++;
        } else {
            console.log(`  ⚠️ Not found.`);
            // Clean up address (remove building info) and retry?
            const shortAddr = f.address.split(' ').slice(0, 3).join(' '); // Do/Si/Gu
            if (shortAddr && shortAddr !== f.address) {
                console.log(`    Retrying with short address: ${shortAddr}`);
                coords = await searchKakao(shortAddr);
                if (coords) {
                    console.log(`    ✅ Found with short addr`);
                    await supabase.from('memorial_spaces').update({ lat: coords.lat, lng: coords.lng }).eq('id', f.id);
                    fixed++;
                }
            }
        }
        await new Promise(r => setTimeout(r, 200));
    }

    console.log(`\n✅ Fixed ${fixed}/${facilities.length} coordinates.`);
}

fixPetCoords();
