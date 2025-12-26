
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import axios from 'axios';

const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!);
const KAKAO_KEY = process.env.VITE_KAKAO_REST_API_KEY;

async function run() {
    // 1. Search Greenpia exact
    console.log("1. Finding '그린피아수목장'...");
    const { data: greenpia } = await supabase.from('memorial_spaces').select('*').ilike('name', '%그린피아수목장%');
    if (greenpia && greenpia.length > 0) {
        greenpia.forEach(f => console.log(`   Found: [${f.id}] ${f.name} (${f.address})`));
    } else {
        console.log("   Not found by name '그린피아수목장'. Checking '그린피아' again...");
        const { data: greenpia2 } = await supabase.from('memorial_spaces').select('*').ilike('name', '%그린피아%');
        greenpia2?.forEach(f => console.log(`   Found: [${f.id}] ${f.name} (${f.address})`));
    }

    // 2. Geocode Pyeongan Address
    const address = "충청북도 청주시 서원구 남이면 구암리 산15-1";
    console.log(`\n2. Geocoding: ${address}`);
    if (!KAKAO_KEY) {
        console.log("   Skipping (No Kakao Key)");
        return;
    }

    try {
        const url = `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`;
        const res = await axios.get(url, { headers: { Authorization: `KakaoAK ${KAKAO_KEY}` } });
        if (res.data.documents.length > 0) {
            const { x, y } = res.data.documents[0];
            console.log(`   Result: Lat ${y}, Lng ${x}`);
        } else {
            console.log("   No coordinates found.");
        }
    } catch (e) {
        console.error("   Geocoding failed", e.message);
    }
}

run();
