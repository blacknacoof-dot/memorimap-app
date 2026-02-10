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
const supabase = createClient(supabaseUrl!, supabaseKey!);

const CATEGORIES = ['pet_funeral', 'cemetery', 'natural_burial', 'columbarium'];

// 카테고리별 이미지 키워드 매핑
const CATEGORY_KEYWORDS: Record<string, string> = {
    'pet_funeral': 'pet',
    'cemetery': 'park',
    'natural_burial': 'natural',
    'columbarium': 'charnel' // 또는 'columbarium'
};

// 섞기 함수
function shuffle<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

async function repairImages() {
    console.log('🛠️ 깨진 이미지 복구 및 랜덤 재할당 시작...');

    // 1. 카테고리별 교체용 이미지 풀 확보 (Supabase Storage)
    const imagePool: Record<string, string[]> = {};

    // 전체 파일 목록 가져오기 (폴더별로 뒤져야 함)
    // defaults, columbarium_random, natural_random, pet_random? (아까 업로드한 경로들)
    // 간단히 'facility-images' 버킷의 전체 파일을 훑어보는 게 나을 수도 있지만, 
    // 아까 업로드한 경로를 알기에 지정해서 가져옴.

    // A. columbarium_random
    const { data: colFiles } = await supabase.storage.from('facility-images').list('columbarium_random');
    if (colFiles) {
        imagePool['columbarium'] = colFiles.map(f => supabase.storage.from('facility-images').getPublicUrl(`columbarium_random/${f.name}`).data.publicUrl);
    }

    // B. natural_random
    const { data: natFiles } = await supabase.storage.from('facility-images').list('natural_random');
    if (natFiles) {
        imagePool['natural_burial'] = natFiles.map(f => supabase.storage.from('facility-images').getPublicUrl(`natural_random/${f.name}`).data.publicUrl);
    }

    // C. Defaults (pet, park 등) - 보조
    const { data: defFiles } = await supabase.storage.from('facility-images').list('defaults');
    if (defFiles) {
        // pet
        const petUrls = defFiles.filter(f => f.name.includes('pet')).map(f => supabase.storage.from('facility-images').getPublicUrl(`defaults/${f.name}`).data.publicUrl);
        imagePool['pet_funeral'] = petUrls; // (아까 pet 랜덤 폴더는 안만들었었나? data 폴더에 있는게 다였나? 확인 필요하지만 일단 default 활용)

        // park (cemetery)
        const parkUrls = defFiles.filter(f => f.name.includes('park')).map(f => supabase.storage.from('facility-images').getPublicUrl(`defaults/${f.name}`).data.publicUrl);
        imagePool['cemetery'] = parkUrls;
    }

    console.log('📊 이미지 풀 준비 완료:');
    Object.entries(imagePool).forEach(([k, v]) => console.log(`   - ${k}: ${v.length}장`));


    // 2. 검사 및 복구 실행
    const { data: facilities } = await supabase
        .from('facilities')
        .select('id, name, category, images')
        .in('category', CATEGORIES);

    if (!facilities) return;

    console.log(`총 ${facilities.length}개 시설 검사 및 복구 실행...`);
    let repairCount = 0;
    const BATCH_SIZE = 20;

    for (let i = 0; i < facilities.length; i += BATCH_SIZE) {
        const batch = facilities.slice(i, i + BATCH_SIZE);
        const promises = batch.map(async (facility) => {
            if (!facility.images || facility.images.length === 0) {
                // 이미지가 없으면 복구 대상
                await updateFacilityImage(facility, imagePool);
                return;
            }

            const url = facility.images[0];
            if (!url) return;

            // Supabase 이미지는 건너뜀 (이미 고쳐진 것)
            if (url.includes('supabase.co')) return;

            // 유효성 체크 check HEAD
            try {
                const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(2000) });
                if (!res.ok) {
                    process.stdout.write('x');
                    await updateFacilityImage(facility, imagePool);
                    repairCount++;
                } else {
                    process.stdout.write('.');
                }
            } catch (error) {
                process.stdout.write('E');
                await updateFacilityImage(facility, imagePool); // 에러나면 깨진걸로 간주 (Timeout/DNS error)
                repairCount++;
            }
        });

        await Promise.all(promises);
    }

    console.log(`\n✅ 총 ${repairCount}개 시설의 깨진 이미지를 복구했습니다.`);
}

async function updateFacilityImage(facility: any, imagePool: Record<string, string[]>) {
    const pool = imagePool[facility.category];
    if (!pool || pool.length === 0) return; // 풀이 없으면 못바꿈

    // 랜덤 3장
    const count = Math.min(3, pool.length);
    const newImages = shuffle(pool).slice(0, count);

    await supabase
        .from('facilities')
        .update({ images: newImages })
        .eq('id', facility.id);
}

repairImages();
