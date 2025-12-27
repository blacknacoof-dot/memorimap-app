import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
);

async function analyzeDataGaps() {
    console.log('📊 시설 데이터 현황 분석 시작...\n');

    // 1. 전체 시설 가져오기
    const { data: facilities, error } = await supabase
        .from('memorial_spaces')
        .select('id, name, type, image_url, prices, description, phone, gallery_images, address');

    if (error) {
        console.error('❌ DB 조회 실패:', error.message);
        return;
    }

    console.log(`📋 전체 시설 수: ${facilities?.length || 0}개\n`);

    // 2. 타입별 분류
    const byType: Record<string, any[]> = {};
    facilities?.forEach(f => {
        if (!byType[f.type]) byType[f.type] = [];
        byType[f.type].push(f);
    });

    console.log('=== 타입별 시설 수 ===');
    Object.entries(byType).forEach(([type, list]) => {
        console.log(`  ${type}: ${list.length}개`);
    });
    console.log();

    // 3. 데이터 미비 분석
    const analysis: Record<string, any> = {};

    for (const [type, list] of Object.entries(byType)) {
        const missing = {
            noPhoto: 0,
            noGallery: 0,
            noPrice: 0,
            noDescription: 0,
            noPhone: 0,
            englishAddress: 0,
            complete: 0
        };

        const incompleteList: string[] = [];

        list.forEach(f => {
            let isIncomplete = false;

            // 사진 없음 (기본 이미지 또는 null)
            if (!f.image_url || f.image_url.includes('unsplash')) {
                missing.noPhoto++;
                isIncomplete = true;
            }

            // 갤러리 없음
            if (!f.gallery_images || f.gallery_images.length === 0) {
                missing.noGallery++;
                isIncomplete = true;
            }

            // 가격 없음
            if (!f.prices || (Array.isArray(f.prices) && f.prices.length === 0)) {
                missing.noPrice++;
                isIncomplete = true;
            }

            // 설명 없음
            if (!f.description || f.description.length < 10) {
                missing.noDescription++;
                isIncomplete = true;
            }

            // 전화번호 없음
            if (!f.phone) {
                missing.noPhone++;
                isIncomplete = true;
            }

            // 영문 주소
            if (f.address && /South Korea|Korea|KR$/i.test(f.address)) {
                missing.englishAddress++;
            }

            if (!isIncomplete) {
                missing.complete++;
            } else {
                incompleteList.push(f.name);
            }
        });

        analysis[type] = {
            total: list.length,
            complete: missing.complete,
            incomplete: list.length - missing.complete,
            details: missing,
            incompleteNames: incompleteList.slice(0, 10) // 처음 10개만
        };
    }

    // 4. 결과 출력
    console.log('=== 데이터 미비 현황 ===\n');

    let totalIncomplete = 0;
    let totalNoPhoto = 0;
    let totalNoPrice = 0;
    let totalEnglishAddr = 0;

    for (const [type, data] of Object.entries(analysis)) {
        const typeName = getTypeName(type);
        console.log(`📁 ${typeName} (${type})`);
        console.log(`   총: ${data.total}개 | 완전: ${data.complete}개 | 미비: ${data.incomplete}개`);
        console.log(`   - 사진 없음: ${data.details.noPhoto}개`);
        console.log(`   - 갤러리 없음: ${data.details.noGallery}개`);
        console.log(`   - 가격 없음: ${data.details.noPrice}개`);
        console.log(`   - 설명 없음: ${data.details.noDescription}개`);
        console.log(`   - 전화번호 없음: ${data.details.noPhone}개`);
        console.log(`   - 영문 주소: ${data.details.englishAddress}개`);
        console.log();

        totalIncomplete += data.incomplete;
        totalNoPhoto += data.details.noPhoto;
        totalNoPrice += data.details.noPrice;
        totalEnglishAddr += data.details.englishAddress;
    }

    console.log('=== 전체 요약 ===');
    console.log(`📊 전체 시설: ${facilities?.length}개`);
    console.log(`❗ 데이터 미비 시설: ${totalIncomplete}개`);
    console.log(`📷 사진 필요: ${totalNoPhoto}개`);
    console.log(`💰 가격 필요: ${totalNoPrice}개`);
    console.log(`🌐 영문주소 변환 필요: ${totalEnglishAddr}개`);

    // 5. 구글 데이터 파일 분석
    console.log('\n=== 구글 수집 데이터 현황 ===');
    const googleDataPath = path.resolve(process.cwd(), 'scripts/google_enrichment_candidates_2025-12-27T14-50-54-891Z.json');

    if (fs.existsSync(googleDataPath)) {
        const googleData = JSON.parse(fs.readFileSync(googleDataPath, 'utf-8'));
        console.log(`📥 구글 수집 완료: ${googleData.length}개 시설`);

        const withPhotos = googleData.filter((g: any) => g.google_data?.photos?.length > 0).length;
        const withPhone = googleData.filter((g: any) => g.google_data?.phone).length;
        const withRating = googleData.filter((g: any) => g.google_data?.rating).length;

        console.log(`   - 사진 있음: ${withPhotos}개`);
        console.log(`   - 전화번호 있음: ${withPhone}개`);
        console.log(`   - 평점 있음: ${withRating}개`);
    }

    // 6. 보고서 저장
    const report = {
        timestamp: new Date().toISOString(),
        totalFacilities: facilities?.length,
        byType: analysis,
        summary: {
            totalIncomplete,
            totalNoPhoto,
            totalNoPrice,
            totalEnglishAddr
        }
    };

    fs.writeFileSync(
        path.resolve(process.cwd(), 'scripts/data_gap_analysis.json'),
        JSON.stringify(report, null, 2)
    );
    console.log('\n✅ 분석 결과 저장: scripts/data_gap_analysis.json');
}

function getTypeName(type: string): string {
    const names: Record<string, string> = {
        'funeral': '장례식장',
        'charnel': '봉안시설',
        'natural': '자연장',
        'park': '공원묘지',
        'complex': '복합시설',
        'pet': '동물장례',
        'sea': '해양장'
    };
    return names[type] || type;
}

analyzeDataGaps();
