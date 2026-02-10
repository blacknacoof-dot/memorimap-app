/**
 * 여전히 실패한 시설 목록 추출 (216개)
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
);

async function extractStillFailed() {
    // 로그에서 STILL FAILED ID 추출
    const log = fs.readFileSync('retry_failed_log.txt', 'utf-8');
    const failedIds: number[] = [];

    for (const line of log.split('\n')) {
        if (line.includes('[STILL FAILED]')) {
            const match = line.match(/ID:(\d+)/);
            if (match) failedIds.push(parseInt(match[1]));
        }
    }

    console.log(`총 ${failedIds.length}개 실패 시설 조회 중...`);

    // DB에서 상세 정보 조회
    const results: any[] = [];

    for (const id of failedIds) {
        const { data } = await supabase
            .from('memorial_spaces')
            .select('id, name, type, address, phone')
            .eq('id', id)
            .single();

        if (data) results.push(data);
    }

    // CSV 생성
    const typeMap: Record<string, string> = {
        'funeral': '장례식장',
        'charnel': '봉안당',
        'park': '추모공원',
        'complex': '복합시설',
        'pet': '동물장례'
    };

    const header = 'ID,구분,시설명,주소,전화번호\n';
    const rows = results.map(r =>
        `${r.id},${typeMap[r.type] || r.type},"${r.name}","${r.address || ''}","${r.phone || ''}"`
    ).join('\n');

    const csv = '\uFEFF' + header + rows;
    fs.writeFileSync('naver_unregistered_facilities.csv', csv);

    console.log(`✅ ${results.length}개 시설 목록 저장: naver_unregistered_facilities.csv`);
}

extractStillFailed();
