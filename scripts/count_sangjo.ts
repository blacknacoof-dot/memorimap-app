import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function countAllSangjo() {
    console.log('📊 상조 데이터 전체 카운트 확인 중...\n');

    // funeral_companies 테이블
    const { data: fcData, error: fcError, count: fcCount } = await supabase
        .from('funeral_companies')
        .select('id, name', { count: 'exact' });

    console.log('funeral_companies 테이블:');
    console.log(`  총 개수: ${fcCount || fcData?.length || 0}`);

    if (fcData && fcData.length > 0) {
        fcData.forEach((c, i) => {
            console.log(`  ${i + 1}. ${c.name} (ID: ${c.id})`);
        });
    }

    console.log('\n' + '='.repeat(60));
}

countAllSangjo();
