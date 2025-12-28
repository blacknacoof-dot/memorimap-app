/**
 * 최종 205개 실패 시설 목록 추출
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
);

async function extractFinalFailed() {
    // 최신 로그에서 STILL FAILED ID 추출
    const log = fs.readFileSync('retry_advanced_log.txt', 'utf-8');
    const failedIds: number[] = [];

    for (const line of log.split('\n')) {
        if (line.includes('[STILL FAILED]')) {
            const match = line.match(/ID:(\d+)/);
            if (match) failedIds.push(parseInt(match[1]));
        }
    }

    console.log(`총 ${failedIds.length}개 실패 시설 조회 중...`);

    const results: any[] = [];

    for (const id of failedIds) {
        const { data } = await supabase
            .from('memorial_spaces')
            .select('id, name, type, address, phone')
            .eq('id', id)
            .single();

        if (data) results.push(data);
    }

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
    fs.writeFileSync('final_unregistered_205.csv', csv);

    console.log(`✅ ${results.length}개 시설 목록 저장: final_unregistered_205.csv`);
}

extractFinalFailed();
