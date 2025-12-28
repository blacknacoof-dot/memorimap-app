import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
);

// 잘못된 price_info가 있는 시설 ID 목록
const mismatchedIds = [
    '11624456',   // 서호추모공원
    '1673724468', // 유토피아추모관
    '2114483229', // 증촌추모공원
    '599989601',  // 남도추모공원
    '306141203',  // 화성함백산추모공원
    '223357101',  // 남산추모공원
    '57994546',   // 대전추모공원
    '1664026258', // 남원시추모공원
    '702270295',  // 결초보은 추모공원
    '17',         // 천안공원묘원
    '17646267',   // 동화추모공원
    '11387091',   // 우리추모공원
    '5',          // 유토피아 추모관
    '12858334',   // 예원추모관
    '27557465',   // 평화추모공원
    '1632579326', // 안동추모공원
    '855337976',  // 구미추모공원
    '23939144',   // 파주추모공원
    '11175267',   // 유토피아추모관
    '26472370',   // 합천추모공원
    '1301882203', // 여주추모공원
    '1496969061', // 여주세종추모공원
    '1935778542', // 무궁화추모공원
    '844224340',  // 일산추모공원
    '1889924013', // 부활동산 추모공원
    '12804317',   // 지상낙원추모공원
    '25620470',   // 유토피아추모관 신관
    '394506870',  // 효천추모공원
    '2026804810', // 강원원주 추모공원
    '25739096',   // 청주추모공원
    '10845856',   // 안성추모공원
    '1356749326', // 곤지암추모공원
    '201737813',  // 우성추모공원
    '1260795506', // 용문사추모공원
    '15251551',   // 서울추모공원
];

async function cleanMismatchedPriceInfo() {
    console.log('🧹 잘못된 price_info 데이터 정리 시작...\n');
    console.log('='.repeat(60) + '\n');
    console.log(`📋 정리 대상: ${mismatchedIds.length}개 시설\n`);

    const results = {
        success: 0,
        failed: 0,
        details: [] as { id: string; name: string; status: string }[]
    };

    for (const id of mismatchedIds) {
        // 먼저 시설 정보 조회
        const { data: facility, error: fetchError } = await supabase
            .from('memorial_spaces')
            .select('id, name, type, price_info')
            .eq('id', id)
            .single();

        if (fetchError || !facility) {
            console.log(`❌ ID ${id}: 시설을 찾을 수 없음`);
            results.failed++;
            results.details.push({ id, name: '알 수 없음', status: '시설 없음' });
            continue;
        }

        // price_info를 null로 설정 (잘못된 데이터 제거)
        const { error: updateError } = await supabase
            .from('memorial_spaces')
            .update({ price_info: null })
            .eq('id', id);

        if (updateError) {
            console.log(`❌ ${facility.name}: 업데이트 실패 - ${updateError.message}`);
            results.failed++;
            results.details.push({ id, name: facility.name, status: `실패: ${updateError.message}` });
        } else {
            console.log(`✅ ${facility.name}: price_info 제거 완료`);
            results.success++;
            results.details.push({ id, name: facility.name, status: '성공' });
        }
    }

    // 결과 요약
    console.log('\n' + '='.repeat(60));
    console.log('📊 정리 완료 요약');
    console.log('='.repeat(60));
    console.log(`✅ 성공: ${results.success}개`);
    console.log(`❌ 실패: ${results.failed}개`);
    console.log('='.repeat(60));

    // 결과 파일 저장
    const resultPath = path.resolve(process.cwd(), 'scripts/price_info_cleanup_result.json');
    fs.writeFileSync(resultPath, JSON.stringify(results, null, 2), 'utf-8');
    console.log(`\n✅ 결과 저장: scripts/price_info_cleanup_result.json`);
}

cleanMismatchedPriceInfo();
