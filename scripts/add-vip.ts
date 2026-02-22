import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as dotenv from 'dotenv';
import axios from 'axios';

const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
);

const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID || '';
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET || '';

async function searchNaver(query: string): Promise<any> {
    try {
        const response = await axios.get('https://openapi.naver.com/v1/search/local.json', {
            params: { query: query, display: 5 },
            headers: {
                'X-Naver-Client-Id': NAVER_CLIENT_ID,
                'X-Naver-Client-Secret': NAVER_CLIENT_SECRET
            }
        });
        return response.data;
    } catch (error: any) {
        console.error(`❌ Naver API Error:`, error.message);
        return null;
    }
}

async function addVIP() {
    console.log("🏥 브이아이피 장례타운 추가 중...\n");

    const facility = {
        name: '브이아이피장례타운',
        address: '광주광역시 서구 풍서좌로 237',
        phone: '0507-1427-4446'
    };

    console.log("📍 좌표 검색 중...");
    const naverData = await searchNaver('VIP 장례타운 광주');

    let lat = null;
    let lng = null;

    if (naverData && naverData.items && naverData.items.length > 0) {
        const result = naverData.items[0];
        lat = result.mapy ? parseFloat(result.mapy) / 10000000 : null;
        lng = result.mapx ? parseFloat(result.mapx) / 10000000 : null;
        console.log(`✅ 좌표: (${lat}, ${lng})\n`);
    } else {
        console.log("⚠️  좌표를 찾지 못했습니다.\n");
        return;
    }

    const { data, error } = await supabase
        .from('memorial_spaces')
        .insert([{
            name: facility.name,
            address: facility.address,
            phone: facility.phone,
            lat: lat,
            lng: lng,
            type: 'funeral',
            data_source: 'manual',
            is_verified: true,
            image_url: 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=800',
            description: '',
            price_range: '가격 정보 상담',
            rating: 4.7,
            review_count: 0
        }])
        .select();

    if (error) {
        console.error('❌ DB 추가 실패:', error.message);
        return;
    }

    console.log('✅ DB 추가 완료!');
    console.log(`   - 시설 ID: ${data[0].id}`);
    console.log(`   - 시설명: ${data[0].name}`);
    console.log(`   - 좌표: (${data[0].lat}, ${data[0].lng})`);
    console.log('\n🎉 브이아이피 장례타운이 성공적으로 추가되었습니다!');
}

addVIP();
