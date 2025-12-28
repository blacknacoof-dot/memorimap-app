/**
 * 전체 시설 좌표 재계산 스크립트
 * - 카카오 Geocoding API로 주소 → 좌표 변환
 * - 주소가 있는 모든 시설의 좌표를 정확하게 업데이트
 */

import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!;
const kakaoRestKey = process.env.VITE_KAKAO_REST_API_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

interface GeoResult {
    lat: number;
    lng: number;
    address: string;
}

async function geocodeAddress(address: string): Promise<GeoResult | null> {
    try {
        // 주소 검색 API
        const url = `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`;
        const response = await axios.get(url, {
            headers: { Authorization: `KakaoAK ${kakaoRestKey}` }
        });

        if (response.data.documents && response.data.documents.length > 0) {
            const doc = response.data.documents[0];
            return {
                lat: parseFloat(doc.y),
                lng: parseFloat(doc.x),
                address: doc.address_name
            };
        }
        return null;
    } catch (error) {
        return null;
    }
}

async function recalculateAllCoordinates() {
    console.log('🗺️ 전체 시설 좌표 재계산 시작...');
    console.log('카카오 Geocoding API 사용 (주소 → 좌표 변환)\n');

    // 1. 주소가 있는 모든 시설 조회
    let allFacilities: any[] = [];
    let from = 0;
    const step = 1000;

    while (true) {
        const { data, error } = await supabase
            .from('memorial_spaces')
            .select('id, name, address, lat, lng')
            .not('address', 'is', null)
            .range(from, from + step - 1)
            .order('id');

        if (error || !data || data.length === 0) break;
        allFacilities = allFacilities.concat(data);
        if (data.length < step) break;
        from += step;
    }

    console.log(`총 ${allFacilities.length}개 시설 처리 예정 (주소 있는 시설만)\n`);

    let updatedCount = 0;
    let failedCount = 0;
    let skippedCount = 0;
    const logs: string[] = [];

    for (const facility of allFacilities) {
        if (!facility.address || facility.address.trim() === '') {
            skippedCount++;
            continue;
        }

        const result = await geocodeAddress(facility.address);
        await new Promise(resolve => setTimeout(resolve, 50)); // Rate limit (초당 20회)

        if (result) {
            // 좌표 변경 여부 확인 (0.001 이상 차이나면 업데이트)
            const latDiff = Math.abs((facility.lat || 0) - result.lat);
            const lngDiff = Math.abs((facility.lng || 0) - result.lng);

            if (latDiff > 0.001 || lngDiff > 0.001 || !facility.lat || !facility.lng) {
                const { error: updateError } = await supabase
                    .from('memorial_spaces')
                    .update({ lat: result.lat, lng: result.lng })
                    .eq('id', facility.id);

                if (!updateError) {
                    updatedCount++;
                    const log = `[UPDATED] ID:${facility.id} ${facility.name} | ${facility.lat?.toFixed(4)},${facility.lng?.toFixed(4)} → ${result.lat.toFixed(4)},${result.lng.toFixed(4)}`;
                    console.log(log);
                    logs.push(log);
                } else {
                    failedCount++;
                }
            } else {
                skippedCount++;
            }
        } else {
            const log = `[GEO FAIL] ID:${facility.id} ${facility.name} | ${facility.address}`;
            console.log(log);
            logs.push(log);
            failedCount++;
        }

        // 진행 상황 (500개 단위)
        const processed = updatedCount + failedCount + skippedCount;
        if (processed % 500 === 0) {
            console.log(`... ${processed}개 처리됨 (업데이트: ${updatedCount})`);
        }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`작업 완료!`);
    console.log(`  - 업데이트: ${updatedCount}개`);
    console.log(`  - 스킵 (변경없음): ${skippedCount}개`);
    console.log(`  - 실패: ${failedCount}개`);

    fs.writeFileSync('geocode_log.txt', logs.join('\n'));
    console.log('\n로그 저장됨: geocode_log.txt');
}

recalculateAllCoordinates().catch(console.error);
