/**
 * 전체 시설 데이터 네이버 API 동기화 스크립트
 * - 모든 시설(2,219개)에 대해 네이버 지역 검색 API 실행
 * - 주소(도로명), 전화번호, 좌표(TM128 -> LatLng 변환 필요), 명칭을 최신 데이터로 업데이트
 */

import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
// Service Role Key 사용 (RLS 우회)
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!;
const naverClientId = process.env.VITE_NAVER_CLIENT_ID!;
const naverClientSecret = process.env.VITE_NAVER_CLIENT_SECRET!;

const supabase = createClient(supabaseUrl, supabaseKey);

interface NaverPlace {
    title: string;
    link: string;
    category: string;
    description: string;
    telephone: string;
    address: string;
    roadAddress: string;
    mapx: string;
    mapy: string;
}

// 거리 유사도 (Levenshtein Distance) - HTML 태그 제거 후 비교
function levenshtein(a: string, b: string): number {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) == a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    return matrix[b.length][a.length];
}

function cleanTitle(title: string): string {
    return title.replace(/<[^>]*>?/gm, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}

// 네이버 좌표계 (KATECH / TM128) -> WGS84 (Lat, Lng) 변환이 필요한데,
// 검색 API 결과 (mapx, mapy)는 KATECH 좌표계임.
// 변환 로직이 복잡하므로, 일단 주소만 업데이트하거나, 
// 네이버 지도 API (Geocoding)를 써야 정확함.
// 하지만 검색 API만으로는 정확한 위경도를 얻기 어려울 수 있음 (GeoTrans 필요).
// -> 일단 주소와 전화번호, 명칭만 업데이트하고 좌표는 기존 유지 (혹은 주소가 많이 바뀌면 좌표 신뢰도 하락)
// -> 사용자 요청은 "주소, 전화번호, 명칭"이므로 여기에 집중.

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
        console.error(`Naver API Error for ${query}:`, error);
        return null;
    }
}

async function syncAllData() {
    console.log('🔄 전체 시설 데이터 네이버 동기화 시작 (Service Role Key)...');

    // 1. 전체 시설 조회
    let allFacilities: any[] = [];
    let from = 0;
    const step = 1000;

    while (true) {
        const { data, error } = await supabase
            .from('memorial_spaces')
            .select('*')
            .range(from, from + step - 1)
            .order('id');

        if (error || !data || data.length === 0) break;
        allFacilities = allFacilities.concat(data);
        if (data.length < step) break;
        from += step;
    }

    console.log(`총 ${allFacilities.length}개 시설 처리 예정.`);

    let updatedCount = 0;
    let failedCount = 0;
    const logs: string[] = [];

    // 2. 순차 처리
    for (const facility of allFacilities) {
        // 검색어: 지역명 + 이름
        let region = '';
        if (facility.address) {
            const parts = facility.address.split(' ');
            if (parts.length >= 2) region = `${parts[0]} ${parts[1]}`; // 시/도 + 시/군/구
        }

        const query = `${region} ${facility.name}`.trim();

        // API 호출
        const item = await searchNaver(query);
        await new Promise(resolve => setTimeout(resolve, 80)); // Rate Limit (초당 10회 안전)

        if (item) {
            const cleanName = cleanTitle(item.title);

            // 유사도 체크
            const dist = levenshtein(facility.name.replace(/ /g, ''), cleanName.replace(/ /g, ''));
            const maxLen = Math.max(facility.name.length, cleanName.length);
            const similarity = 1 - (dist / maxLen);

            if (similarity > 0.3) { // 30% 이상 유사 (조금 더 관대하게)
                const updates: any = {
                    name: cleanName,
                    address: item.roadAddress || item.address, // 도로명 우선
                    phone: item.telephone || facility.phone,
                };

                // 좌표 업데이트는 신중해야 함 (mapx, mapy가 TM128임).
                // 일단 업데이트 안 함.

                const { error: updateError } = await supabase
                    .from('memorial_spaces')
                    .update(updates)
                    .eq('id', facility.id);

                if (!updateError) {
                    updatedCount++;
                    const log = `[UPDATED] ID:${facility.id} ${facility.name} -> ${cleanName} / ${updates.address}`;
                    console.log(log);
                    logs.push(log);
                } else {
                    failedCount++;
                    console.error(`[DB ERROR] ID:${facility.id}`, updateError);
                }
            } else {
                console.log(`[SKIP] 유사도 낮음: ${facility.name} vs ${cleanName} (${similarity.toFixed(2)})`);
                logs.push(`[SKIP] ID:${facility.id} ${facility.name} vs ${cleanName}`);
            }
        } else {
            console.log(`[NOT FOUND] ${query}`);
            logs.push(`[NOT FOUND] ID:${facility.id} ${query}`);
        }

        if (updatedCount % 100 === 0 && updatedCount > 0) {
            console.log(`... ${updatedCount}개 업데이트 완료`);
        }
    }

    console.log('='.repeat(30));
    console.log(`작업 완료. 업데이트: ${updatedCount}, 실패(DB): ${failedCount}`);

    fs.writeFileSync('sync_naver_log.txt', logs.join('\n'));
}

syncAllData().catch(console.error);
