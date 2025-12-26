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

async function listPhoneAddressFacilities() {
    console.log('🔍 주소 필드에 전화번호가 들어간 시설 목록 추출 중...\n');

    let allFacilities: any[] = [];
    let page = 0;
    const pageSize = 1000;

    while (true) {
        const { data, error } = await supabase
            .from('memorial_spaces')
            .select('id, name, address, lat, lng, type, image_url, phone')
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

    console.log(`📋 총 ${phoneInAddress.length}개 시설\n`);
    console.log('='.repeat(100));
    console.log('ID | 이름 | 주소(오류) | 이미지');
    console.log('='.repeat(100));

    phoneInAddress.forEach((f, i) => {
        const hasImage = f.image_url && f.image_url.trim() !== '';
        const imageStatus = hasImage ? '✅' : '❌';

        // Extract actual address from name if possible
        const addressFromName = f.name.match(/^(.*?광역시.*?)\s*\(/);
        const extractedAddress = addressFromName ? addressFromName[1] : '';

        console.log(`${i + 1}. ${f.name}`);
        console.log(`   ID: ${f.id}`);
        console.log(`   주소(오류): ${f.address}`);
        if (extractedAddress) {
            console.log(`   추출 가능 주소: ${extractedAddress}`);
        }
        console.log(`   이미지: ${imageStatus}`);
        console.log('');
    });

    // Check how many have extractable addresses
    const extractable = phoneInAddress.filter(f => f.name.match(/^(.*?광역시.*?)\s*\(/));
    console.log('='.repeat(100));
    console.log(`\n📊 통계:`);
    console.log(`- 총 시설: ${phoneInAddress.length}개`);
    console.log(`- 이름에서 주소 추출 가능: ${extractable.length}개`);
    console.log(`- 이미지 있음: ${phoneInAddress.filter(f => f.image_url && f.image_url.trim() !== '').length}개`);
}

listPhoneAddressFacilities();
