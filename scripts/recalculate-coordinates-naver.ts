/**
 * 전체 시설 좌표 재계산 스크립트 (네이버 API)
 * - 네이버 지역 검색 API로 좌표 확인
 * - TM128(네이버 좌표계) → WGS84(위경도) 변환
 */

import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!;
const naverClientId = process.env.NAVER_CLIENT_ID!;
const naverClientSecret = process.env.NAVER_CLIENT_SECRET!;

const supabase = createClient(supabaseUrl, supabaseKey);

// 네이버 TM128 좌표 → WGS84 변환 함수
// 네이버 mapx, mapy는 카텍(KATEC) 좌표계의 변형임
function tm128ToWgs84(x: number, y: number): { lat: number; lng: number } {
    // 네이버 좌표는 실제로 10^7 스케일된 값
    // mapx = 경도 * 10^7, mapy = 위도 * 10^7 (근사치)
    // 실제로는 더 복잡한 변환이 필요하지만, 네이버 API 결과는 대략 이 비율을 따름

    const lng = x / 10000000;
    const lat = y / 10000000;

    return { lat, lng };
}

interface NaverPlace {
    title: string;
    roadAddress: string;
    address: string;
    telephone: string;
    mapx: string;
    mapy: string;
}

async function searchNaver(query: string): Promise<NaverPlace | null> {
    try {
        const url = `https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(query)}&display=1`;
        const response = await axios.get(url, {
            headers: {
                'X-Naver-Client-Id': naverClientId,
                'X-Naver-Client-Secret': naverClientSecret
            }
        });

        if (response.data.items && response.data.items.length > 0) {
            return response.data.items[0];
        }
        return null;
    } catch (error) {
        return null;
    }
}

function cleanTitle(title: string): string {
    return title.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&');
}

async function recalculateWithNaver() {
    console.log('🗺️ 전체 시설 좌표 재계산 시작 (네이버 API)...\n');

    // 전체 시설 조회
    let allFacilities: any[] = [];
    let from = 0;
    const step = 1000;

    while (true) {
        const { data, error } = await supabase
            .from('memorial_spaces')
            .select('id, name, address, phone, lat, lng')
            .not('address', 'is', null)
            .range(from, from + step - 1)
            .order('id');

        if (error || !data || data.length === 0) break;
        allFacilities = allFacilities.concat(data);
        if (data.length < step) break;
        from += step;
    }

    console.log(`총 ${allFacilities.length}개 시설 처리 예정\n`);

    let updatedCount = 0;
    let phoneUpdatedCount = 0;
    let failedCount = 0;
    const logs: string[] = [];

    for (const facility of allFacilities) {
        // 지역명 + 이름으로 검색
        let region = '';
        if (facility.address) {
            const parts = facility.address.split(' ');
            if (parts.length >= 2) region = `${parts[0]} ${parts[1]}`;
        }

        const query = `${region} ${facility.name}`.trim();
        const item = await searchNaver(query);
        await new Promise(resolve => setTimeout(resolve, 80)); // Rate limit

        if (item) {
            const cleanName = cleanTitle(item.title);

            // 좌표 변환
            const mapx = parseInt(item.mapx);
            const mapy = parseInt(item.mapy);
            const { lat, lng } = tm128ToWgs84(mapx, mapy);

            // 좌표 차이 확인 (0.005 이상이면 업데이트, 약 500m)
            const latDiff = Math.abs((facility.lat || 0) - lat);
            const lngDiff = Math.abs((facility.lng || 0) - lng);

            const updates: any = {};
            let needUpdate = false;

            // 좌표 업데이트
            if (latDiff > 0.005 || lngDiff > 0.005 || !facility.lat || !facility.lng) {
                updates.lat = lat;
                updates.lng = lng;
                needUpdate = true;
            }

            // 전화번호 업데이트 (비어있으면)
            if (item.telephone && (!facility.phone || facility.phone === '')) {
                updates.phone = item.telephone;
                phoneUpdatedCount++;
                needUpdate = true;
            }

            if (needUpdate) {
                const { error: updateError } = await supabase
                    .from('memorial_spaces')
                    .update(updates)
                    .eq('id', facility.id);

                if (!updateError) {
                    updatedCount++;
                    const log = `[UPDATED] ID:${facility.id} ${facility.name} → ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                    console.log(log);
                    logs.push(log);
                } else {
                    failedCount++;
                }
            }
        } else {
            const log = `[NOT FOUND] ID:${facility.id} ${query}`;
            logs.push(log);
            failedCount++;
        }

        // 진행 상황
        const processed = updatedCount + failedCount;
        if (processed > 0 && processed % 100 === 0) {
            console.log(`... ${processed}개 처리됨`);
        }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`작업 완료!`);
    console.log(`  - 좌표 업데이트: ${updatedCount}개`);
    console.log(`  - 전화번호 추가: ${phoneUpdatedCount}개`);
    console.log(`  - 검색 실패: ${failedCount}개`);

    fs.writeFileSync('naver_geocode_log.txt', logs.join('\n'));
}

recalculateWithNaver().catch(console.error);
