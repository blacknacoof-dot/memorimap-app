/**
 * Google 이미지 검색으로 시설 사진 수집
 * - Playwright로 Google Images 검색
 * - 시설당 최대 3장 수집
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import { chromium, Browser, Page } from 'playwright';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface CollectedPhoto {
    facility_id: number;
    facility_name: string;
    facility_type: string;
    photos: string[];
}

async function searchGoogleImages(page: Page, query: string): Promise<string[]> {
    const photos: string[] = [];

    try {
        // Google 이미지 검색
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=isch`;
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForTimeout(2000);

        // 이미지 썸네일 수집
        const images = await page.$$('img[src^="http"]');

        for (const img of images) {
            if (photos.length >= 3) break;

            const src = await img.getAttribute('src');
            if (src &&
                src.startsWith('http') &&
                !src.includes('google.com') &&
                !src.includes('gstatic.com') &&
                !src.includes('data:image') &&
                src.length > 50) {
                photos.push(src);
            }
        }

        // 대체: data-src 또는 data-iurl 속성
        if (photos.length < 3) {
            const allImgs = await page.$$('img[data-src], img[data-iurl], div[data-tbnid] img');
            for (const img of allImgs) {
                if (photos.length >= 3) break;

                const src = await img.getAttribute('data-src') ||
                    await img.getAttribute('data-iurl') ||
                    await img.getAttribute('src');

                if (src &&
                    src.startsWith('http') &&
                    !src.includes('google') &&
                    !src.includes('gstatic') &&
                    !photos.includes(src)) {
                    photos.push(src);
                }
            }
        }

    } catch (error) {
        console.log(`    검색 실패: ${error}`);
    }

    return photos.slice(0, 3);
}

async function main() {
    console.log('🔍 Google 이미지 검색으로 사진 수집 시작\n');

    // 사진 없는 시설 조회
    const { data: facilities, error } = await supabase
        .from('memorial_spaces')
        .select('id, name, type, address, image_url, gallery_images')
        .order('type')
        .order('name');

    if (error) {
        console.error('DB Error:', error);
        return;
    }

    const noPhotos = facilities.filter(f => {
        const hasImageUrl = f.image_url && f.image_url.trim() !== '';
        const hasGallery = f.gallery_images && Array.isArray(f.gallery_images) && f.gallery_images.length > 0;
        return !hasImageUrl && !hasGallery;
    });

    // 테스트: 처음 20개만
    const testBatch = noPhotos.slice(0, 20);
    console.log(`📋 테스트: 처음 ${testBatch.length}개 시설\n`);

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();

    const collectedPhotos: CollectedPhoto[] = [];
    let processed = 0;
    let withPhotos = 0;

    for (const facility of testBatch) {
        processed++;

        // 검색어: 시설명 + 타입
        const typeKorean: Record<string, string> = {
            'funeral': '장례식장',
            'charnel': '봉안당',
            'park': '추모공원',
            'complex': '추모공원',
            'pet': '동물장례'
        };
        const searchQuery = `${facility.name} ${typeKorean[facility.type] || ''} 시설`;

        console.log(`[${processed}/${testBatch.length}] ${facility.name}`);

        const photos = await searchGoogleImages(page, searchQuery);

        if (photos.length > 0) {
            withPhotos++;
            console.log(`   ✅ ${photos.length}개 사진 수집`);
            collectedPhotos.push({
                facility_id: facility.id,
                facility_name: facility.name,
                facility_type: facility.type,
                photos
            });
        } else {
            console.log(`   ⚠️ 사진 없음`);
        }

        // 요청 간격
        await page.waitForTimeout(1000);
    }

    await browser.close();

    // 결과 저장
    fs.writeFileSync('scripts/google-photos-collected.json', JSON.stringify(collectedPhotos, null, 2));

    console.log('\n' + '='.repeat(50));
    console.log(`📊 수집 완료`);
    console.log(`   처리: ${processed}개`);
    console.log(`   사진 수집 성공: ${withPhotos}개`);
    console.log(`\n📁 저장: scripts/google-photos-collected.json`);

    // 샘플 출력
    if (collectedPhotos.length > 0) {
        console.log('\n📷 수집된 사진 샘플:');
        for (const p of collectedPhotos.slice(0, 3)) {
            console.log(`\n${p.facility_name}:`);
            p.photos.forEach((url, i) => console.log(`  ${i + 1}. ${url.substring(0, 80)}...`));
        }
    }
}

main().catch(console.error);
