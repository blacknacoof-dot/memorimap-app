import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as dotenv from 'dotenv';
import axios from 'axios';

// Load Env
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
);

const KAKAO_API_KEY = process.env.VITE_KAKAO_REST_API_KEY || '';

// 카카오 검색 API 호출
async function searchKakao(query: string): Promise<any> {
    try {
        const response = await axios.get('https://dapi.kakao.com/v2/local/search/keyword.json', {
            params: {
                query: query,
                size: 5
            },
            headers: {
                'Authorization': `KakaoAK ${KAKAO_API_KEY}`
            }
        });

        return response.data;
    } catch (error: any) {
        console.error(`❌ Kakao API Error:`, error.message);
        return null;
    }
}

async function addSuwonFacility() {
    console.log("🏥 수원덕산병원 장례식장 추가 중...\n");

    const facilityInfo = {
        name: '수원덕산병원장례식장',
        address: '경기도 수원시 권선구 서부로 1674 (고색동)',
        phone: '031-686-2900',
        type: 'funeral',
        data_source: 'manual',
        is_verified: true
    };

    // 1. 카카오 API로 좌표 검색
    console.log("📍 좌표 검색 중...");
    const kakaoData = await searchKakao('수원덕산병원 장례식장 수원시');

    let lat = null;
    let lng = null;

    if (kakaoData && kakaoData.documents && kakaoData.documents.length > 0) {
        const result = kakaoData.documents[0];
        lat = parseFloat(result.y);
        lng = parseFloat(result.x);
        console.log(`✅ 좌표 찾음: (${lat}, ${lng})\n`);
    } else {
        console.log("⚠️  좌표를 찾지 못했습니다. 기본 좌표 사용\n");
        // 수원시 권선구 대략적인 좌표
        lat = 37.2636;
        lng = 126.9958;
    }

    // 2. DB에 추가
    const { data, error } = await supabase
        .from('memorial_spaces')
        .insert([{
            name: facilityInfo.name,
            address: facilityInfo.address,
            phone: facilityInfo.phone,
            lat: lat,
            lng: lng,
            type: facilityInfo.type,
            data_source: facilityInfo.data_source,
            is_verified: facilityInfo.is_verified,
            image_url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800',
            description: '수원덕산병원 내 장례식장입니다.',
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
    console.log(`   - 주소: ${data[0].address}`);
    console.log(`   - 전화: ${data[0].phone}`);
    console.log(`   - 좌표: (${data[0].lat}, ${data[0].lng})`);
    console.log('\n🎉 수원덕산병원 장례식장이 성공적으로 추가되었습니다!');
}

addSuwonFacility();
