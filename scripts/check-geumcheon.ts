import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseKey = envConfig.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDuplicates() {
    // 아카시아와 독산 장례식장 검색
    const { data, error } = await supabase
        .from('memorial_spaces')
        .select('id, name, address, lat, lng, type, is_verified')
        .or('name.ilike.%아카시아%,name.ilike.%독산장례식장%');

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('=== 아카시아/독산 장례식장 검색 ===');
    console.log('총', data?.length, '건');

    if (data && data.length > 0) {
        data.forEach((item, idx) => {
            console.log(`\n[${idx + 1}]`);
            console.log('  ID:', item.id);
            console.log('  이름:', item.name);
            console.log('  주소:', item.address);
            console.log('  좌표:', item.lat, ',', item.lng);
            console.log('  타입:', item.type);
            console.log('  인증:', item.is_verified);
        });

        // 좌표 비교
        if (data.length >= 2) {
            const dist = Math.sqrt(
                Math.pow((data[0].lat - data[1].lat) * 111000, 2) +
                Math.pow((data[0].lng - data[1].lng) * 88000, 2)
            );
            console.log('\n=== 좌표 거리 ===');
            console.log('두 시설 간 거리:', dist.toFixed(1), 'm');
        }
    } else {
        console.log('검색 결과가 없습니다.');

        // 전체 장례식장 중 시흥대로 검색
        const { data: data2 } = await supabase
            .from('memorial_spaces')
            .select('id, name, address, lat, lng')
            .ilike('address', '%시흥대로%');

        console.log('\n=== 시흥대로 시설 검색 ===');
        console.log('총', data2?.length, '건');
        data2?.forEach((item, idx) => {
            console.log(`[${idx + 1}] ${item.name} - ${item.address}`);
        });
    }
}

checkDuplicates();
