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

async function checkGwangju() {
    console.log('🔍 광주 지역 시설 분석 중...\n');

    const { data: facilities, error } = await supabase
        .from('memorial_spaces')
        .select('id, name, address, lat, lng, type, image_url, phone')
        .ilike('address', '%광주%');

    if (error) {
        console.error('❌ 조회 오류:', error);
        return;
    }

    if (!facilities || facilities.length === 0) {
        console.log('광주 지역 시설 없음');
        return;
    }

    console.log(`📋 총 ${facilities.length}개 시설 발견\n`);

    // Group by coordinates
    const coordMap: Record<string, typeof facilities> = {};
    facilities.forEach(f => {
        const key = `${f.lat.toFixed(6)},${f.lng.toFixed(6)}`;
        if (!coordMap[key]) coordMap[key] = [];
        coordMap[key].push(f);
    });

    // Find clusters
    const clusters = Object.entries(coordMap)
        .filter(([_, facs]) => facs.length > 1)
        .sort((a, b) => b[1].length - a[1].length);

    console.log('📍 좌표 중복 현황:');
    console.log(`- 고유 좌표: ${Object.keys(coordMap).length}개`);
    console.log(`- 중복 좌표: ${clusters.length}개`);
    console.log('');

    if (clusters.length > 0) {
        console.log('='.repeat(80));
        console.log('중복 좌표 상위 10개:\n');
        clusters.slice(0, 10).forEach(([coord, facs], index) => {
            console.log(`${index + 1}. [${coord}] - ${facs.length}개 시설`);
            facs.forEach(f => {
                const hasImage = f.image_url && f.image_url.trim() !== '';
                const imageStatus = hasImage ? '✅' : '❌';
                console.log(`   ${imageStatus} ${f.name}`);
                console.log(`      주소: ${f.address}`);
                console.log(`      전화: ${f.phone || '없음'}`);
            });
            console.log('');
        });
    }

    // Check images
    const withoutImages = facilities.filter(f => !f.image_url || f.image_url.trim() === '');
    console.log('='.repeat(80));
    console.log(`\n📷 이미지 현황:`);
    console.log(`- 이미지 있음: ${facilities.length - withoutImages.length}개`);
    console.log(`- 이미지 없음: ${withoutImages.length}개 (${Math.round(withoutImages.length / facilities.length * 100)}%)`);

    if (withoutImages.length > 0) {
        console.log('\n이미지 없는 시설 (상위 10개):');
        withoutImages.slice(0, 10).forEach(f => {
            console.log(`- ${f.name} (${f.type})`);
            console.log(`  ${f.address}`);
        });
    }

    // Check phone numbers in address field
    const phoneInAddress = facilities.filter(f => f.address && f.address.includes('tel:'));
    if (phoneInAddress.length > 0) {
        console.log(`\n⚠️ 주소 필드에 전화번호 입력된 시설: ${phoneInAddress.length}개`);
        phoneInAddress.slice(0, 5).forEach(f => {
            console.log(`- ${f.name}: ${f.address}`);
        });
    }
}

checkGwangju();
