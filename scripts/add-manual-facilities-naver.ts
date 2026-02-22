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

const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID || '';
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET || '';

// 네이버 검색 API 호출
async function searchNaver(query: string): Promise<any> {
    try {
        const response = await axios.get('https://openapi.naver.com/v1/search/local.json', {
            params: {
                query: query,
                display: 5,
                start: 1,
                sort: 'random'
            },
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

// 샘플 이미지
const SAMPLE_IMAGES = [
    'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800',
    'https://images.unsplash.com/photo-1519167758481-83f29da8c2b7?w=800'
];

async function addManualFacilitiesNaver() {
    console.log("🏥 네이버 API로 수동 시설 추가 시작...\n");

    const facilities = [
        {
            name: '수원덕산병원장례식장',
            address: '경기도 수원시 권선구 서부로 1674 (고색동)',
            phone: '031-686-2900',
            searchQuery: '수원덕산병원'
        },
        {
            name: '동두천중앙성모병원장례식장',
            address: '경기도 동두천시 동광로 53',
            phone: '031-863-0550',
            searchQuery: '동두천중앙성모병원'
        }
    ];

    let successCount = 0;

    for (const facility of facilities) {
        console.log(`\n📍 처리 중: ${facility.name}`);

        // 네이버 API로 좌표 검색
        const naverData = await searchNaver(facility.searchQuery);

        let lat = null;
        let lng = null;

        if (naverData && naverData.items && naverData.items.length > 0) {
            const result = naverData.items[0];
            lat = result.mapy ? parseFloat(result.mapy) / 10000000 : null;
            lng = result.mapx ? parseFloat(result.mapx) / 10000000 : null;
            console.log(`   ✅ 좌표: (${lat}, ${lng})`);
        } else {
            console.log(`   ⚠️  좌표를 찾지 못했습니다. 건너뜁니다.`);
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
        } else {
            console.log(`   ✅ DB 추가 완료 (ID: ${data[0].id})`);
            successCount++;
        }

        // API 호출 제한 대응
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`\n\n📊 최종 결과:`);
    console.log(`   - 성공: ${successCount}개`);
    console.log(`\n🎉 작업 완료!`);
}

addManualFacilitiesNaver();
