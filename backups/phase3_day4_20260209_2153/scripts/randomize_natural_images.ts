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

const SOURCE_DIR = path.resolve(rootDir, 'data/자연장');
const BUCKET = 'facility-images';
const STORAGE_PREFIX = 'natural_random';

// 섞기 함수
function shuffle<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

async function run() {
    console.log('🌿 자연장 이미지 랜덤 배분 시작...');

    if (!fs.existsSync(SOURCE_DIR)) {
        console.error(`❌ 소스 폴더가 없습니다: ${SOURCE_DIR}`);
        return;
    }

    // 1. 파일 업로드 및 URL 확보
    console.log('📤 이미지 업로드 중...');
    const files = fs.readdirSync(SOURCE_DIR).filter(f => f.endsWith('.jpg') || f.endsWith('.png'));
    const imageUrls: string[] = [];
    let idx = 1;

    for (const file of files) {
        const filePath = path.join(SOURCE_DIR, file);
        const fileBuffer = fs.readFileSync(filePath);

        // 파일명 안전하게 변경 (natural_random_1.png 등)
        const ext = path.extname(file);
        const safeName = `img_${idx++}${ext}`;
        const storageKey = `${STORAGE_PREFIX}/${safeName}`;

        const { error: uploadError } = await supabase.storage
            .from(BUCKET)
            .upload(storageKey, fileBuffer, {
                contentType: 'image/png', // 대부분 png였음
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

    // 2. 대상 시설 조회 (category = 'natural_burial')
    const { data: facilities, error: fetchError } = await supabase
        .from('facilities')
        .select('id, name, images')
        .eq('category', 'natural_burial');

    if (fetchError) {
        console.error('❌ 시설 조회 실패:', fetchError);
        return;
    }

    // 타겟 필터링: 이미지가 없거나, 기본 이미지('defaults/natural')를 포함하는 경우
    // 아까 복구 작업으로 'defaults/natural_final...' 등이 들어가 있음.
    const targets = facilities.filter(f => {
        if (!f.images || f.images.length === 0) return true;

        const isDefault = f.images.some((url: string) =>
            url.includes('defaults/natural') ||
            url.includes('placeholder')
        );
        return isDefault;
    });

    console.log(`🎯 대상 시설: ${targets.length}개 (총 ${facilities.length}개 중)`);

    // 3. 랜덤 업데이트
    console.log('🎲 이미지 배분 및 업데이트 중...');
    let successCount = 0;

    for (const facility of targets) {
        // 8개 중 랜덤 3개 선택 (이미지가 적으면 있는 대로)
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
            if (successCount % 10 === 0) process.stdout.write('.');
        }
    }

    console.log(`\n✅ ${successCount}개 시설에 랜덤 이미지 배분 완료!`);
}

run();
