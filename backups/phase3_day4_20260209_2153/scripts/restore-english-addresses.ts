import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

// Load Env
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
);

async function main() {
    console.log('🚀 영문 주소 복구 작업 시작...');

    // 1. JSON 백업 파일 로드
    // google_enrichment_candidates_2025-12-27T10-45-14-977Z.json 파일명을 하드코딩하거나 찾음
    const backupFileName = 'google_enrichment_candidates_2025-12-27T10-45-14-977Z.json';
    const backupFile = path.join(process.cwd(), 'scripts', backupFileName);

    if (!fs.existsSync(backupFile)) {
        console.error(`❌ 백업 파일을 찾을 수 없습니다: ${backupFileName}`);
        return;
    }

    console.log(`📂 백업 파일 로드 중: ${backupFileName}`);
    const candidates = JSON.parse(fs.readFileSync(backupFile, 'utf-8'));

    // DB ID -> Original Address 맵 생성
    const addressMap = new Map<string, string>(); // Use string for ID just in case
    candidates.forEach((c: any) => {
        if (c.db_id && c.original_address) {
            addressMap.set(String(c.db_id), c.original_address);
        }
    });

    console.log(`📋 백업 데이터: ${addressMap.size}개 시설 정보 로드됨`);

    // 2. 현재 DB에서 영문 주소 의심 시설 조회
    // "South Korea" 가 포함된 주소 조회
    const { data: corruptedFacilities, error } = await supabase
        .from('memorial_spaces')
        .select('id, name, address')
        .ilike('address', '%South Korea%'); // 'KR' or 'South Korea'

    if (error || !corruptedFacilities) {
        console.error('❌ DB 조회 실패:', error);
        return;
    }

    if (corruptedFacilities.length === 0) {
        console.log('✅ 복구할 영문 주소가 발견되지 않았습니다.');
        return;
    }

    console.log(`⚠️ 복구 대상 발견: ${corruptedFacilities.length}개`);

    let successCount = 0;

    for (const facility of corruptedFacilities) {
        const originalAddress = addressMap.get(String(facility.id));

        console.log(`\n🔄 복구 시도: ${facility.name} (ID: ${facility.id})`);
        console.log(`   현재 주소: ${facility.address}`);

        if (originalAddress) {
            console.log(`   백업 주소: ${originalAddress}`);

            const { error: updateError } = await supabase
                .from('memorial_spaces')
                .update({ address: originalAddress })
                .eq('id', facility.id);

            if (updateError) {
                console.error(`   ❌ 업데이트 실패: ${updateError.message}`);
            } else {
                console.log(`   ✅ 복구 완료`);
                successCount++;
            }
        } else {
            console.error(`   ❌ 백업 파일에서 원본 주소를 찾을 수 없습니다.`);
        }
    }

    console.log(`\n✅ 총 ${successCount}개 시설 주소 복구 완료`);
}

main().catch(console.error);
