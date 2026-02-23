/**
 * 이미지 없는 시설/상조에 기본 이미지 배정
 * 실행: node scripts/fill_missing_images.cjs
 */
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const STORAGE_BASE = 'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images';

const IMAGE_POOLS = {
    columbarium: Array.from({ length: 13 }, (_, i) =>
        `${STORAGE_BASE}/optimized-charnel/columbarium_${i + 1}.jpg`
    ),
    funeral_home: Array.from({ length: 8 }, (_, i) =>
        `/images/defaults/funeral/funeral_${i + 1}.jpg`
    ),
    natural_burial: [
        `${STORAGE_BASE}/optimized-natural/Image_fx%20(7).png`,
        `${STORAGE_BASE}/optimized-natural/Image_fx%20(9).png`,
        `${STORAGE_BASE}/optimized-natural/Image_fx%20(10).png`,
        `${STORAGE_BASE}/optimized-natural/Image_fx%20(11).png`,
        `${STORAGE_BASE}/optimized-natural/Image_fx%20(12).png`,
        `${STORAGE_BASE}/optimized-natural/Image_fx%20(13).png`,
        `${STORAGE_BASE}/optimized-natural/Image_fx%20(14).png`,
        `${STORAGE_BASE}/optimized-natural/Image_fx%20(15).png`,
    ],
    pet_funeral: [
        `${STORAGE_BASE}/optimized-pet/Image_fx%20(16).png`,
        `${STORAGE_BASE}/optimized-pet/Image_fx%20(18).png`,
        `${STORAGE_BASE}/optimized-pet/Image_fx%20(19).png`,
        `${STORAGE_BASE}/optimized-pet/Image_fx%20(20).png`,
        `${STORAGE_BASE}/optimized-pet/Image_fx%20(21).png`,
        `${STORAGE_BASE}/optimized-pet/Image_fx%20(22).png`,
        `${STORAGE_BASE}/optimized-pet/Image_fx%20(23).png`,
        `${STORAGE_BASE}/optimized-pet/Image_fx%20(24).png`,
        `${STORAGE_BASE}/optimized-pet/Image_fx%20(25).png`,
        `${STORAGE_BASE}/optimized-pet/Image_fx%20(26).png`,
        `${STORAGE_BASE}/optimized-pet/Image_fx%20(27).png`,
        `${STORAGE_BASE}/optimized-pet/Image_fx%20(28).png`,
        `${STORAGE_BASE}/optimized-pet/Image_fx%20(29).png`,
    ],
    sea_burial: [
        `${STORAGE_BASE}/optimized-sea/Image_fx%20(4).png`,
        `${STORAGE_BASE}/optimized-sea/Image_fx%20(6).png`,
    ],
};

// 상조 이름 → 이미지 매핑 (정확 매칭)
const SANGJO_EXACT = {
    '3일의약속': '/images/sangjo/3일의 약속.JPG',
    '바른라이프': '/images/sangjo/바른라이프.JPG',
    '착한상조': '/images/sangjo/착한상조.JPG',
    '보람상조개발': '/images/sangjo/보람상조.JPG',
    '보람상조라이프': '/images/sangjo/보람상조.JPG',
    '보람상조리더스': '/images/sangjo/보람상조.JPG',
};

// 매칭 안 되는 상조 → gallery 이미지 순서대로
const SANGJO_FALLBACK = [
    '/images/sangjo/gallery/sangjo_gallery_1.jpg',
    '/images/sangjo/gallery/sangjo_gallery_2.jpg',
    '/images/sangjo/gallery/sangjo_gallery_3.jpg',
    '/images/sangjo/gallery/sangjo_gallery_4.jpg',
];

function pickRandom(arr, seed) {
    return arr[seed % arr.length];
}

async function fillFacilities() {
    console.log('=== 시설 이미지 배정 ===\n');

    const { data: noImg, error } = await supabase
        .from('facilities')
        .select('id, name, type')
        .or('image_url.is.null,image_url.eq.')
        .order('type')
        .order('name');

    if (error) { console.error('DB 오류:', error.message); return; }
    console.log(`이미지 없는 시설: ${noImg.length}건\n`);

    let updated = 0;
    let failed = 0;

    for (let i = 0; i < noImg.length; i++) {
        const f = noImg[i];
        const pool = IMAGE_POOLS[f.type];
        if (!pool) {
            console.log(`  ⚠️ [${f.type}] ${f.name} — 이미지 풀 없음, 건너뜀`);
            failed++;
            continue;
        }

        const imageUrl = pickRandom(pool, i);

        const { error: updateErr } = await supabase
            .from('facilities')
            .update({ image_url: imageUrl })
            .eq('id', f.id);

        if (updateErr) {
            console.log(`  ❌ ${f.name}: ${updateErr.message}`);
            failed++;
        } else {
            console.log(`  ✅ [${f.type}] ${f.name} → ${imageUrl.split('/').pop()}`);
            updated++;
        }
    }

    console.log(`\n시설 완료: ${updated}건 업데이트, ${failed}건 실패\n`);
}

async function fillSangjo() {
    console.log('=== 상조 이미지 배정 ===\n');

    const { data: noImg, error } = await supabase
        .from('funeral_companies')
        .select('id, name, image_url')
        .or('image_url.is.null,image_url.eq.')
        .order('name');

    if (error) { console.error('DB 오류:', error.message); return; }
    console.log(`이미지 없는 상조: ${noImg.length}건\n`);

    let updated = 0;
    let failed = 0;
    let fallbackIdx = 0;

    for (const fc of noImg) {
        let imageUrl = SANGJO_EXACT[fc.name];

        if (!imageUrl) {
            imageUrl = SANGJO_FALLBACK[fallbackIdx % SANGJO_FALLBACK.length];
            fallbackIdx++;
        }

        const { error: updateErr } = await supabase
            .from('funeral_companies')
            .update({ image_url: imageUrl })
            .eq('id', fc.id);

        if (updateErr) {
            console.log(`  ❌ ${fc.name}: ${updateErr.message}`);
            failed++;
        } else {
            const label = SANGJO_EXACT[fc.name] ? '정확매칭' : 'gallery';
            console.log(`  ✅ ${fc.name} (${label}) → ${imageUrl.split('/').pop()}`);
            updated++;
        }
    }

    console.log(`\n상조 완료: ${updated}건 업데이트, ${failed}건 실패\n`);
}

async function main() {
    await fillFacilities();
    await fillSangjo();
    console.log('=== 전체 완료 ===');
}

main().catch(console.error);
