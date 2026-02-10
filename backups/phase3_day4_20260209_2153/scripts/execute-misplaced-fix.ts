
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import axios from 'axios';

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!);
const KAKAO_KEY = process.env.VITE_KAKAO_REST_API_KEY;

function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

async function executeMisplacedFix() {
    console.log("🛠️ Executing Misplaced Facility Fixes...\n");

    // Fetch All again to be safe
    let allFacilities: any[] = [];
    let page = 0;
    const pageSize = 1000;

    while (true) {
        const { data, error } = await supabase
            .from('memorial_spaces')
            .select('id, name, address, type, lat, lng')
            .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error || !data || data.length === 0) break;
        allFacilities = allFacilities.concat(data);
        if (data.length < pageSize) break;
        page++;
    }

    const coordMap = new Map<string, any[]>();
    allFacilities.forEach(f => {
        if (!f.lat || !f.lng) return;
        const key = `${Number(f.lat).toFixed(6)},${Number(f.lng).toFixed(6)}`;
        if (!coordMap.has(key)) coordMap.set(key, []);
        coordMap.get(key)?.push(f);
    });

    let fixedCount = 0;

    for (const [key, list] of coordMap.entries()) {
        if (list.length < 2) continue;

        const uniqueAddresses = new Set(list.map(f => f.address?.substring(0, 10)));
        if (uniqueAddresses.size < 2) continue;

        for (const f of list) {
            if (!KAKAO_KEY) continue;

            try {
                const query = f.name;
                const url = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}`;
                const res = await axios.get(url, { headers: { Authorization: `KakaoAK ${KAKAO_KEY}` } });

                if (res.data.documents.length > 0) {
                    const bestMatch = res.data.documents[0];
                    const newLat = Number(bestMatch.y);
                    const newLng = Number(bestMatch.x);

                    const dist = getDistance(f.lat, f.lng, newLat, newLng);

                    if (dist > 500) {
                        console.log(`🚀 Moving [${f.name}] (ID: ${f.id})`);
                        console.log(`   From: ${f.lat}, ${f.lng}`);
                        console.log(`   To:   ${newLat}, ${newLng} (Dist: ${Math.round(dist)}m)`);

                        const { error } = await supabase
                            .from('memorial_spaces')
                            .update({ lat: newLat, lng: newLng }) // Keeping address same, just moving pin
                            .eq('id', f.id);

                        if (error) console.error(`   ❌ Failed: ${error.message}`);
                        else {
                            console.log(`   ✅ Success`);
                            fixedCount++;
                        }
                    }
                }
            } catch (e) {
                console.error(`   Error checking ${f.name}`);
            }
        }
    }

    console.log(`\n✅ Fixed ${fixedCount} misplaced facilities.`);
}

executeMisplacedFix();
