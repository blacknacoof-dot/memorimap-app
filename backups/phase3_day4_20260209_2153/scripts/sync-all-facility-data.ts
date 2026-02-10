/**
 * 전체 시설 데이터 동기화 스크립트
 * - 모든 시설(2,219개)에 대해 Kakao API 검색 실행
 * - 주소(도로명), 전화번호, 좌표, 명칭을 최신 데이터로 업데이트
 */

import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const kakaoRestKey = process.env.VITE_KAKAO_REST_API_KEY!;

// 서비스 롤 키가 있다면 사용하는 것이 좋음 (없으면 ANON 키로 시도하되 RLS 유의)
// 여기서는 ANON 키로 시도.

const supabase = createClient(supabaseUrl, supabaseKey);

// Kakao API 응답 타입
interface KakaoPlace {
    id: string;
    place_name: string;
    road_address_name: string;
    address_name: string;
    phone: string;
    x: string; // lng
    y: string; // lat
    place_url: string;
}

// 거리 유사도 (Levenshtein Distance)
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

async function searchKakao(query: string): Promise<KakaoPlace | null> {
    try {
        const url = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}&size=3`;
        const response = await axios.get(url, {
            headers: { Authorization: `KakaoAK ${kakaoRestKey}` }
        });

        if (response.data.documents && response.data.documents.length > 0) {
            return response.data.documents[0];
        }
        return null;
    } catch (error) {
        console.error(`Kakao API Error for ${query}:`, error);
        return null;
    }
}

async function syncAllData() {
    console.log('🔄 전체 시설 데이터 동기화 시작...');

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

    // 2. 순차 처리 (Rate Limit 고려하여 딜레이)
    for (const facility of allFacilities) {
        // 검색어: 이름 (주소는 너무 다를 수 있으므로 이름으로 먼저 검색)
        // 지역명(시/군/구)을 붙이면 더 정확할 수 있음.
        const region = facility.address ? facility.address.split(' ')[0] + ' ' + (facility.address.split(' ')[1] || '') : '';
        const query = `${region} ${facility.name}`.trim();

        // API 호출
        const kakaoData = await searchKakao(query);
        await new Promise(resolve => setTimeout(resolve, 100)); // 0.1초 딜레이

        if (kakaoData) {
            // 이름 유사도 체크 (엉뚱한 곳 매칭 방지)
            const dist = levenshtein(facility.name.replace(/ /g, ''), kakaoData.place_name.replace(/ /g, ''));
            const maxLen = Math.max(facility.name.length, kakaoData.place_name.length);
            const similarity = 1 - (dist / maxLen);

            if (similarity > 0.4) { // 40% 이상 유사하면 업데이트 (비교적 관대하게, 주소 보정 목적)
                // 업데이트 실행
                const { error: updateError } = await supabase
                    .from('memorial_spaces')
                    .update({
                        name: kakaoData.place_name,        // 명칭 동기화
                        address: kakaoData.road_address_name || kakaoData.address_name, // 도로명 우선
                        phone: kakaoData.phone || facility.phone,
                        lat: parseFloat(kakaoData.y),
                        lng: parseFloat(kakaoData.x),
                        // kakao_id 같은 것도 저장하면 좋지만 스키마에 없음
                    })
                    .eq('id', facility.id);

                if (!updateError) {
                    updatedCount++;
                    const log = `[UPDATED] ID:${facility.id} ${facility.name} -> ${kakaoData.place_name} / ${kakaoData.road_address_name}`;
                    console.log(log);
                    logs.push(log);
                } else {
                    failedCount++;
                    console.error(`[DB ERROR] ID:${facility.id}`, updateError);
                }
            } else {
                console.log(`[SKIP] 유사도 낮음: ${facility.name} vs ${kakaoData.place_name} (${similarity.toFixed(2)})`);
                logs.push(`[SKIP] ID:${facility.id} ${facility.name} vs ${kakaoData.place_name}`);
            }
        } else {
            console.log(`[NOT FOUND] ${query}`);
            logs.push(`[NOT FOUND] ID:${facility.id} ${query}`);
        }

        // 진행 상황 표시 (100개 단위)
        if (updatedCount % 100 === 0 && updatedCount > 0) {
            console.log(`... ${updatedCount}개 업데이트 완료`);
        }
    }

    console.log('='.repeat(30));
    console.log(`작업 완료. 업데이트: ${updatedCount}, 실패(DB): ${failedCount}`);

    fs.writeFileSync('sync_log.txt', logs.join('\n'));
}

syncAllData().catch(console.error);
