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

async function checkGwangjuFunerals() {
    console.log('🔍 광주광역시 장례식장 분석 중...\n');

    const { data: facilities, error } = await supabase
        .from('memorial_spaces')
        .select('id, name, address, lat, lng, type, image_url, phone')
        .eq('type', 'funeral')
        .ilike('address', '%광주광역시%');

    if (error) {
        console.error('❌ 조회 오류:', error);
        return;
    }

    if (!facilities || facilities.length === 0) {
        console.log('광주광역시 장례식장 없음');
        return;
    }

    console.log(`📋 총 ${facilities.length}개 장례식장 발견\n`);

    // Check for phone numbers in address field
    const phoneInAddress = facilities.filter(f => f.address && f.address.includes('tel:'));
    console.log(`⚠️ 주소 필드에 전화번호: ${phoneInAddress.length}개\n`);

    if (phoneInAddress.length > 0) {
        console.log('문제 시설 목록:');
        phoneInAddress.forEach((f, i) => {
            console.log(`${i + 1}. ${f.name}`);
            console.log(`   주소(오류): ${f.address}`);
            console.log(`   좌표: ${f.lat}, ${f.lng}`);
            console.log(`   이미지: ${f.image_url ? '있음' : '없음'}`);
            console.log('');
        });
    }

    // Group by coordinates
    const coordMap: Record<string, typeof facilities> = {};
    facilities.forEach(f => {
        const key = `${f.lat.toFixed(6)},${f.lng.toFixed(6)}`;
        if (!coordMap[key]) coordMap[key] = [];
        coordMap[key].push(f);
    });

    const clusters = Object.entries(coordMap)
        .filter(([_, facs]) => facs.length > 1)
        .sort((a, b) => b[1].length - a[1].length);

    console.log('='.repeat(80));
    console.log(`\n📍 좌표 중복:`);
    console.log(`- 고유 좌표: ${Object.keys(coordMap).length}개`);
    console.log(`- 중복 좌표: ${clusters.length}개\n`);

    if (clusters.length > 0) {
        console.log('중복 좌표 목록:');
        clusters.forEach(([coord, facs], index) => {
            console.log(`${index + 1}. [${coord}] - ${facs.length}개 시설`);
            facs.forEach(f => {
                console.log(`   - ${f.name}`);
            });
            console.log('');
        });
    }
}

checkGwangjuFunerals();
