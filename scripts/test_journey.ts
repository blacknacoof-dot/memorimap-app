import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTest() {
    console.log('--- 나의 여정 기능 테스트 시작 ---');

    // 1. 테스트용 데이터 준비 (사용자 및 시설 조회)
    const { data: facilities } = await supabase.from('facilities').select('id, name').limit(1);
    const { data: users } = await supabase.from('profiles').select('id').limit(1);

    if (!facilities?.length || !users?.length) {
        console.error('테스트에 필요한 데이터(시설 또는 유저)가 없습니다.');
        return;
    }

    const facilityId = facilities[0].id;
    const facilityName = facilities[0].name;
    const userId = users[0].id;

    console.log(`테스트 타겟: 유저(${userId}), 시설(${facilityName}, ${facilityId})`);

    // 2. 기존 로그 개수 확인
    const { count: beforeCount } = await supabase
        .from('user_journey_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

    console.log(`이전 로그 개수: ${beforeCount}`);

    // 3. 즐겨찾기(찜) 삽입 -> 트리거 유도
    console.log('시설 찜하기 실행 중...');
    const { error: insertError } = await supabase
        .from('favorites')
        .insert({ user_id: userId, facility_id: facilityId });

    if (insertError) {
        if (insertError.code === '23505') {
            console.log('이미 찜한 시설입니다. 기존 찜 삭제 후 재시도...');
            await supabase.from('favorites').delete().eq('user_id', userId).eq('facility_id', facilityId);
            await supabase.from('favorites').insert({ user_id: userId, facility_id: facilityId });
        } else {
            console.error('찜하기 실패:', insertError.message);
            return;
        }
    }

    // 4. 로그 자동 생성 확인 (잠시 대기 후 조회)
    console.log('트리거 작동 대기 (2초)...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    const { data: logs, count: afterCount } = await supabase
        .from('user_journey_logs')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    console.log(`이후 로그 개수: ${afterCount}`);

    if (Number(afterCount) > Number(beforeCount)) {
        console.log('✅ 성공: 타임라인 로그가 자동으로 생성되었습니다!');
        console.log('최신 로그:', logs?.[0]);
    } else {
        console.log('❌ 실패: 로그가 생성되지 않았습니다. 트리거 설정을 확인하십시오.');
    }

    // 5. 테스트 뒷정리
    await supabase.from('favorites').delete().eq('user_id', userId).eq('facility_id', facilityId);
    // await supabase.from('user_journey_logs').delete().eq('id', logs[0].id); // 원할 경우 로그도 삭제
}

runTest();
