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

async function findPhoneAddresses() {
    console.log('🔍 주소 필드에 전화번호가 들어간 시설 검색 중...\n');

    // Fetch all facilities with phone numbers in address
    let allFacilities: any[] = [];
    let page = 0;
    const pageSize = 1000;

    while (true) {
        const { data, error } = await supabase
            .from('memorial_spaces')
            .select('id, name, address, lat, lng, type, image_url')
            .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) {
            console.error('❌ 조회 오류:', error);
            return;
        }

        if (!data || data.length === 0) break;

        allFacilities = allFacilities.concat(data);
        page++;

        if (data.length < pageSize) break;
    }

    const phoneInAddress = allFacilities.filter(f => f.address && f.address.includes('tel:'));

    console.log(`📋 총 ${phoneInAddress.length}개 시설 발견\n`);

    if (phoneInAddress.length === 0) {
        console.log('✅ 문제 없음');
        return;
    }

    // Group by coordinates
    const coordMap: Record<string, typeof phoneInAddress> = {};
    phoneInAddress.forEach(f => {
        const key = `${f.lat.toFixed(6)},${f.lng.toFixed(6)}`;
        if (!coordMap[key]) coordMap[key] = [];
        coordMap[key].push(f);
    });

    const clusters = Object.entries(coordMap)
        .sort((a, b) => b[1].length - a[1].length);

    console.log('📍 좌표별 분포:');
    console.log(`- 고유 좌표: ${clusters.length}개`);
    console.log(`- 가장 많이 뭉친 곳: ${clusters[0][1].length}개\n`);

    console.log('='.repeat(80));
    console.log('상위 5개 클러스터:\n');

    clusters.slice(0, 5).forEach(([coord, facs], index) => {
        console.log(`${index + 1}. [${coord}] - ${facs.length}개 시설`);

        // Check if it's Gwangju by looking at facility names
        const gwangjuCount = facs.filter(f => f.name.includes('광주')).length;
        if (gwangjuCount > 0) {
            console.log(`   ⚠️ 광주 관련: ${gwangjuCount}개`);
        }

        facs.slice(0, 5).forEach(f => {
            console.log(`   - ${f.name} (${f.type})`);
            console.log(`     주소(오류): ${f.address.substring(0, 60)}...`);
        });
        console.log('');
    });

    // Count by type
    const typeCount: Record<string, number> = {};
    phoneInAddress.forEach(f => {
        typeCount[f.type] = (typeCount[f.type] || 0) + 1;
    });

    console.log('='.repeat(80));
    console.log('\n📊 유형별 분포:');
    Object.entries(typeCount).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
        console.log(`- ${type}: ${count}개`);
    });
}

findPhoneAddresses();
