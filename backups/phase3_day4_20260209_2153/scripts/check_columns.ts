import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function checkColumns() {
    console.log('--- favorites 및 user_favorites 컬럼 정보 조회 ---');

    // 정보를 가져올 수 있는 RPC가 없으므로 정교한 에러 메시지를 유도하여 타입을 유추하거나 
    // 데이터를 직접 조회하여 값의 형태를 봅니다.

    const { data: favs } = await supabase.from('favorites').select('*').limit(1);
    console.log('favorites 예시 데이터:', favs?.[0]);

    const { data: userFavs } = await supabase.from('user_favorites').select('*').limit(1);
    console.log('user_favorites 예시 데이터:', userFavs?.[0]);

    // 테이블 구조 파악을 위한 꼼수 (존재하지 않는 컬럼으로 에러 유도 시 가끔 정보 노출)
    // 여기서는 그냥 값의 타입으로 판단합니다.
}

checkColumns();
