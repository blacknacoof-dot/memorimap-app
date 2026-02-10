import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import axios from 'axios';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
);

const KAKAO_REST_KEY = process.env.VITE_KAKAO_REST_API_KEY || '';

interface FacilityWithEnglishAddress {
    id: number;
    name: string;
    address: string;
    lat: number;
    lng: number;
}

// 좌표로 한글 주소 가져오기 (Kakao Reverse Geocoding)
async function getKoreanAddress(lat: number, lng: number): Promise<string | null> {
    try {
        const response = await axios.get('https://dapi.kakao.com/v2/local/geo/coord2address.json', {
            params: {
                x: lng, // 경도
                y: lat  // 위도
            },
            headers: {
                Authorization: `KakaoAK ${KAKAO_REST_KEY}`
            }
        });

        if (response.data.documents && response.data.documents.length > 0) {
            const doc = response.data.documents[0];
            // 도로명 주소 우선, 없으면 지번 주소
            return doc.road_address?.address_name || doc.address?.address_name || null;
        }
        return null;
    } catch (error: any) {
        console.error(`❌ Kakao API Error: ${error.message}`);
        return null;
    }
}

async function convertEnglishAddresses() {
    console.log('🌐 영문 주소 → 한글 주소 변환 시작...\n');

    if (!KAKAO_REST_KEY) {
        console.error('❌ VITE_KAKAO_REST_API_KEY가 설정되지 않았습니다.');
        return;
    }

    // 1. 영문 주소가 있는 시설 찾기
    const { data: allFacilities, error } = await supabase
        .from('memorial_spaces')
        .select('id, name, address, lat, lng')
        .limit(5000);

    if (error) {
        console.error('❌ DB 조회 실패:', error.message);
        return;
    }

    // 영문 주소 패턴 (South Korea, Korea, KR 등으로 끝남)
    const englishPattern = /South Korea|Korea|KR$/i;
    const englishAddressFacilities = allFacilities?.filter(f =>
        f.address && englishPattern.test(f.address)
    ) as FacilityWithEnglishAddress[];

    console.log(`📋 영문 주소 시설: ${englishAddressFacilities.length}개\n`);

    if (englishAddressFacilities.length === 0) {
        console.log('✅ 영문 주소가 있는 시설이 없습니다.');
        return;
    }

    // 2. 각 시설의 주소 변환
    let converted = 0;
    let failed = 0;
    const conversionLog: any[] = [];

    for (let i = 0; i < englishAddressFacilities.length; i++) {
        const facility = englishAddressFacilities[i];

        if (!facility.lat || !facility.lng) {
            console.log(`⏭️  [${i + 1}/${englishAddressFacilities.length}] ${facility.name}: 좌표 없음`);
            failed++;
            continue;
        }

        // Kakao API로 한글 주소 가져오기
        const koreanAddress = await getKoreanAddress(facility.lat, facility.lng);

        if (koreanAddress) {
            // DB 업데이트
            const { error: updateError } = await supabase
                .from('memorial_spaces')
                .update({ address: koreanAddress })
                .eq('id', facility.id);

            if (updateError) {
                console.error(`❌ [${i + 1}/${englishAddressFacilities.length}] ${facility.name}: 업데이트 실패`);
                failed++;
            } else {
                converted++;
                conversionLog.push({
                    id: facility.id,
                    name: facility.name,
                    oldAddress: facility.address,
                    newAddress: koreanAddress
                });

                if (converted % 10 === 0) {
                    console.log(`✅ ${converted}개 변환 완료...`);
                }
            }
        } else {
            console.log(`⚠️  [${i + 1}/${englishAddressFacilities.length}] ${facility.name}: 한글 주소 조회 실패`);
            failed++;
        }

        // API 제한 대응 (100ms 딜레이)
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    // 3. 결과 출력
    console.log('\n' + '='.repeat(50));
    console.log('📊 영문 주소 변환 완료');
    console.log('='.repeat(50));
    console.log(`✅ 변환 성공: ${converted}개`);
    console.log(`❌ 변환 실패: ${failed}개`);

    // 4. 로그 저장
    const logPath = path.resolve(process.cwd(), 'scripts/address_conversion_log.json');
    fs.writeFileSync(logPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        totalProcessed: englishAddressFacilities.length,
        converted,
        failed,
        conversions: conversionLog
    }, null, 2));
    console.log(`\n📝 변환 로그 저장: ${logPath}`);
}

convertEnglishAddresses();
