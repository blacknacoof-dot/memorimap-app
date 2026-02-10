/**
 * 216개 실패 시설 추가 재시도
 * - 의료재단, 학교법인, 재단법인, (묘지), (풍무) 등 제거
 */

import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!;
const naverClientId = process.env.VITE_NAVER_CLIENT_ID!;
const naverClientSecret = process.env.VITE_NAVER_CLIENT_SECRET!;

const supabase = createClient(supabaseUrl, supabaseKey);

// 이름 정제: 더 많은 키워드 제거
function cleanNameAdvanced(name: string): string {
    return name
        .replace(/의료재단\s*/g, '')
        .replace(/학교법인\s*/g, '')
        .replace(/재단법인\s*/g, '')
        .replace(/사회복지법인\s*/g, '')
        .replace(/종교법인\s*/g, '')
        .replace(/\(주\)/g, '')
        .replace(/주식회사\s*/g, '')
        .replace(/\(유\)/g, '')
        .replace(/\(재\)/g, '')
        .replace(/\s*\([^)]*\)/g, '')  // 모든 괄호 내용 제거
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

async function retryWithAdvancedClean() {
    console.log('🔄 216개 실패 시설 추가 재시도 (키워드 제거)...\n');

    // 실패 목록 로드
    const log = fs.readFileSync('retry_failed_log.txt', 'utf-8');
    const failedIds: number[] = [];

    for (const line of log.split('\n')) {
        if (line.includes('[STILL FAILED]')) {
            const match = line.match(/ID:(\d+)/);
            if (match) failedIds.push(parseInt(match[1]));
        }
    }

    console.log(`실패 시설 ${failedIds.length}개 재시도 예정\n`);

    let updatedCount = 0;
    let stillFailedCount = 0;
    const logs: string[] = [];

    for (const id of failedIds) {
        const { data: facility } = await supabase
            .from('memorial_spaces')
            .select('id, name, address, phone, lat, lng')
            .eq('id', id)
            .single();

        if (!facility) continue;

        // 이름 정제 (고급)
        const cleanedName = cleanNameAdvanced(facility.name);

        // 검색
        const item = await searchNaver(cleanedName);
        await new Promise(resolve => setTimeout(resolve, 80));

        if (item) {
            const mapx = parseInt(item.mapx);
            const mapy = parseInt(item.mapy);
            const { lat, lng } = tm128ToWgs84(mapx, mapy);

            const updates: any = {
                address: item.roadAddress || item.address,
                lat,
                lng
            };

            if (item.telephone) {
                updates.phone = item.telephone;
            }

            const { error } = await supabase
                .from('memorial_spaces')
                .update(updates)
                .eq('id', id);

            if (!error) {
                updatedCount++;
                const log = `[UPDATED] ID:${id} ${facility.name} → ${cleanedName} → ${item.roadAddress}`;
                console.log(log);
                logs.push(log);
            }
        } else {
            stillFailedCount++;
            logs.push(`[STILL FAILED] ID:${id} ${facility.name} → ${cleanedName}`);
        }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`작업 완료!`);
    console.log(`  - 업데이트 성공: ${updatedCount}개`);
    console.log(`  - 여전히 실패: ${stillFailedCount}개`);

    fs.writeFileSync('retry_advanced_log.txt', logs.join('\n'));
}

retryWithAdvancedClean().catch(console.error);
