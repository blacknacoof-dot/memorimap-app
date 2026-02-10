import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
);

const naverClientId = process.env.VITE_NAVER_CLIENT_ID!;
const naverClientSecret = process.env.VITE_NAVER_CLIENT_SECRET!;

async function investigate() {
    // 1. DB에서 서라벌 검색
    console.log('=== DB 조회 ===');
    const { data } = await supabase
        .from('memorial_spaces')
        .select('id, name, address, phone, lat, lng')
        .ilike('name', '%서라벌%');

    console.log(data);

    if (data && data.length > 0) {
        const facility = data[0];

        // 2. 네이버 검색
        console.log('\n=== 네이버 API 검색 ===');

        // 원래 스크립트에서 사용한 검색어
        let region = '';
        if (facility.address) {
            const parts = facility.address.split(' ');
            if (parts.length >= 2) region = `${parts[0]} ${parts[1]}`;
        }
        const originalQuery = `${region} ${facility.name}`.trim();
        console.log('기존 검색어:', originalQuery);

        const url = `https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(originalQuery)}&display=3`;
        const response = await axios.get(url, {
            headers: {
                'X-Naver-Client-Id': naverClientId,
                'X-Naver-Client-Secret': naverClientSecret
            }
        });

        console.log('검색 결과:');
        response.data.items.forEach((item: any, i: number) => {
            console.log(`[${i + 1}] ${item.title.replace(/<[^>]*>/g, '')} | ${item.roadAddress} | ${item.telephone}`);
        });

        // 3. 직접 이름으로만 검색
        console.log('\n=== 이름만으로 검색 ===');
        const directQuery = '서라벌공원묘원';
        const url2 = `https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(directQuery)}&display=3`;
        const response2 = await axios.get(url2, {
            headers: {
                'X-Naver-Client-Id': naverClientId,
                'X-Naver-Client-Secret': naverClientSecret
            }
        });

        console.log('검색 결과:');
        response2.data.items.forEach((item: any, i: number) => {
            console.log(`[${i + 1}] ${item.title.replace(/<[^>]*>/g, '')} | ${item.roadAddress} | ${item.telephone}`);
        });
    }
}

investigate();
