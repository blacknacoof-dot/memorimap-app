import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
dotenv.config({ path: path.resolve(rootDir, '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 카테고리별 매칭 키워드 (파일명 검색용)
const CATEGORY_MAPPING: Record<string, string> = {
    'pet_funeral': 'pet',
    'cemetery': 'park',    // 공원묘지 -> park
    'natural_burial': 'natural',
    'columbarium': 'charnel'
};

async function restoreimages() {
    console.log('🔄 카테고리별 이미지 복구(재할당) 시작...');

    // 1. Storage에서 기본 이미지 목록 조회
    const { data: files, error: listError } = await supabase
        .storage
        .from('facility-images')
        .list('defaults', {
            limit: 100,
            offset: 0,
            sortBy: { column: 'created_at', order: 'desc' },
        });

    if (listError) {
        console.error('❌ Storage 목록 조회 실패:', listError);
        return;
    }

    console.log(`📁 스토리지 파일 목록 (${files.length}개):`);
    files.forEach(f => console.log(`   - ${f.name}`));

    // 2. 카테고리별 복구 실행
    for (const [category, keyword] of Object.entries(CATEGORY_MAPPING)) {
        // 해당 키워드가 포함된 최신 파일 찾기
        const bestFile = files.find(f => f.name.includes(keyword) && f.name.endsWith('.jpg'));

        if (!bestFile) {
            console.warn(`⚠️ [${category}] 매칭되는 이미지를 찾을 수 없습니다. (키워드: ${keyword})`);
            continue;
        }

        const publicUrl = supabase.storage
            .from('facility-images')
            .getPublicUrl(`defaults/${bestFile.name}`).data.publicUrl;

        console.log(`🎯 [${category}] 복구용 이미지: ${bestFile.name}`);
        console.log(`   URL: ${publicUrl}`);

        // 3. DB 업데이트 (이미지가 NULL인 시설 대상)
        // facilities.category 컬럼 사용
        const { error: updateError, count } = await supabase
            .from('facilities')
            .update({
                images: [publicUrl]  // 배열로 저장
            })
            .eq('category', category)
            .is('images', null) // NULL인 것만 복구 (제가 지운 것들)
            .select('id', { count: 'exact' }); // count 확인용

        if (updateError) {
            console.error(`   ❌ 업데이트 실패:`, updateError);
        } else {
            console.log(`   ✅ ${count ?? 'Unknown'}개 시설 이미지 복구 완료.`);
        }
    }

    console.log('\n✨ 복구 작업 완료!');
}

restoreimages();
