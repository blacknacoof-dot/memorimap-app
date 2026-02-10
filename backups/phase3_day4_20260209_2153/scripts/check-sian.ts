import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
    const { data, error } = await supabase
        .from('memorial_spaces')
        .select('id, name, address, phone, lat, lng')
        .ilike('name', '%시안%');

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('=== 시안 관련 시설 조회 결과 ===');
    data?.forEach(d => {
        console.log(`ID: ${d.id}`);
        console.log(`이름: ${d.name}`);
        console.log(`주소: ${d.address}`);
        console.log(`전화: ${d.phone}`);
        console.log(`좌표: ${d.lat}, ${d.lng}`);
        console.log('---');
    });
}

check();
