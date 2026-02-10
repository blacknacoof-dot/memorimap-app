import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xvmpvzldezpoxxsarizm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2bXB2emxkZXpwb3h4c2FyaXptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NTEwMTksImV4cCI6MjA4MTQyNzAxOX0.TC-SJKzTRANjoLiRi2yg_EHu6xLer2wr-RaJ4AWIv04';
const supabase = createClient(supabaseUrl, supabaseKey);

interface Facility {
    id: string;
    name: string;
    type: string;
    address: string;
    lat: number;
    lng: number;
    phone: string;
    description: string;
    image_url: string;
    gallery_images: string[];
    rating: number;
    review_count: number;
}

async function analyzeFuneralHomes() {
    console.log('========================================');
    console.log('=== 전체 장례식장 현황 분석 리포트 ===');
    console.log('========================================\n');

    // 장례식장만 조회 (funeral 타입)
    const { data: facilities, error } = await supabase
        .from('memorial_spaces')
        .select('*')
        .eq('type', 'funeral');

    if (error) {
        console.error('조회 오류:', error.message);
        return;
    }

    const allFacilities = facilities as Facility[];
    console.log(`📊 총 장례식장 수: ${allFacilities.length}개\n`);

    // 지역별 분류
    const regions: Record<string, Facility[]> = {};
    for (const f of allFacilities) {
        const addr = f.address || '';
        let region = '기타';

        if (addr.includes('서울')) region = '서울';
        else if (addr.includes('부산')) region = '부산';
        else if (addr.includes('대구')) region = '대구';
        else if (addr.includes('인천')) region = '인천';
        else if (addr.includes('광주')) region = '광주';
        else if (addr.includes('대전')) region = '대전';
        else if (addr.includes('울산')) region = '울산';
        else if (addr.includes('세종')) region = '세종';
        else if (addr.includes('경기')) region = '경기';
        else if (addr.includes('강원')) region = '강원';
        else if (addr.includes('충북') || addr.includes('충청북')) region = '충북';
        else if (addr.includes('충남') || addr.includes('충청남')) region = '충남';
        else if (addr.includes('전북') || addr.includes('전라북')) region = '전북';
        else if (addr.includes('전남') || addr.includes('전라남')) region = '전남';
        else if (addr.includes('경북') || addr.includes('경상북')) region = '경북';
        else if (addr.includes('경남') || addr.includes('경상남')) region = '경남';
        else if (addr.includes('제주')) region = '제주';

        if (!regions[region]) regions[region] = [];
        regions[region].push(f);
    }

    // 지역별 통계
    console.log('=== 지역별 장례식장 수 ===\n');
    const sortedRegions = Object.entries(regions).sort((a, b) => b[1].length - a[1].length);
    for (const [region, facs] of sortedRegions) {
        console.log(`${region}: ${facs.length}개`);
    }

    // 이미지 분석
    console.log('\n=== 이미지 현황 ===\n');

    let realImageCount = 0;
    let unsplashImageCount = 0;
    let noImageCount = 0;
    let hasGalleryCount = 0;
    let realGalleryCount = 0;

    for (const f of allFacilities) {
        // 대표이미지
        if (!f.image_url || f.image_url.trim() === '') {
            noImageCount++;
        } else if (f.image_url.includes('unsplash')) {
            unsplashImageCount++;
        } else {
            realImageCount++;
        }

        // 갤러리
        if (f.gallery_images && f.gallery_images.length > 0) {
            hasGalleryCount++;
            // 실제 이미지인지 확인
            const hasRealGallery = f.gallery_images.some(img => !img.includes('unsplash'));
            if (hasRealGallery) realGalleryCount++;
        }
    }

    console.log(`대표이미지:`);
    console.log(`  ✅ 실제 이미지: ${realImageCount}개 (${(realImageCount / allFacilities.length * 100).toFixed(1)}%)`);
    console.log(`  ⚠️ 기본(Unsplash): ${unsplashImageCount}개 (${(unsplashImageCount / allFacilities.length * 100).toFixed(1)}%)`);
    console.log(`  ❌ 없음: ${noImageCount}개 (${(noImageCount / allFacilities.length * 100).toFixed(1)}%)`);
    console.log(`\n갤러리 이미지:`);
    console.log(`  갤러리 있음: ${hasGalleryCount}개 (${(hasGalleryCount / allFacilities.length * 100).toFixed(1)}%)`);
    console.log(`  실제 갤러리: ${realGalleryCount}개 (${(realGalleryCount / allFacilities.length * 100).toFixed(1)}%)`);

    // 좌표 분석
    console.log('\n=== 좌표(위치) 현황 ===\n');

    let validCoords = 0;
    let invalidCoords = 0;
    let koreanCoords = 0; // 한국 범위 내 좌표

    for (const f of allFacilities) {
        if (f.lat && f.lng && f.lat !== 0 && f.lng !== 0) {
            validCoords++;
            // 한국 범위: 위도 33~43, 경도 124~132
            if (f.lat >= 33 && f.lat <= 43 && f.lng >= 124 && f.lng <= 132) {
                koreanCoords++;
            }
        } else {
            invalidCoords++;
        }
    }

    console.log(`✅ 좌표 있음: ${validCoords}개 (${(validCoords / allFacilities.length * 100).toFixed(1)}%)`);
    console.log(`✅ 한국 범위 내: ${koreanCoords}개 (${(koreanCoords / allFacilities.length * 100).toFixed(1)}%)`);
    console.log(`❌ 좌표 없음/오류: ${invalidCoords}개 (${(invalidCoords / allFacilities.length * 100).toFixed(1)}%)`);

    // 소개(설명) 분석
    console.log('\n=== 소개(설명) 현황 ===\n');

    let hasDesc = 0;
    let noDesc = 0;

    for (const f of allFacilities) {
        if (f.description && f.description.trim() !== '') {
            hasDesc++;
        } else {
            noDesc++;
        }
    }

    console.log(`✅ 소개 있음: ${hasDesc}개 (${(hasDesc / allFacilities.length * 100).toFixed(1)}%)`);
    console.log(`❌ 소개 없음: ${noDesc}개 (${(noDesc / allFacilities.length * 100).toFixed(1)}%)`);

    // 리뷰 분석
    console.log('\n=== 리뷰 현황 ===\n');

    let hasReviews = 0;
    let totalReviews = 0;
    let hasRating = 0;

    for (const f of allFacilities) {
        if (f.review_count && f.review_count > 0) {
            hasReviews++;
            totalReviews += f.review_count;
        }
        if (f.rating && f.rating > 0) {
            hasRating++;
        }
    }

    console.log(`리뷰 있는 시설: ${hasReviews}개 (${(hasReviews / allFacilities.length * 100).toFixed(1)}%)`);
    console.log(`총 리뷰 수: ${totalReviews}개`);
    console.log(`평점 있는 시설: ${hasRating}개 (${(hasRating / allFacilities.length * 100).toFixed(1)}%)`);

    // 전화번호 분석
    console.log('\n=== 연락처 현황 ===\n');

    let hasPhone = 0;
    for (const f of allFacilities) {
        if (f.phone && f.phone.trim() !== '') {
            hasPhone++;
        }
    }

    console.log(`✅ 전화번호 있음: ${hasPhone}개 (${(hasPhone / allFacilities.length * 100).toFixed(1)}%)`);
    console.log(`❌ 전화번호 없음: ${allFacilities.length - hasPhone}개 (${((allFacilities.length - hasPhone) / allFacilities.length * 100).toFixed(1)}%)`);

    // 지역별 상세
    console.log('\n\n========================================');
    console.log('=== 지역별 상세 현황 ===');
    console.log('========================================\n');

    for (const [region, facs] of sortedRegions) {
        const realImg = facs.filter(f => f.image_url && !f.image_url.includes('unsplash')).length;
        const hasCoords = facs.filter(f => f.lat && f.lng && f.lat !== 0 && f.lng !== 0).length;
        const hasDescr = facs.filter(f => f.description && f.description.trim() !== '').length;

        console.log(`📍 ${region} (${facs.length}개)`);
        console.log(`   이미지: ${realImg}/${facs.length} | 좌표: ${hasCoords}/${facs.length} | 소개: ${hasDescr}/${facs.length}`);
    }

    // 문제 시설 샘플
    console.log('\n\n========================================');
    console.log('=== 좌표 누락 시설 (샘플) ===');
    console.log('========================================\n');

    const noCoordsFacs = allFacilities.filter(f => !f.lat || !f.lng || f.lat === 0 || f.lng === 0).slice(0, 10);
    for (const f of noCoordsFacs) {
        console.log(`❌ ${f.name}`);
        console.log(`   주소: ${f.address}`);
    }
}

analyzeFuneralHomes().catch(console.error);
