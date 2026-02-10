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

const TARGET_CATEGORIES = ['pet_funeral', 'cemetery', 'natural_burial', 'columbarium'];
const SUPABASE_STORAGE_URL = 'xvmpvzldezpoxxsarizm.supabase.co/storage';

interface Facility {
    id: string;
    name: string;
    images: string[] | null;
}

async function resetImages() {
    console.log('🧹 타 카테고리 기본 이미지 초기화 시작...\n');

    for (const category of TARGET_CATEGORIES) {
        console.log(`🔍 [${category}] 분석 중...`);

        // 1. 해당 카테고리 시설 조회
        const { data: facilities, error } = await supabase
            .from('facilities')
            .select('id, name, images')
            .eq('category', category);

        if (error) {
            console.error(`❌ Error fetching ${category}:`, error);
            continue;
        }

        if (!facilities || facilities.length === 0) {
            console.log(`   - 대상 시설 없음`);
            continue;
        }

        // 2. 초기화 대상 식별 (Supabase 스토리지 이미지 or Placeholder)
        const targets = (facilities as Facility[]).filter(f => {
            if (!f.images || !Array.isArray(f.images) || f.images.length === 0) return false;

            // 배열 내 하나라도 Supabase 스토리지 URL이거나 placeholder라면 대상
            // (보통 기본 이미지는 하나만 들어있거나 첫 번째에 위치)
            return f.images.some(url =>
                url.includes(SUPABASE_STORAGE_URL) ||
                url.includes('placeholder')
            );
        });

        if (targets.length === 0) {
            console.log(`   - 초기화할 대상이 없습니다.`);
            continue;
        }

        console.log(`   - 총 ${facilities.length}개 중 ${targets.length}개가 기본 이미지 사용 중.`);

        // 3. 업데이트 (NULL로 설정)
        const targetIds = targets.map(t => t.id);

        // 배치 처리를 위해 50개씩 끊어서 업데이트
        const BATCH_SIZE = 50;
        let successCount = 0;

        for (let i = 0; i < targetIds.length; i += BATCH_SIZE) {
            const batch = targetIds.slice(i, i + BATCH_SIZE);
            const { error: updateError, count } = await supabase
                .from('facilities')
                .update({ images: null }) // NULL로 설정하여 프론트엔드 랜덤 로직 활성화
                .in('id', batch); // .count() 옵션은 select에서만 보통 씀, update 결과도 count 줌? (v2는 안 줄수도)

            if (updateError) {
                console.error(`   ❌ Batch update failed (${i}~${i + batch.length}):`, updateError);
            } else {
                successCount += batch.length;
                process.stdout.write(`.`);
            }
        }
        console.log(`\n   ✅ ${successCount}개 시설 이미지 초기화 완료.`);
    }

    console.log('\n✨ 모든 작업 완료! 앱을 새로고침하여 랜덤 이미지가 적용되는지 확인하세요.');
}

resetImages();
