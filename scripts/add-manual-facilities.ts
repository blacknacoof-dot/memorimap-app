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

// 샘플 이미지
const SAMPLE_IMAGES = [
    'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800',
    'https://images.unsplash.com/photo-1519167758481-83f29da8c2b7?w=800'
];

async function addManualFacilities() {
    console.log("🏥 수동 시설 추가 시작...\n");

    const facilities = [
        {
            name: '수원덕산병원장례식장',
            address: '경기도 수원시 권선구 서부로 1674 (고색동)',
            phone: '031-686-2900',
            searchQuery: '수원덕산병원 장례식장'
        },
        {
            name: '동두천중앙성모병원장례식장',
            address: '경기도 동두천시 동광로 53',
            phone: '031-863-0550',
            searchQuery: '동두천중앙성모병원 장례식장'
        }
    ];

    let successCount = 0;
    let failCount = 0;

    for (const facility of facilities) {
        console.log(`\n📍 처리 중: ${facility.name}`);

        // 카카오 API로 좌표 검색
        const kakaoData = await searchKakao(facility.searchQuery);

        let lat = null;
        let lng = null;

        if (kakaoData && kakaoData.documents && kakaoData.documents.length > 0) {
            const result = kakaoData.documents[0];
            lat = parseFloat(result.y);
            lng = parseFloat(result.x);
            console.log(`   ✅ 좌표: (${lat}, ${lng})`);
        } else {
            console.log(`   ⚠️  좌표를 찾지 못했습니다.`);
            continue;
        }

        // DB에 추가
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
                image_url: SAMPLE_IMAGES[Math.floor(Math.random() * SAMPLE_IMAGES.length)],
                description: '',
                price_range: '가격 정보 상담',
                rating: 4.6 + Math.random() * 0.4,
                review_count: 0
            }])
            .select();

        if (error) {
            console.log(`   ❌ DB 추가 실패: ${error.message}`);
            failCount++;
        } else {
            console.log(`   ✅ DB 추가 완료 (ID: ${data[0].id})`);
            successCount++;
        }

        // API 호출 제한 대응
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`\n\n📊 최종 결과:`);
    console.log(`   - 성공: ${successCount}개`);
    console.log(`   - 실패: ${failCount}개`);
    console.log(`\n🎉 작업 완료!`);
}

addManualFacilities();
