import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function insertManualLog() {
    const { data: favs, error: favError } = await supabase.from('favorites').select('user_id').limit(1);
    if (favError) {
        console.error('즐겨찾기 조회 실패:', favError.message);
        return;
    }
    if (!favs?.length) {
        console.log('즐겨찾기 데이터가 없습니다. 테스트를 진행할 수 없습니다.');
        return;
    }

    const userId = favs[0].user_id;

    console.log(`유저(${userId})에 대한 수동 로그 생성을 시도합니다.`);

    const { data: log, error } = await supabase
        .from('user_journey_logs')
        .insert({
            user_id: userId,
            event_type: 'MANUAL',
            title: '나의 여정 기능 검증 (수동)',
            description: '시스템에서 기능을 검증하기 위해 생성된 로그입니다.'
        })
        .select();

    if (error) {
        console.error('로그 생성 실패:', error.message);
    } else {
        console.log('✅ 성공: 수동 로그가 생성되었습니다.', log);
    }
}

insertManualLog();
