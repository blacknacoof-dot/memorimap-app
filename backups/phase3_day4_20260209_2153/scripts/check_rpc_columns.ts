
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
    console.log('--- RPC Check ---');
    try {
        const { data: rpcData, error } = await supabase.rpc('search_facilities', {
            lat: 37.5, lng: 127.0, radius_meters: 500000, filter_category: 'sangjo'
        });

        if (error) {
            console.log('RPC Error:', error);
        } else if (rpcData && rpcData.length > 0) {
            // 프리드라이프 찾기
            const target = rpcData.find((d: any) => d.name.includes('프리드라이프'));
            console.log('Target Found:', !!target);
            if (target) {
                console.log('Available Columns:', Object.keys(target));
                console.log('price_info:', target.price_info);
                // products 키가 있는지 확인 (만약 RPC가 products 컬럼을 반환한다면)
                console.log('products:', target.products);
            }
        } else {
            console.log('RPC returned no data');
        }
    } catch (e) {
        console.error(e);
    }
}
run();
