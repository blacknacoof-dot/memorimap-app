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

const KAKAO_API_KEY = process.env.VITE_KAKAO_REST_API_KEY || '';

async function searchKakao(query: string): Promise<any> {
    try {
        const response = await axios.get('https://dapi.kakao.com/v2/local/search/keyword.json', {
            params: { query: query, size: 5 },
            headers: { 'Authorization': `KakaoAK ${KAKAO_API_KEY}` }
        });
        return response.data;
    } catch (error: any) {
        console.error(`❌ Kakao API Error:`, error.message);
        return null;
    }
}

async function addGoseongKakao() {
    console.log("🏥 고성장례식장화라 추가 중 (카카오 API)...\n");

    const facility = {
        name: '고성장례식장화라주식회사',
        address: '경상남도 고성군 고성읍 상정대로 390 (교사리)',
        phone: '055-672-5000'
    };

    console.log("📍 좌표 검색 중...");
    const kakaoData = await searchKakao('고성 화라 장례식장');

    let lat = null;
    let lng = null;

    if (kakaoData && kakaoData.documents && kakaoData.documents.length > 0) {
        const result = kakaoData.documents[0];
        lat = parseFloat(result.y);
        lng = parseFloat(result.x);
        console.log(`✅ 좌표: (${lat}, ${lng})\n`);
    } else {
        console.log("⚠️  좌표를 찾지 못했습니다. 주소 기반으로 검색...\n");

        // 주소로 검색
        const addrData = await searchKakao('고성군 고성읍 상정대로 390');
        if (addrData && addrData.documents && addrData.documents.length > 0) {
            const result = addrData.documents[0];
            lat = parseFloat(result.y);
            lng = parseFloat(result.x);
            console.log(`✅ 주소 기반 좌표: (${lat}, ${lng})\n`);
        } else {
            console.log("❌ 좌표를 찾을 수 없습니다.\n");
            return;
        }
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
            image_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800',
            description: '',
            price_range: '가격 정보 상담',
            rating: 4.6,
            review_count: 0
        }])
        .select();

    if (error) {
        console.error('❌ DB 추가 실패:', error.message);
        return;
    }

    console.log('✅ DB 추가 완료!');
    console.log(`   - 시설 ID: ${data[0].id}`);
    console.log(`   - 좌표: (${data[0].lat}, ${data[0].lng})`);
    console.log('\n🎉 고성장례식장화라가 성공적으로 추가되었습니다!');
}

addGoseongKakao();
