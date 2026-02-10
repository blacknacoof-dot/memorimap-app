import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function testTrigger() {
    const userId = 'user_36vml1WCaPN5YGZFA84gzmgDHAW';
    const facilityId = '4265652b-e903-492c-898c-3b558f18a276'; // 기존에 확인된 유효한 UUID

    console.log('1. favorites 테이블에 데이터 삽입 시도...');
    const { error: favError } = await supabase
        .from('favorites')
        .insert([{ user_id: userId, facility_id: facilityId }]);

    if (favError && favError.code !== '23505') { // 중복은 허용
        console.error('즐겨찾기 삽입 실패:', favError.message);
        return;
    }
    console.log('✅ 즐겨찾기 삽입 완료 (또는 이미 존재)');

    console.log('2. user_journey_logs 테이블에서 자동 생성된 로그 확인...');
    // 약간의 지연 후 조회
    await new Promise(r => setTimeout(r, 1000));

    const { data: logs, error: logError } = await supabase
        .from('user_journey_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('event_type', 'LIKE')
        .order('created_at', { ascending: false })
        .limit(1);

    if (logError) {
        console.error('로그 조회 실패:', logError.message);
        return;
    }

    if (logs?.length) {
        console.log('✅ 성공: 트리거에 의해 로그가 자동 생성되었습니다!');
        console.log(logs[0]);
    } else {
        console.log('❌ 실패: 로그가 생성되지 않았습니다.');
    }
}

testTrigger();
