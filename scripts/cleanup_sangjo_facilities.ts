import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupSangjoFromFacilities() {
    console.log('🔍 facilities 테이블에서 sangjo 카테고리 확인 중...\n');

    // 1. sangjo 카테고리 시설 조회
    const { data: sangjoFacilities, error: fetchError } = await supabase
        .from('facilities')
        .select('id, name, category')
        .eq('category', 'sangjo');

    if (fetchError) {
        console.error('❌ 조회 실패:', fetchError);
        return;
    }

    if (!sangjoFacilities || sangjoFacilities.length === 0) {
        console.log('✅ facilities 테이블에 sangjo 카테고리 시설이 없습니다.');
        return;
    }

    console.log(`⚠️  발견된 sangjo 카테고리 시설: ${sangjoFacilities.length}개\n`);
    sangjoFacilities.forEach(f => {
        console.log(`  - ${f.name} (ID: ${f.id})`);
    });

    // 2. 삭제 진행
    console.log('\n🗑️  삭제 진행 중...\n');

    const { error: deleteError } = await supabase
        .from('facilities')
        .delete()
        .eq('category', 'sangjo');

    if (deleteError) {
        console.error('❌ 삭제 실패:', deleteError);
        return;
    }

    console.log(`✅ ${sangjoFacilities.length}개의 sangjo 시설을 facilities 테이블에서 삭제했습니다.`);
    console.log('\n💡 상조 서비스는 funeral_companies 테이블에만 존재합니다.');
}

cleanupSangjoFromFacilities();
