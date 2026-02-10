import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!);

async function update() {
    console.log('🚀 Updating The-K Yedaham contact...');

    const { error } = await supabase
        .from('memorial_spaces')
        .update({
            phone: '1566-6644', // Correct contact
            description: '정직과 신뢰의 더케이예다함상조입니다. 교직원공제회가 전액 출자한 상조회사로 투명하고 믿을 수 있는 서비스를 제공합니다.',
            features: ['100% 환불 보장', '교직원공제회 출자', '자본금 500억', '전국 직영망']
        })
        .eq('name', '더케이예다함'); // Exact match found

    if (error) console.error('Error:', error);
    else console.log('✅ Updated successfully!');

    // Also check Samsung Development if user wants (optional)
}

update();
