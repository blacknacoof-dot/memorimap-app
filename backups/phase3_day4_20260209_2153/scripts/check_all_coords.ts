import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase 설정 누락');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAllCoordinates() {
    console.log('🔍 전체 좌표 상태 확인 중...\n');

    // Check for common default coordinates
    const defaultCoords = [
        { lat: 37.5, lng: 127.0, name: '기본값 1' },
        { lat: 37.0, lng: 127.0, name: '기본값 2' },
        { lat: 0, lng: 0, name: '영점' },
    ];

    let totalDefaults = 0;

    for (const coord of defaultCoords) {
        const { data, error } = await supabase
            .from('memorial_spaces')
            .select('id, name, address, type')
            .eq('lat', coord.lat)
            .eq('lng', coord.lng);

        if (error) {
            console.error(`❌ 조회 오류 (${coord.name}):`, error);
            continue;
        }

        if (data && data.length > 0) {
            console.log(`📍 ${coord.name} (${coord.lat}, ${coord.lng}): ${data.length}개`);
            totalDefaults += data.length;

            // Show first 5 examples
            console.log('   예시:');
            data.slice(0, 5).forEach(f => {
                console.log(`   - [${f.type}] ${f.name} (${f.address})`);
            });
            console.log('');
        }
    }

    console.log(`\n📊 총 기본 좌표 시설: ${totalDefaults}개\n`);

    // Also check total count
    const { count } = await supabase
        .from('memorial_spaces')
        .select('*', { count: 'exact', head: true });

    console.log(`📋 전체 시설 수: ${count}개`);
    console.log(`✅ 정상 좌표: ${(count || 0) - totalDefaults}개`);
    console.log(`⚠️ 보정 필요: ${totalDefaults}개`);
}

checkAllCoordinates();
