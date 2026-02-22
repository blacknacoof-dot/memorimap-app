/**
 * 실패 시설 재시도 스크립트
 * - 이름에서 괄호 안 내용 제거 후 재검색
 * - 주소/전화/좌표 업데이트
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

// 이름 정제: 괄호 안 내용 제거
function cleanName(name: string): string {
    return name
        .replace(/\s*\([^)]*\)/g, '')  // (불교), (천주교) 등 제거
        .replace(/\s*\[[^\]]*\]/g, '') // [xxx] 제거
        .trim();
}

// TM128 → WGS84 변환
function tm128ToWgs84(x: number, y: number): { lat: number; lng: number } {
    return { lat: y / 10000000, lng: x / 10000000 };
}

async function searchNaver(query: string): Promise<any | null> {
    try {
        const url = `https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(query)}&display=1`;
        const response = await axios.get(url, {
            headers: {
                'X-Naver-Client-Id': naverClientId,
                'X-Naver-Client-Secret': naverClientSecret
            }
        });
        return response.data.items?.[0] || null;
    } catch {
        return null;
    }
}

async function retryFailedFacilities() {
    console.log('🔄 실패 시설 재시도 시작 (괄호 제거 검색)...\n');

    // 실패 목록 로드
    const failedLog = fs.readFileSync('sync_naver_log.txt', 'utf-8');
    const failedIds: number[] = [];

    for (const line of failedLog.split('\n')) {
        if (line.includes('[NOT FOUND]') || line.includes('[SKIP]')) {
            const match = line.match(/ID:(\d+)/);
            if (match) failedIds.push(parseInt(match[1]));
        }
    }

    console.log(`실패 시설 ${failedIds.length}개 재시도 예정\n`);

    let updatedCount = 0;
    let stillFailedCount = 0;
    const logs: string[] = [];

    for (const id of failedIds) {
        // DB에서 시설 조회
        const { data: facility } = await supabase
            .from('memorial_spaces')
            .select('id, name, address, phone, lat, lng')
            .eq('id', id)
            .single();

        if (!facility) continue;

        // 이름 정제
        const cleanedName = cleanName(facility.name);

        // 검색 (이름만으로)
        const item = await searchNaver(cleanedName);
        await new Promise(resolve => setTimeout(resolve, 80));

        if (item) {
            const naverName = item.title.replace(/<[^>]*>/g, '');
            const mapx = parseInt(item.mapx);
            const mapy = parseInt(item.mapy);
            const { lat, lng } = tm128ToWgs84(mapx, mapy);

            const updates: any = {
                address: item.roadAddress || item.address,
                lat,
                lng
            };

            // 전화번호가 있으면 업데이트
            if (item.telephone) {
                updates.phone = item.telephone;
            }

            const { error } = await supabase
                .from('memorial_spaces')
                .update(updates)
                .eq('id', id);

            if (!error) {
                updatedCount++;
                const log = `[UPDATED] ID:${id} ${facility.name} → ${item.roadAddress}`;
                console.log(log);
                logs.push(log);
            }
        } else {
            stillFailedCount++;
            logs.push(`[STILL FAILED] ID:${id} ${facility.name}`);
        }

        if ((updatedCount + stillFailedCount) % 50 === 0) {
            console.log(`... ${updatedCount + stillFailedCount}개 처리됨`);
        }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`작업 완료!`);
    console.log(`  - 업데이트 성공: ${updatedCount}개`);
    console.log(`  - 여전히 실패: ${stillFailedCount}개`);

    fs.writeFileSync('retry_failed_log.txt', logs.join('\n'));
}

retryFailedFacilities().catch(console.error);
