
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
const KAKAO_API_KEY = process.env.VITE_KAKAO_REST_API_KEY || '';

const TARGET_LIST = [
    { name: '김포시추모공원(자연장지)', address: '경기도 김포시 통진읍 애기봉로571번길 165' },
    { name: '춘천안식공원 잔디장', address: '강원특별자치도 춘천시 동산면 종자리로 331-50' },
    { name: '광주영락공원 청마루동산', address: '광주광역시 북구 영락공원로 170' },
    { name: '횡성군공설자연장지', address: '강원특별자치도 횡성군 갑천면 태기로구방8길 132' },
    { name: '진천군 자연장지', address: '충청북도 진천군 진천읍 장관리 758-3' },
    { name: '선불교자연장지', address: '충청북도 영동군 심천면 마곡리 185-3' },
    { name: '신불산추모공원 수목장지', address: '경상남도 양산시 어실로 602-1' },
    { name: '천봉사 자연장지', address: '강원특별자치도 홍천군 서면 팔봉산로 118' },
    { name: '신광사 수목장', address: '경상남도 거제시 사등면 오량2길 108' },
    { name: '서귀포추모공원 자연장지', address: '제주특별자치도 서귀포시 돈내코로 295-28' },
    { name: '대구남덕교회부활동산', address: '경상북도 고령군 성산면 사부리 산131' },
    { name: '사천시 누리원(자연장지)', address: '경상남도 사천시 해안관광로 208-66' },
    { name: '함평중앙교회 부활동산', address: '전라남도 함평군 함평읍 옥산리 242-9' },
    { name: '여주추모공원 자연장지', address: '경기도 여주시 가남읍 여주남로 769' },
    { name: '사모보궁자연장', address: '강원특별자치도 홍천군 두촌면 한계길 23-11' },
    { name: '인천가족공원 자연장지', address: '인천광역시 부평구 평온로 61' },
    { name: '기독교대한성결교회 안성교회 자연장지', address: '경기도 안성시 금광면 조령길 73-117' },
    { name: '북한강광명수목장', address: '경기도 양평군 서종면 북한강로 1138-69' },
    { name: '천탑사 수목장(그린피아)', address: '경상남도 밀양시 삼랑진읍 화성길 13-47' },
    { name: '세종수목장', address: '세종특별자치시 전의면 부거실길 135-11' }
];

async function getCoordsFromNaver(query: string) {
    if (!NAVER_CLIENT_ID) return null;
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
        // console.log(`Naver Geocode failed for ${query}`);
    }
    return null;
}

async function getCoordsFromKakao(query: string) {
    if (!KAKAO_API_KEY) return null;
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
        // console.log(`Kakao Geocode failed for ${query}`);
    }
    return null;
}

async function main() {
    console.log("🚀 자연장지 목록 처리 및 세종수목장 수정 시작...");

    for (const item of TARGET_LIST) {
        console.log(`Processing: ${item.name}`);

        // 1. Get Real Coords
        let coords = await getCoordsFromNaver(item.address);
        if (!coords) {
            console.log("  - Naver Geocode failed, trying Kakao...");
            coords = await getCoordsFromKakao(item.address);
        }

        if (!coords) {
            console.log(`  ❌ Coordinates not found for ${item.address}`);
            continue;
        }

        console.log(`  ✅ Coords: ${coords.lat}, ${coords.lng} (${coords.address})`);

        // 2. Check DB
        const { data: existing, error } = await supabase
            .from('memorial_spaces')
            .select('*')
            .like('name', `%${item.name.split('(')[0].trim()}%`) // Fuzzy match name
            .maybeSingle();

        if (existing) {
            console.log(`  - Found existing: ${existing.name} (ID: ${existing.id})`);

            // Special Case: Sejong Tree Funeral
            if (item.name.includes('세종수목장')) {
                console.log(`  - Updating Sejong location to correct one.`);
            } else {
                // Skip if distance is small? Or just update?
                // For now, update verified status and address/coords if helpful
            }

            const { error: updateError } = await supabase
                .from('memorial_spaces')
                .update({
                    address: coords.address,
                    lat: coords.lat,
                    lng: coords.lng,
                    is_verified: true,
                    data_source: 'user_correction'
                })
                .eq('id', existing.id);

            if (updateError) console.error(`  ❌ Update failed: ${updateError.message}`);
            else console.log(`  ✅ Updated.`);

        } else {
            console.log(`  - New Facility. Inserting...`);
            const { error: insertError } = await supabase
                .from('memorial_spaces')
                .insert({
                    name: item.name,
                    type: 'natural',
                    address: coords.address,
                    lat: coords.lat,
                    lng: coords.lng,
                    is_verified: true,
                    data_source: 'user_correction',
                    description: '자연장지',
                    rating: 0,
                    review_count: 0
                });

            if (insertError) console.error(`  ❌ Insert failed: ${insertError.message}`);
            else console.log(`  ✅ Inserted.`);
        }
    }
}

main();
