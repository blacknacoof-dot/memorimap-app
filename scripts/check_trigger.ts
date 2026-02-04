import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTrigger() {
    const { data, error } = await supabase.rpc('get_trigger_list'); // RPC가 있다고 가정

    if (error) {
        console.log('RPC get_trigger_list 실패. 직접적인 트리거 확인은 Supabase Dashboard에서 권장됩니다.');
        console.log('대안으로, favorites 테이블에 테스트 데이터를 넣어 로그가 생기는지 확인하겠습니다.');
    } else {
        console.log('Triggers:', data);
    }
}

checkTrigger();
