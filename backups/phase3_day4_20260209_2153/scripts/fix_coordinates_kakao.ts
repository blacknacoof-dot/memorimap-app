import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import axios from 'axios';

// Environment Setup
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const kakaoApiKey = process.env.VITE_KAKAO_REST_API_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase 설정 누락');
    process.exit(1);
}

if (!kakaoApiKey) {
    console.error('❌ Kakao API Key 누락 (.env.local에 VITE_KAKAO_REST_API_KEY 필요)');
    console.log('💡 Kakao Developers에서 REST API 키를 발급받아 설정해주세요.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const DELAY_MS = 100; // Kakao API rate limit (초당 10회)
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function geocodeAddress(address: string) {
    try {
        const response = await axios.get('https://dapi.kakao.com/v2/local/search/address.json', {
            params: { query: address },
            headers: { Authorization: `KakaoAK ${kakaoApiKey}` }
        });

        const result = response.data.documents[0];
        if (result) {
            return {
                lat: parseFloat(result.y),
                lng: parseFloat(result.x)
            };
        }
        return null;
    } catch (error: any) {
        console.error(`  ⚠️ Geocoding 오류: ${error.message}`);
        return null;
    }
}

async function fixCoordinates() {
    console.log('🚀 좌표 보정 작업 시작 (기본 좌표 37.5, 127.0 대상)...\n');

    // 1. Fetch facilities with default coordinates
    const { data: facilities, error } = await supabase
        .from('memorial_spaces')
        .select('id, name, address')
        .eq('lat', 37.5)
        .eq('lng', 127.0);

    if (error) {
        console.error('❌ Supabase 조회 오류:', error);
        return;
    }

    if (!facilities || facilities.length === 0) {
        console.log('✅ 보정이 필요한 시설이 없습니다.');
        return;
    }

    console.log(`📋 총 ${facilities.length}개 보정 대상 발견\n`);
    console.log('⏳ 작업 시작... (약 ${Math.ceil(facilities.length * DELAY_MS / 1000 / 60)}분 소요 예상)\n');

    let successCount = 0;
    let failCount = 0;
    let progress = 0;

    for (const facility of facilities) {
        progress++;

        // Progress indicator every 50 items
        if (progress % 50 === 0) {
            console.log(`\n📊 진행률: ${progress}/${facilities.length} (${Math.round(progress / facilities.length * 100)}%)\n`);
        }

        const coords = await geocodeAddress(facility.address);

        if (coords && coords.lat >= 33 && coords.lat <= 39 && coords.lng >= 124 && coords.lng <= 132) {
            const { error: updateError } = await supabase
                .from('memorial_spaces')
                .update({
                    lat: coords.lat,
                    lng: coords.lng
                })
                .eq('id', facility.id);

            if (updateError) {
                console.error(`  ❌ [${facility.name}] 업데이트 실패:`, updateError.message);
                failCount++;
            } else {
                console.log(`  ✅ [${facility.name}] ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`);
                successCount++;
            }
        } else {
            console.log(`  ⚠️ [${facility.name}] 좌표 변환 실패 (주소: ${facility.address})`);
            failCount++;
        }

        await sleep(DELAY_MS);
    }

    console.log(`\n🎉 작업 완료!`);
    console.log(`✅ 성공: ${successCount}개`);
    console.log(`❌ 실패: ${failCount}개`);
}

fixCoordinates();
