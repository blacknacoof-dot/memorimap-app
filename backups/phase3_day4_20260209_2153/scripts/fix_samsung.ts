import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!);

async function update() {
    console.log('🚀 Updating Samsung Development contact...');

    const { error } = await supabase
        .from('memorial_spaces')
        .update({
            phone: '053-745-8100',
            description: '삼성개발은 고객 중심의 장례 문화를 선도합니다.',
            features: ['전문 의전', '합리적인 가격', '24시간 상담']
        })
        .eq('id', 2311); // ID found in previous step

    if (error) console.error('Error:', error);
    else console.log('✅ Updated Samsung Development successfully!');
}

update();
