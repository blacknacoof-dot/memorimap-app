import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import axios from 'axios';
import proj4 from 'proj4';

// Environment Setup
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const naverClientId = process.env.NAVER_CLIENT_ID || '';
const naverClientSecret = process.env.NAVER_CLIENT_SECRET || '';

if (!supabaseUrl || !supabaseKey || !naverClientId || !naverClientSecret) {
    console.error('❌ 필수 설정 누락 (.env.local 확인)');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Coordinate Conversion (TM128 -> WGS84)
// Naver Search API returns KATECH (TM128). We need WGS84 (Lat/Lng).
// Definition for KATECH (TM128) - Approximate for Korea
const tm128 = '+proj=tmerc +lat_0=38 +lon_0=128 +k=0.9999 +x_0=400000 +y_0=600000 +ellps=bessel +units=m +no_defs +towgs84=-115.80,474.99,674.11,1.16,-2.31,-1.63,6.43';
const wgs84 = '+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs';

function convertTm128ToWgs84(mapx: number, mapy: number) {
    const [lng, lat] = proj4(tm128, wgs84, [mapx, mapy]);
    return { lat, lng };
}

const DELAY_MS = 250; // Rate limit safety
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function fixCoordinates() {
    console.log('🚀 좌표 보정 작업 시작 (기본 좌표 37.5, 127.0 대상)...');

    // 1. Fetch facilities with default coordinates
    const { data: facilities, error } = await supabase
        .from('memorial_spaces')
        .select('id, name, address, phone')
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

    console.log(`📋 총 ${facilities.length}개 보정 대상 발견. 작업을 시작합니다.`);

    let successCount = 0;
    let failCount = 0;

    for (const facility of facilities) {
        const query = `${facility.address} ${facility.name}`;

        try {
            const response = await axios.get('https://openapi.naver.com/v1/search/local.json', {
                params: {
                    query: query,
                    display: 1,
                    sort: 'random'
                },
                headers: {
                    'X-Naver-Client-Id': naverClientId,
                    'X-Naver-Client-Secret': naverClientSecret
                }
            });

            const item = response.data.items[0];

            if (item) {
                // Naver returns integer strings for mapx/mapy.
                // NOTE: Naver Search API mapx/mapy might be scaled by 10, or just TM128?
                // Documentation says: "KATECH 좌표계의 X좌표, Y좌표" (TM128)
                // BUT historically Naver Search API returned coordinates that needed specific handling.
                // Let's assume standard TM128 first. If coordinates look weird (not in Korea lat/lng range), we adjust.

                // Wait, Naver Local Search API often returns integer coordinates that are not standard.
                // Let's try to interpret them.
                // Usually mapx: "309948", mapy: "552084" (example)
                // If they are KATECH, convert.

                const mapx = parseInt(item.mapx, 10);
                const mapy = parseInt(item.mapy, 10);

                if (mapx && mapy) {
                    const { lat, lng } = convertTm128ToWgs84(mapx, mapy);

                    // Validate range (Korea: Lat 33~39, Lng 124~132)
                    if (lat >= 33 && lat <= 39 && lng >= 124 && lng <= 132) {
                        const { error: updateError } = await supabase
                            .from('memorial_spaces')
                            .update({
                                lat: lat,
                                lng: lng
                            })
                            .eq('id', facility.id);

                        if (updateError) {
                            console.error(`  ❌ [${facility.name}] 업데이트 실패:`, updateError.message);
                            failCount++;
                        } else {
                            console.log(`  ✅ [${facility.name}] 보정 완료: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
                            successCount++;
                        }
                    } else {
                        console.warn(`  ⚠️ [${facility.name}] 변환 좌표 범위 오류 (${lat}, ${lng}) - 건너뜀`);
                        failCount++;
                    }
                } else {
                    console.log(`  ⚠️ [${facility.name}] 좌표 정보 없음 (Naver Response)`);
                    failCount++;
                }

            } else {
                console.log(`  ⚠️ [${facility.name}] 검색 결과 없음`);
                failCount++;
            }

        } catch (err: any) {
            console.error(`  ❌ [${facility.name}] API 오류:`, err.message);
            failCount++;
        }

        await sleep(DELAY_MS);
    }

    console.log(`\n🎉 작업 완료!`);
    console.log(`성공: ${successCount}`);
    console.log(`실패: ${failCount}`);
}

fixCoordinates();
