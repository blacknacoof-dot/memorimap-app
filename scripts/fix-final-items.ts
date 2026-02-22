
import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as dotenv from 'dotenv';
import axios from 'axios';

const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID || '';
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET || '';

const TARGETS = [
    { name: '서울성모장례식장', address: '서울특별시 서초구 반포대로 222', type: 'funeral' },
    { name: '포포즈 반려동물장례식장 김포점', address: '경기도 김포시 월곶면 애기봉로 262', type: 'pet' },
    { name: '장수암 자연장지', address: '경상남도 창원시 마산합포구 구산면 원전1길 141', type: 'natural' }
];

const KAKAO_API_KEY = process.env.VITE_KAKAO_REST_API_KEY || '';

async function getCoords(query: string) {
    // 1. Try Naver
    if (NAVER_CLIENT_ID) {
        try {
            const response = await axios.get('https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode', {
                params: { query: query },
                headers: { 'X-NCP-APIGW-API-KEY-ID': NAVER_CLIENT_ID, 'X-NCP-APIGW-API-KEY': NAVER_CLIENT_SECRET }
            });
            if (response.data.addresses.length > 0) {
                const { x, y, roadAddress, jibunAddress } = response.data.addresses[0];
                return { lat: parseFloat(y), lng: parseFloat(x), address: roadAddress || jibunAddress };
            }
        } catch (e) {
            // console.error("Naver failed, trying Kakao..."); 
        }
    }

    // 2. Try Kakao
    if (KAKAO_API_KEY) {
        try {
            const response = await axios.get('https://dapi.kakao.com/v2/local/search/address.json', {
                params: { query: query },
                headers: { Authorization: `KakaoAK ${KAKAO_API_KEY}` }
            });
            if (response.data.documents.length > 0) {
                const { y, x, address_name } = response.data.documents[0];
                return { lat: parseFloat(y), lng: parseFloat(x), address: address_name };
            }
        } catch (e) {
            // console.error("Kakao failed too");
        }
    }

    return null;
}

async function main() {
    console.log("🚀 최종 누락 시설 수동 처리 시작...");

    for (const target of TARGETS) {
        console.log(`Processing ${target.name}...`);

        const coords = await getCoords(target.address);
        if (!coords) {
            console.log(`  ❌ Coordinates not found for ${target.address}`);
            continue;
        }

        console.log(`  📍 Found: ${coords.lat}, ${coords.lng} (${coords.address})`);

        const { data: existing } = await supabase
            .from('memorial_spaces')
            .select('id')
            .like('name', `%${target.name.split(' ')[0]}%`) // "서울성모장례식장" -> "서울성모장례식장"
            .maybeSingle();

        const payload = {
            name: target.name,
            type: target.type,
            address: coords.address,
            lat: coords.lat,
            lng: coords.lng,
            is_verified: true,
            data_source: 'user_manual_fix',
            description: target.type === 'pet' ? '반려동물 장례식장' : (target.type === 'funeral' ? '카톨릭대학교 장례식장' : '자연장지'),
            rating: target.name === '서울성모장례식장' ? 4.78 : 0,
            review_count: target.name === '서울성모장례식장' ? 5 : 0
        };

        if (existing) {
            console.log(`  - Updating ID ${existing.id}`);
            await supabase.from('memorial_spaces').update(payload).eq('id', existing.id);
        } else {
            console.log(`  - Inserting new`);
            await supabase.from('memorial_spaces').insert(payload);
        }
    }
}

main();
