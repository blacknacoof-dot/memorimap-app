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

async function findClusters() {
    console.log('🔍 좌표 중복 분석 시작...\n');

    // Fetch ALL facilities (no limit)
    let allFacilities: any[] = [];
    let page = 0;
    const pageSize = 1000;

    while (true) {
        const { data, error } = await supabase
            .from('memorial_spaces')
            .select('id, name, address, lat, lng, type')
            .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) {
            console.error('❌ 조회 오류:', error);
            return;
        }

        if (!data || data.length === 0) break;

        allFacilities = allFacilities.concat(data);
        page++;

        if (data.length < pageSize) break; // Last page
    }

    const facilities = allFacilities;

    if (!facilities || facilities.length === 0) {
        console.log('데이터 없음');
        return;
    }

    console.log(`📋 총 ${facilities.length}개 시설 분석 중...\n`);

    // Group by coordinates
    const coordMap: Record<string, typeof facilities> = {};

    facilities.forEach(f => {
        // Round to 6 decimal places to group similar coordinates
        const lat = parseFloat(f.lat.toFixed(6));
        const lng = parseFloat(f.lng.toFixed(6));
        const key = `${lat},${lng}`;

        if (!coordMap[key]) {
            coordMap[key] = [];
        }
        coordMap[key].push(f);
    });

    // Find clusters (more than 1 facility at same location)
    const clusters = Object.entries(coordMap)
        .filter(([_, facilities]) => facilities.length > 1)
        .sort((a, b) => b[1].length - a[1].length);

    console.log(`📊 중복 좌표 발견: ${clusters.length}개\n`);
    console.log('='.repeat(80));
    console.log('상위 30개 클러스터:\n');

    clusters.slice(0, 30).forEach(([coord, facilities], index) => {
        const [lat, lng] = coord.split(',');
        console.log(`${index + 1}. [${coord}] - ${facilities.length}개 시설`);

        // Show facility types distribution
        const types: Record<string, number> = {};
        facilities.forEach(f => {
            types[f.type] = (types[f.type] || 0) + 1;
        });
        console.log(`   유형: ${Object.entries(types).map(([t, c]) => `${t}(${c})`).join(', ')}`);

        // Show first 3 examples
        console.log('   예시:');
        facilities.slice(0, 3).forEach(f => {
            console.log(`   - ${f.name} (${f.address.substring(0, 50)}...)`);
        });
        console.log('');
    });

    console.log('='.repeat(80));
    console.log(`\n📈 통계:`);
    console.log(`- 총 시설: ${facilities.length}개`);
    console.log(`- 중복 좌표: ${clusters.length}개`);
    console.log(`- 중복된 시설 수: ${clusters.reduce((sum, [_, f]) => sum + f.length, 0)}개`);
    console.log(`- 고유 좌표: ${Object.keys(coordMap).length}개`);

    // Count facilities in large clusters (100+)
    const largeClusters = clusters.filter(([_, f]) => f.length >= 100);
    const facilitiesInLargeClusters = largeClusters.reduce((sum, [_, f]) => sum + f.length, 0);

    console.log(`\n⚠️ 100개 이상 클러스터: ${largeClusters.length}개`);
    console.log(`   해당 시설 수: ${facilitiesInLargeClusters}개`);
}

findClusters();
