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

async function inspect() {
    console.log('🔍 특정 시설 및 이미지 상태 점검 중...');

    // 1. "천주교인보성체수도회" 조회
    const { data: target, error } = await supabase
        .from('facilities')
        .select('*')
        .eq('name', '천주교인보성체수도회') // 정확한 이름 매칭 시도
        .maybeSingle();

    if (error) {
        console.error('❌ 조회 에러:', error);
    } else if (target) {
        console.log('🎯 타겟 시설 발견:');
        console.log(`   - ID: ${target.id}`);
        console.log(`   - Name: ${target.name}`);
        console.log(`   - Category: ${target.category}`);
        console.log(`   - Images:`, target.images);
    } else {
        console.log('⚠️ "천주교인보성체수도회"를 찾을 수 없습니다. 이름 유사 검색 시도...');
        const { data: similar } = await supabase
            .from('facilities')
            .select('id, name, images, category')
            .ilike('name', '%천주교%')
            .limit(5);

        if (similar && similar.length > 0) {
            console.log('   유사 검색 결과:');
            similar.forEach(f => console.log(`   - [${f.name}] (${f.category}): ${JSON.stringify(f.images)}`));
        }
    }

    console.log('\n🔍 전체 시설 이미지 상태 점검 (요약)...');

    // 2. 이미지가 NULL이거나 비어있는 시설 카운트
    const { count: nullImages } = await supabase
        .from('facilities')
        .select('*', { count: 'exact', head: true })
        .is('images', null);

    console.log(`   - Images가 NULL인 시설: ${nullImages}개`);

    // 3. 빈 배열이거나 길이가 0인 배열
    // SQL로 JSON 배열 길이 체크는 까다로울 수 있으니 샘플링으로 확인하거나,
    // 전체 데이터를 가져와서 분석하는 별도 스크립트가 필요할 수 있음.
    // 여기선 일단 NULL 체크만.
}

inspect();
