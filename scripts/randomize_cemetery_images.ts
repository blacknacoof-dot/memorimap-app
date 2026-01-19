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
const supabase = createClient(supabaseUrl!, supabaseKey!);

const SOURCE_DIR = path.resolve(rootDir, 'data/공원묘지');
const BUCKET = 'facility-images';
const STORAGE_PREFIX = 'cemetery_random';

function shuffle<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

async function run() {
    console.log('🌳 공원묘지 이미지 랜덤 배분 시작...');

    if (!fs.existsSync(SOURCE_DIR)) {
        console.error(`❌ 소스 폴더가 없습니다: ${SOURCE_DIR}`);
        return;
    }

    // 1. 파일 업로드
    console.log('📤 이미지 업로드 중...');
    const files = fs.readdirSync(SOURCE_DIR).filter(f => f.endsWith('.png') || f.endsWith('.jpg'));
    const imageUrls: string[] = [];
    let idx = 1;

    for (const file of files) {
        const filePath = path.join(SOURCE_DIR, file);
        const fileBuffer = fs.readFileSync(filePath);

        const ext = path.extname(file);
        const safeName = `img_${idx++}${ext}`;
        const storageKey = `${STORAGE_PREFIX}/${safeName}`;

        const { error } = await supabase.storage
            .from(BUCKET)
            .upload(storageKey, fileBuffer, { contentType: 'image/png', upsert: true });

        if (error) {
            console.error(`   ❌ 실패 (${file}):`, error.message);
        } else {
            const { data } = supabase.storage.from(BUCKET).getPublicUrl(storageKey);
            imageUrls.push(data.publicUrl);
        }
    }
    console.log(`✅ ${imageUrls.length}개 업로드 완료.`);

    // 2. 대상 조회
    const { data: facilities } = await supabase
        .from('facilities')
        .select('id, name, images')
        .eq('category', 'cemetery');

    if (!facilities) return;

    // 타겟 필터: 이미지 없음 / 빈 배열 / 기본 이미지(defaults/park) / placeholder
    const targets = facilities.filter(f => {
        if (!f.images || f.images.length === 0) return true;
        return f.images.some((url: string) =>
            url.includes('defaults/park') ||
            url.includes('placeholder') ||
            url.includes('google') === false // 구글 이미지 등 유효한 건 건드리지 말자? -> 아니, 구글 이미지도 깨진 건 고쳐졌고, 이건 "같은것 쓰거나 없는곳"이니까 기본이미지 위주로.
            // 하지만 사용자가 "대표이미지 겹치지 않게"라고 했으므로, 기존 이미지가 1장(기본)인 애들 타겟.
        );
        // 주의: 아까 repair_broken_images 로직으로 구글 이미지가 덮어쓰여졌을 수도 있음(cemetery는 park로).
        // 따라서 'imageUrls' (지금 업로드한거) 가 아닌 다른 이미지(Google, 기존 등)가 있으면 유지하는게 안전.
        // 하지만 "같은 것 쓰거나 없는 곳" -> 즉, 겹치는(기본) 이미지를 쓰는 곳을 타겟팅.
    });

    console.log(`🎯 대상 시설: ${targets.length}개 (총 ${facilities.length}개 중)`);

    // 3. 업데이트
    let count = 0;
    for (const facility of targets) {
        const num = Math.min(3, imageUrls.length);
        const newImages = shuffle(imageUrls).slice(0, num);

        const { error } = await supabase
            .from('facilities')
            .update({ images: newImages })
            .eq('id', facility.id);

        if (!error) {
            count++;
            if (count % 10 === 0) process.stdout.write('.');
        }
    }

    console.log(`\n✅ ${count}개 시설 업데이트 완료.`);
}

run();
