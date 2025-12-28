/**
 * 시안 가족추모공원 데이터 수정
 * - 카카오 Geocoding API로 정확한 좌표 조회
 * - 전화번호도 1577-5080으로 수정
 */

import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!;
const kakaoRestKey = process.env.VITE_KAKAO_REST_API_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixSianPark() {
    const address = '경기도 광주시 오포안로 17';

    console.log('1. 카카오 Geocoding API로 좌표 조회...');

    // 카카오 주소 검색 API
    const geoUrl = `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`;
    const geoResponse = await axios.get(geoUrl, {
        headers: { Authorization: `KakaoAK ${kakaoRestKey}` }
    });

    if (geoResponse.data.documents.length === 0) {
        console.log('주소 검색 실패, 키워드 검색 시도...');

        // 키워드 검색으로 대체
        const keywordUrl = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent('시안 가족추모공원')}`;
        const keywordResponse = await axios.get(keywordUrl, {
            headers: { Authorization: `KakaoAK ${kakaoRestKey}` }
        });

        if (keywordResponse.data.documents.length > 0) {
            const place = keywordResponse.data.documents[0];
            console.log('\n키워드 검색 결과:');
            console.log(`이름: ${place.place_name}`);
            console.log(`주소: ${place.road_address_name || place.address_name}`);
            console.log(`전화: ${place.phone}`);
            console.log(`좌표: ${place.y}, ${place.x}`);

            // DB 업데이트
            console.log('\n2. DB 업데이트 중...');
            const { error } = await supabase
                .from('memorial_spaces')
                .update({
                    lat: parseFloat(place.y),
                    lng: parseFloat(place.x),
                    phone: '1577-5080' // 네이버 지도 기준 전화번호
                })
                .eq('id', 2);

            if (error) {
                console.error('DB 업데이트 실패:', error);
            } else {
                console.log('✅ 업데이트 완료!');
                console.log(`   새 좌표: ${place.y}, ${place.x}`);
                console.log(`   새 전화: 1577-5080`);
            }
        }
    } else {
        const doc = geoResponse.data.documents[0];
        console.log('\n주소 검색 결과:');
        console.log(`주소: ${doc.address_name}`);
        console.log(`좌표: ${doc.y}, ${doc.x}`);

        // DB 업데이트
        console.log('\n2. DB 업데이트 중...');
        const { error } = await supabase
            .from('memorial_spaces')
            .update({
                lat: parseFloat(doc.y),
                lng: parseFloat(doc.x),
                phone: '1577-5080'
            })
            .eq('id', 2);

        if (error) {
            console.error('DB 업데이트 실패:', error);
        } else {
            console.log('✅ 업데이트 완료!');
            console.log(`   새 좌표: ${doc.y}, ${doc.x}`);
            console.log(`   새 전화: 1577-5080`);
        }
    }

    // 확인
    console.log('\n3. 업데이트 후 확인...');
    const { data } = await supabase
        .from('memorial_spaces')
        .select('id, name, address, phone, lat, lng')
        .eq('id', 2)
        .single();

    console.log(data);
}

fixSianPark().catch(console.error);
