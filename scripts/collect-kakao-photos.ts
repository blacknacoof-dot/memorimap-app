/**
 * 카카오맵에서 시설 사진 수집 (Playwright 사용)
 * - 카카오 API로 place_url 수집 → Playwright로 사진 URL 추출
 * - 리뷰/점수는 수집하지 않음
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import { chromium, Browser, Page } from 'playwright';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const kakaoApiKey = process.env.VITE_KAKAO_REST_API_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

interface CollectedFacility {
    facility_id: number;
    facility_name: string;
    db_address: string;
    db_phone: string | null;
    kakao_name: string;
    kakao_address: string;
    kakao_phone: string | null;
    kakao_place_url: string;
    photos: string[];
    match_score: number;
}

interface KakaoPlace {
    place_name: string;
    address_name: string;
    road_address_name: string;
    phone: string;
    place_url: string;
}

async function searchKakaoPlace(query: string, address?: string): Promise<KakaoPlace | null> {
    try {
        const searchQuery = address ? `${query} ${address.split(' ')[0]}` : query;

        const response = await fetch(
            `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(searchQuery)}&size=5`,
            {
                headers: { Authorization: `KakaoAK ${kakaoApiKey}` }
            }
        );

        if (!response.ok) return null;
        const data = await response.json();

        if (data.documents && data.documents.length > 0) {
            const relevant = data.documents.find((d: KakaoPlace) =>
                d.place_name.includes(query.substring(0, 4))
            );
            return relevant || data.documents[0];
        }
        return null;
    } catch (error) {
        return null;
    }
}

function calculateMatchScore(dbName: string, dbAddress: string, kakao: KakaoPlace): number {
    let score = 0;
    const dbNameClean = dbName.replace(/[^\w가-힣]/g, '');
    const kakaoNameClean = kakao.place_name.replace(/[^\w가-힣]/g, '');

    if (dbNameClean === kakaoNameClean) score += 50;
    else if (kakaoNameClean.includes(dbNameClean) || dbNameClean.includes(kakaoNameClean)) score += 30;
    else if (dbNameClean.substring(0, 4) === kakaoNameClean.substring(0, 4)) score += 20;

    const dbAddrParts = dbAddress.split(' ').slice(0, 3).join(' ');
    const kakaoAddr = kakao.road_address_name || kakao.address_name;
    if (kakaoAddr && kakaoAddr.includes(dbAddrParts)) score += 50;
    else if (kakaoAddr && dbAddrParts.split(' ').some(part => kakaoAddr.includes(part))) score += 25;

    return score;
}

async function getPhotosFromKakaoMap(page: Page, placeUrl: string): Promise<string[]> {
    const photos: string[] = [];

    try {
        await page.goto(placeUrl, { waitUntil: 'networkidle', timeout: 15000 });
        await page.waitForTimeout(2000);

        // 사진 영역 찾기
        const photoSelectors = [
            '.photo_area img',
            '.photo_slider img',
            '.bg_present',
            '[class*="photo"] img',
            '.view_photo img',
            '.cont_photo img'
        ];

        for (const selector of photoSelectors) {
            const images = await page.$$(selector);
            for (const img of images) {
                const src = await img.getAttribute('src');
                if (src && !src.includes('sprite') && !src.includes('icon') && src.startsWith('http')) {
                    // 고해상도 버전으로 변환
                    const highRes = src.replace(/\/thumb\/\d+x\d+\//, '/origin/');
                    if (!photos.includes(highRes)) {
                        photos.push(highRes);
                    }
                }
            }
            if (photos.length >= 3) break;
        }

        // 배경 이미지도 체크
        if (photos.length < 3) {
            const bgElements = await page.$$('[style*="background-image"]');
            for (const el of bgElements) {
                const style = await el.getAttribute('style');
                if (style) {
                    const match = style.match(/url\(['"]?(https?:\/\/[^'")\s]+)['"]?\)/);
                    if (match && !photos.includes(match[1])) {
                        photos.push(match[1]);
                    }
                }
                if (photos.length >= 3) break;
            }
        }

    } catch (error) {
        console.log(`    사진 수집 실패: ${error}`);
    }

    return photos.slice(0, 3);
}

async function main() {
    console.log('🚀 카카오맵 사진 수집 시작 (Playwright)\n');

    // DB에서 사진 없는 시설 조회
    const { data: facilities, error } = await supabase
        .from('memorial_spaces')
        .select('id, name, type, address, phone, image_url, gallery_images')
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

    console.log(`📋 사진 없는 시설: ${noPhotos.length}개\n`);

    // 브라우저 시작
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    const collectedData: CollectedFacility[] = [];
    let processed = 0;
    let withPhotos = 0;

    for (const facility of noPhotos) {
        processed++;

        if (processed % 10 === 0) {
            console.log(`\n📊 진행: ${processed}/${noPhotos.length} (${Math.round(processed / noPhotos.length * 100)}%) - 사진수집: ${withPhotos}개\n`);
        }

        // 1. 카카오 API로 장소 검색
        const kakaoResult = await searchKakaoPlace(facility.name, facility.address);

        if (!kakaoResult) {
            console.log(`❌ [${processed}] ${facility.name} - 검색 결과 없음`);
            continue;
        }

        const matchScore = calculateMatchScore(facility.name, facility.address || '', kakaoResult);

        if (matchScore < 40) {
            console.log(`⚠️ [${processed}] ${facility.name} - 낮은 매칭 점수 (${matchScore})`);
            continue;
        }

        // 2. Playwright로 사진 수집
        console.log(`🔍 [${processed}] ${facility.name} → ${kakaoResult.place_name}`);
        const photos = await getPhotosFromKakaoMap(page, kakaoResult.place_url);

        if (photos.length > 0) {
            withPhotos++;
            console.log(`   ✅ 사진 ${photos.length}개 수집`);
        } else {
            console.log(`   ⚠️ 사진 없음`);
        }

        collectedData.push({
            facility_id: facility.id,
            facility_name: facility.name,
            db_address: facility.address || '',
            db_phone: facility.phone,
            kakao_name: kakaoResult.place_name,
            kakao_address: kakaoResult.road_address_name || kakaoResult.address_name,
            kakao_phone: kakaoResult.phone || null,
            kakao_place_url: kakaoResult.place_url,
            photos,
            match_score: matchScore
        });

        // API 제한 방지
        await new Promise(resolve => setTimeout(resolve, 500));

        // 50개마다 중간 저장
        if (processed % 50 === 0) {
            fs.writeFileSync('scripts/kakao-photos-partial.json', JSON.stringify(collectedData, null, 2));
            console.log(`💾 중간 저장: ${collectedData.length}개`);
        }
    }

    await browser.close();

    // 최종 저장
    fs.writeFileSync('scripts/kakao-photos-collected.json', JSON.stringify(collectedData, null, 2));

    // 리포트 생성
    const withPhotosList = collectedData.filter(d => d.photos.length > 0);
    const withPhoneUpdate = collectedData.filter(d => d.kakao_phone && !d.db_phone);

    let report = `# 카카오맵 데이터 수집 결과\n\n`;
    report += `생성일: ${new Date().toLocaleString('ko-KR')}\n\n`;
    report += `## 요약\n`;
    report += `- 처리 시설: ${processed}개\n`;
    report += `- 매칭 성공: ${collectedData.length}개\n`;
    report += `- 사진 수집 성공: ${withPhotosList.length}개\n`;
    report += `- 전화번호 업데이트 가능: ${withPhoneUpdate.length}개\n\n`;

    report += `## 사진 수집 성공 목록 (상위 30개)\n\n`;
    report += `| 시설명 | 사진수 | 전화번호 |\n`;
    report += `|--------|--------|----------|\n`;
    for (const d of withPhotosList.slice(0, 30)) {
        report += `| ${d.facility_name} | ${d.photos.length} | ${d.kakao_phone || '-'} |\n`;
    }

    fs.writeFileSync('scripts/kakao-photos-report.md', report);

    console.log('\n' + '='.repeat(50));
    console.log('📊 수집 완료!');
    console.log(`   총 처리: ${processed}개`);
    console.log(`   매칭 성공: ${collectedData.length}개`);
    console.log(`   사진 수집: ${withPhotosList.length}개`);
    console.log('\n📁 저장된 파일:');
    console.log('   - scripts/kakao-photos-collected.json');
    console.log('   - scripts/kakao-photos-report.md');
}

main().catch(console.error);
