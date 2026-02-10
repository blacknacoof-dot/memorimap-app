import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function checkTriggerExists() {
    console.log('--- 트리거 존재 여부 확인 ---');

    // pg_trigger 조회를 위한 RPC가 없으므로, 직접 쿼리를 할 수 없지만 
    // favorites 테이블에 더미 데이터를 넣고 지우는 방식으로 트리거 발동을 확인해봅니다.

    const userId = 'user_999_test_trigger';
    const facilityId = '4265652b-e903-492c-898c-3b558f18a276';

    console.log('1. 기존 테스트 데이터 삭제...');
    await supabase.from('favorites').delete().eq('user_id', userId);
    await supabase.from('user_journey_logs').delete().eq('user_id', userId);

    console.log('2. 새 즐겨찾기 삽입 (트리거 기대)...');
    const { error: insError } = await supabase.from('favorites').insert({ user_id: userId, facility_id: facilityId });
    if (insError) console.error('삽입 에러:', insError);

    console.log('3. 2초 대기 후 로그 확인...');
    await new Promise(r => setTimeout(r, 2000));

    const { data: logs } = await supabase.from('user_journey_logs').select('*').eq('user_id', userId);

    if (logs && logs.length > 0) {
        console.log('✅ 트리거 작동 확인됨!');
        console.log(logs[0]);
    } else {
        console.log('❌ 트리거가 작동하지 않았습니다. (로그 없음)');
    }

    // 정리
    await supabase.from('favorites').delete().eq('user_id', userId);
    await supabase.from('user_journey_logs').delete().eq('user_id', userId);
}

checkTriggerExists();
