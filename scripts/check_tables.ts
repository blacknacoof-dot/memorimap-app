import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// .env 파일 로드 (루트 디렉토리 기준)
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('환경 변수가 설정되지 않았습니다.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
    const { data, error } = await supabase.rpc('get_table_list'); // 만약 RPC가 없다면 query 사용

    if (error) {
        // RPC가 없을 경우 직접 쿼리 시도 (보통은 안됨)
        console.log('RPC get_table_list 실패, 직접 쿼리 시도...');
        const { data: data2, error: error2 } = await supabase
            .from('favorites')
            .select('count', { count: 'exact', head: true });

        if (!error2) {
            console.log('✅ "favorites" 테이블이 존재합니다.');
        } else {
            console.log('❌ "favorites" 테이블이 없거나 접근 불가능합니다:', error2.message);
        }

        const { data: data3, error: error3 } = await supabase
            .from('user_favorites')
            .select('count', { count: 'exact', head: true });

        if (!error3) {
            console.log('✅ "user_favorites" 테이블이 존재합니다.');
        } else {
            console.log('❌ "user_favorites" 테이블이 없거나 접근 불가능합니다:', error3.message);
        }
    } else {
        console.log('Tables:', data);
    }
}

checkTables();
