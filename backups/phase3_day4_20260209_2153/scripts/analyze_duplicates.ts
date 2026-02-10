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

async function analyzeDuplicates() {
    console.log('🔍 중복 시설 분석 중...\n');

    // Fetch all facilities
    let allFacilities: any[] = [];
    let page = 0;
    const pageSize = 1000;

    while (true) {
        const { data, error } = await supabase
            .from('memorial_spaces')
            .select('id, name, address, lat, lng, type, image_url, data_source, is_verified')
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

    console.log(`📋 총 ${allFacilities.length}개 시설\n`);

    // Group by name (potential duplicates)
    const nameMap: Record<string, typeof allFacilities> = {};
    allFacilities.forEach(f => {
        const normalizedName = f.name.trim().toLowerCase();
        if (!nameMap[normalizedName]) nameMap[normalizedName] = [];
        nameMap[normalizedName].push(f);
    });

    // Find duplicates
    const duplicates = Object.entries(nameMap)
        .filter(([_, facs]) => facs.length > 1)
        .sort((a, b) => b[1].length - a[1].length);

    console.log(`📊 중복 이름: ${duplicates.length}개\n`);

    // Analyze duplicate patterns
    let withReviewsAndImages = 0;
    let oldDataOnly = 0;
    let newDataOnly = 0;
    let needsMerge = 0;

    console.log('='.repeat(100));
    console.log('중복 시설 상위 20개:\n');

    duplicates.slice(0, 20).forEach(([name, facs], index) => {
        console.log(`${index + 1}. ${facs[0].name} - ${facs.length}개 레코드`);

        facs.forEach((f, i) => {
            const hasImage = f.image_url && f.image_url.trim() !== '';
            const dataSource = f.data_source || 'unknown';
            const verified = f.is_verified ? '✓' : '';

            console.log(`   [${i + 1}] ID: ${f.id}`);
            console.log(`       주소: ${f.address.substring(0, 60)}`);
            console.log(`       좌표: ${f.lat}, ${f.lng}`);
            console.log(`       이미지: ${hasImage ? '✅' : '❌'} | 출처: ${dataSource} ${verified}`);
        });

        // Check if needs merge
        const hasImageRecord = facs.some(f => f.image_url && f.image_url.trim() !== '');
        const hasOldRecord = facs.some(f => !f.data_source || f.data_source === 'unknown');

        if (hasImageRecord && hasOldRecord) {
            console.log(`   ⚠️ 병합 필요: 기존 데이터 + 새 데이터`);
            needsMerge++;
        }

        console.log('');
    });

    console.log('='.repeat(100));
    console.log(`\n📈 통계:`);
    console.log(`- 총 시설: ${allFacilities.length}개`);
    console.log(`- 중복 이름: ${duplicates.length}개`);
    console.log(`- 병합 필요 추정: ${needsMerge}개`);

    // Check data_source distribution
    const sourceCount: Record<string, number> = {};
    allFacilities.forEach(f => {
        const source = f.data_source || 'unknown';
        sourceCount[source] = (sourceCount[source] || 0) + 1;
    });

    console.log(`\n📊 데이터 출처 분포:`);
    Object.entries(sourceCount).sort((a, b) => b[1] - a[1]).forEach(([source, count]) => {
        console.log(`- ${source}: ${count}개`);
    });

    // Check image distribution
    const withImages = allFacilities.filter(f => f.image_url && f.image_url.trim() !== '');
    console.log(`\n📷 이미지 현황:`);
    console.log(`- 이미지 있음: ${withImages.length}개 (${Math.round(withImages.length / allFacilities.length * 100)}%)`);
    console.log(`- 이미지 없음: ${allFacilities.length - withImages.length}개`);
}

analyzeDuplicates();
