/**
 * 시설/상조 이미지 배정 (지역+유형별 라운드로빈 + 연속 중복 방지)
 *
 * 실행 모드:
 *   node scripts/fill_missing_images.cjs              -- 미배정만 (image_url IS NULL)
 *   node scripts/fill_missing_images.cjs --reassign   -- 기본 풀 이미지 사용 중인 시설 전부 재배정
 *   node scripts/fill_missing_images.cjs --dry-run    -- DB 수정 없이 계획만 출력
 *
 * 알고리즘:
 *   1. 시설을 유형별로 분류
 *   2. 각 유형 내에서 지역(시/도)별 그룹핑
 *   3. 각 지역 그룹 내에서 라운드로빈 순환 (연속 2개 같은 이미지 금지)
 *   4. seed = simpleHash(facility.id) → 결정론적 시작 오프셋
 */
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const STORAGE_BASE = 'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images';

// === 이미지 풀 ===
const IMAGE_POOLS = {
    funeral_home: Array.from({ length: 8 }, (_, i) =>
        `/images/defaults/funeral/funeral_${i + 1}.webp`
    ),
    cemetery: Array.from({ length: 11 }, (_, i) =>
        `/images/defaults/cemetery/cemetery_${i + 1}.webp`
    ),
    columbarium: Array.from({ length: 13 }, (_, i) =>
        `${STORAGE_BASE}/optimized-charnel/columbarium_${i + 1}.jpg`
    ),
    natural_burial: Array.from({ length: 8 }, (_, i) =>
        `/images/defaults/natural/natural_${i + 1}.webp`
    ),
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

// 기본 풀 이미지 패턴 (고유 이미지가 아닌 것)
const POOL_PATTERNS = [
    /funeral_real_\d/,
    /\/funeral_\d+\.(jpg|webp)/,
    /Image_fx/,
    /columbarium_\d+\.jpg/,
    /\/natural_\d+\.(png|webp)/,
    /\/cemetery_\d+\.(png|webp)/,
    /optimized-(charnel|natural|pet|sea)\//,
];

function isPoolImage(url) {
    if (!url) return true;
    return POOL_PATTERNS.some(p => p.test(url));
}

function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
    }
    return Math.abs(hash);
}

function extractRegion(address) {
    if (!address) return '알수없음';
    return address.split(' ')[0] || '알수없음';
}

// === 상조 매핑 ===
const SANGJO_EXACT = {
    '3일의약속': '/images/sangjo/3일의 약속.JPG',
    '바른라이프': '/images/sangjo/바른라이프.JPG',
    '착한상조': '/images/sangjo/착한상조.JPG',
    '보람상조개발': '/images/sangjo/보람상조.JPG',
    '보람상조라이프': '/images/sangjo/보람상조.JPG',
    '보람상조리더스': '/images/sangjo/보람상조.JPG',
};
const SANGJO_FALLBACK = [
    '/images/sangjo/gallery/sangjo_gallery_1.jpg',
    '/images/sangjo/gallery/sangjo_gallery_2.jpg',
    '/images/sangjo/gallery/sangjo_gallery_3.jpg',
    '/images/sangjo/gallery/sangjo_gallery_4.jpg',
];

const args = process.argv.slice(2);
const REASSIGN = args.includes('--reassign');
const DRY_RUN = args.includes('--dry-run');

/**
 * 지역 내 시설 목록에 이미지를 라운드로빈 배정
 * @returns {Array<{id, name, imageUrl}>} 배정 결과
 */
function assignRegionGroup(facilities, pool) {
    const results = [];
    // ID 해시로 정렬 → 결정론적 순서
    facilities.sort((a, b) => simpleHash(a.id) - simpleHash(b.id));

    // 지역 해시 기반 시작 오프셋 (같은 지역이라도 유형마다 다른 시작점)
    const regionSeed = facilities.length > 0 ? simpleHash(facilities[0].address || '') : 0;
    let cursor = regionSeed % pool.length;
    let lastImg = null;

    for (const f of facilities) {
        let img = pool[cursor % pool.length];

        // 연속 중복 방지
        if (img === lastImg && pool.length > 1) {
            cursor++;
            img = pool[cursor % pool.length];
        }

        results.push({ id: f.id, name: f.name, type: f.type, imageUrl: img });
        lastImg = img;
        cursor++;
    }

    return results;
}

async function fillFacilities() {
    console.log(`=== 시설 이미지 배정 (${REASSIGN ? '재배정' : '미배정만'}${DRY_RUN ? ', DRY-RUN' : ''}) ===\n`);

    let query = supabase
        .from('facilities')
        .select('id, name, type, address, image_url')
        .order('address')
        .order('name');

    if (!REASSIGN) {
        query = query.or('image_url.is.null,image_url.eq.');
    }

    const { data: facilities, error } = await query;
    if (error) { console.error('DB 오류:', error.message); return; }

    const targets = REASSIGN
        ? facilities.filter(f => isPoolImage(f.image_url))
        : facilities;

    console.log(`대상 시설: ${targets.length}건 (전체 ${facilities.length}건 중)\n`);

    // 유형 → 지역 → 시설[] 3중 그룹핑
    const typeRegionGroups = {};
    for (const f of targets) {
        if (!IMAGE_POOLS[f.type]) continue;
        if (!typeRegionGroups[f.type]) typeRegionGroups[f.type] = {};
        const region = extractRegion(f.address);
        if (!typeRegionGroups[f.type][region]) typeRegionGroups[f.type][region] = [];
        typeRegionGroups[f.type][region].push(f);
    }

    let totalUpdated = 0;
    let totalFailed = 0;
    const allAssignments = [];

    for (const [type, regionMap] of Object.entries(typeRegionGroups)) {
        const pool = IMAGE_POOLS[type];
        let typeCount = 0;

        for (const [region, facs] of Object.entries(regionMap)) {
            const assignments = assignRegionGroup(facs, pool);
            allAssignments.push(...assignments);

            if (DRY_RUN) {
                for (const a of assignments) {
                    console.log(`  [DRY] ${region} | ${a.name} → ${a.imageUrl.split('/').pop()}`);
                }
                typeCount += assignments.length;
                continue;
            }

            // 배치 업데이트
            for (const a of assignments) {
                const { error: updateErr } = await supabase
                    .from('facilities')
                    .update({ image_url: a.imageUrl })
                    .eq('id', a.id);

                if (updateErr) {
                    console.log(`  ❌ ${a.name}: ${updateErr.message}`);
                    totalFailed++;
                } else {
                    typeCount++;
                }
            }
        }

        totalUpdated += typeCount;
        const regionCount = Object.keys(regionMap).length;
        console.log(`  ✅ ${type}: ${typeCount}건 (${regionCount}개 지역, 풀 ${pool.length}장)`);
    }

    console.log(`\n시설 완료: ${totalUpdated}건 업데이트, ${totalFailed}건 실패\n`);

    // 배정 후 검증
    if (!DRY_RUN && totalUpdated > 0) {
        console.log('=== 배정 후 지역별 최대 중복 검증 ===');
        for (const type of Object.keys(typeRegionGroups)) {
            const { data: check } = await supabase
                .from('facilities')
                .select('image_url, address')
                .eq('type', type)
                .not('image_url', 'is', null)
                .order('address');

            if (!check) continue;

            const regionImgs = {};
            for (const f of check) {
                const r = extractRegion(f.address);
                if (!regionImgs[r]) regionImgs[r] = {};
                regionImgs[r][f.image_url] = (regionImgs[r][f.image_url] || 0) + 1;
            }

            let worstDup = 0;
            let worstInfo = '';
            for (const [region, imgs] of Object.entries(regionImgs)) {
                for (const [url, cnt] of Object.entries(imgs)) {
                    if (cnt > worstDup) {
                        worstDup = cnt;
                        worstInfo = `${region}: ${url.split('/').pop()} x${cnt}`;
                    }
                }
            }
            console.log(`  ${type}: 최대 중복 = ${worstInfo}`);
        }
    }
}

async function fillSangjo() {
    console.log('\n=== 상조 이미지 배정 ===\n');

    const { data: noImg, error } = await supabase
        .from('funeral_companies')
        .select('id, name, image_url')
        .or('image_url.is.null,image_url.eq.')
        .order('name');

    if (error) { console.error('DB 오류:', error.message); return; }
    if (noImg.length === 0) { console.log('미배정 상조 없음\n'); return; }
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

        if (DRY_RUN) {
            const label = SANGJO_EXACT[fc.name] ? '정확매칭' : 'gallery';
            console.log(`  [DRY] ${fc.name} (${label}) → ${imageUrl.split('/').pop()}`);
            updated++;
            continue;
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
