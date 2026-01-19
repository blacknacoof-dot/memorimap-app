import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteSangjoFacilities() {
    console.log('🗑️ 상조 시설 데이터 삭제 시작...');

    // 1. 삭제할 대상 조회
    const { data: targets, error: fetchError } = await supabase
        .from('facilities')
        .select('id, name')
        .or('category.eq.sangjo,name.ilike.%상조%,name.ilike.%서비스%');

    if (fetchError) {
        console.error('❌ 대상 조회 실패:', fetchError);
        return;
    }

    if (!targets || targets.length === 0) {
        console.log('✨ 삭제할 상조 데이터가 없습니다.');
        return;
    }

    console.log(`📋 삭제 대상: ${targets.length}개 시설`);
    targets.forEach(t => console.log(`   - [${t.id}] ${t.name}`));

    const targetIds = targets.map(t => t.id);

    // 2. 연관 데이터 삭제 (순서 중요)
    // Supabase JS Client는 CASCADE를 자동으로 처리하지 않을 수 있으므로 명시적 삭제 권장
    // 하지만, FK가 CASCADE로 설정되어 있다면 facilities 삭제만으로 충분함.
    // 안전을 위해 명시적으로 삭제 시도.

    console.log('\n🔗 연관 데이터 정리 중...');

    // Facility Reviews
    const { error: revError } = await supabase
        .from('facility_reviews')
        .delete()
        .in('facility_id', targetIds);
    if (revError) console.warn('   ⚠️ Reviews 삭제 경고:', revError.message);

    // Facility Images
    const { error: imgError } = await supabase
        .from('facility_images')
        .delete()
        .in('facility_id', targetIds);
    if (imgError) console.warn('   ⚠️ Images 삭제 경고:', imgError.message);

    // Favorites (구버전)
    const { error: favError } = await supabase
        .from('favorites')
        .delete()
        .in('facility_id', targetIds);
    if (favError) console.warn('   ⚠️ Favorites 삭제 경고:', favError.message);


    // 3. Facilities 삭제
    console.log('\n🔥 Facilities 삭제 중...');
    const { error: delError, count } = await supabase
        .from('facilities')
        .delete({ count: 'exact' })
        .in('id', targetIds);

    if (delError) {
        console.error('❌ 삭제 실패:', delError);
    } else {
        console.log(`✅ 삭제 완료! 총 ${count}개 시설이 삭제되었습니다.`);
    }

    // 4. 검증
    const { count: remaining } = await supabase
        .from('facilities')
        .select('*', { count: 'exact', head: true })
        .or('category.eq.sangjo,name.ilike.%상조%,name.ilike.%서비스%');

    console.log(`\n🔍 검증 결과: 남은 상조 데이터 ${remaining}개`);
}

deleteSangjoFacilities();
