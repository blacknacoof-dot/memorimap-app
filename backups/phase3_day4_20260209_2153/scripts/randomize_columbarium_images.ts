import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

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

const SOURCE_DIR = path.resolve(rootDir, 'data/봉안시설 대표이미지_최적화');
const BUCKET = 'facility-images';
const STORAGE_PATH = 'columbarium_random';

// 섞기 함수 (Fisher-Yates Shuffle)
function shuffle<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

async function run() {
    console.log('🖼️ 봉안시설 이미지 랜덤 배분 시작...');

    if (!fs.existsSync(SOURCE_DIR)) {
        console.error(`❌ 소스 폴더가 없습니다: ${SOURCE_DIR}`);
        return;
    }

    // 1. 파일 업로드 및 URL 확보
    console.log('📤 이미지 업로드 중...');
    const files = fs.readdirSync(SOURCE_DIR).filter(f => f.endsWith('.jpg') || f.endsWith('.png'));
    const imageUrls: string[] = [];

    for (const file of files) {
        const filePath = path.join(SOURCE_DIR, file);
        const fileBuffer = fs.readFileSync(filePath);
        const storageKey = `${STORAGE_PATH}/${file}`;

        const { error: uploadError } = await supabase.storage
            .from(BUCKET)
            .upload(storageKey, fileBuffer, {
                contentType: 'image/jpeg',
                upsert: true
            });

        if (uploadError) {
            console.error(`   ❌ 업로드 실패 (${file}):`, uploadError.message);
            continue;
        }

        const { data: { publicUrl } } = supabase.storage
            .from(BUCKET)
            .getPublicUrl(storageKey);

        imageUrls.push(publicUrl);
    }

    console.log(`✅ ${imageUrls.length}개 이미지 업로드 완료.`);

    if (imageUrls.length === 0) return;

    // 2. 대상 시설 조회 (봉안당 중 이미지가 없거나 기본 이미지인 곳)
    // reset_category_images.ts에 의해 이미 대부분 NULL 상태일 것임.
    // 하지만 'charnel' 기본 이미지를 복구(restore)해두었으므로, 그것들도 대상에 포함해야 함.

    // 타겟 조건: category = 'columbarium'
    // 그리고 이미지가 NULL이거나, 기본 이미지('charnel')인 경우

    const { data: facilities, error: fetchError } = await supabase
        .from('facilities')
        .select('id, name, images')
        .eq('category', 'columbarium');

    if (fetchError) {
        console.error('❌ 시설 조회 실패:', fetchError);
        return;
    }

    // 필터링: 이미 랜덤 이미지가 적용된 곳은 건너뛸지? 
    // "다시롤백" -> "이미지 같은것 쓰거나 없는곳... 랜덤으로 배치했었음"
    // 사용자는 이전 상태(랜덤 배치된 상태)를 원함.
    // 따라서 기존 이미지가 'charnel_final' (저번에 복구한 것) 이거나 NULL 이거나 빈 배열인 곳을 대상으로 함.

    const targets = facilities.filter(f => {
        if (!f.images || f.images.length === 0) return true;
        // 기본이미지('charnel') 포함 여부 확인
        const isDefault = f.images.some((url: string) => url.includes('defaults/charnel'));
        return isDefault;
    });

    console.log(`🎯 대상 시설: ${targets.length}개 (총 ${facilities.length}개 중)`);

    // 3. 랜덤 업데이트
    console.log('🎲 이미지 배분 및 업데이트 중...');
    let successCount = 0;

    for (const facility of targets) {
        // 13개 중 랜덤 3개 선택 (이미지가 적으면 있는 대로)
        const count = Math.min(3, imageUrls.length);
        const selectedImages = shuffle(imageUrls).slice(0, count);

        const { error: updateError } = await supabase
            .from('facilities')
            .update({ images: selectedImages })
            .eq('id', facility.id);

        if (updateError) {
            console.error(`   ❌ 업데이트 실패 (${facility.name}):`, updateError.message);
        } else {
            successCount++;
            if (successCount % 50 === 0) process.stdout.write('.');
        }
    }

    console.log(`\n✅ ${successCount}개 시설에 랜덤 이미지 배분 완료!`);
}

run();
