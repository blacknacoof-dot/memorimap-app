import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
);

interface FacilityData {
    id: string;
    name: string;
    type: string;
    address: string;
    phone: string;
    image_url: string;
    gallery_images: string[];
    prices: any;
    description: string;
    rating: number;
    review_count: number;
    website_url?: string;
    hours?: any;
    data_source?: string;
    updated_at?: string;
}

interface CompleteFacility extends FacilityData {
    dataStatus: 'complete' | 'partial' | 'minimal';
    missingFields: string[];
    hasGoogleData: boolean;
}

async function analyzeDbCompleteness() {
    console.log('📊 DB 데이터 완성도 분석 시작...\n');
    console.log('='.repeat(60) + '\n');

    // 1. 전체 시설 가져오기 (페이지네이션으로 전체 데이터 로드)
    const facilities: FacilityData[] = [];
    const pageSize = 1000;
    let page = 0;
    let hasMore = true;

    while (hasMore) {
        const { data, error } = await supabase
            .from('memorial_spaces')
            .select('*')
            .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) {
            console.error('❌ DB 조회 실패:', error.message);
            return;
        }

        if (data && data.length > 0) {
            facilities.push(...data);
            page++;
            hasMore = data.length === pageSize;
        } else {
            hasMore = false;
        }
    }

    const error = null;

    if (error) {
        console.error('❌ DB 조회 실패:', error.message);
        return;
    }

    console.log(`📋 전체 시설 수: ${facilities?.length || 0}개\n`);

    // 분류 결과
    const complete: CompleteFacility[] = [];      // 모든 데이터 있음
    const partial: CompleteFacility[] = [];       // 일부 데이터만 있음
    const minimal: CompleteFacility[] = [];       // 최소 데이터만 있음

    // 각 시설 분석
    facilities?.forEach((f: FacilityData) => {
        const missingFields: string[] = [];
        let score = 0;
        const maxScore = 7;

        // 필수 필드 체크
        // 1. 사진 (image_url)
        const hasMainPhoto = f.image_url && !f.image_url.includes('unsplash') && !f.image_url.includes('placeholder');
        if (hasMainPhoto) score++; else missingFields.push('메인사진');

        // 2. 갤러리 이미지
        const hasGallery = f.gallery_images && f.gallery_images.length > 0;
        if (hasGallery) score++; else missingFields.push('갤러리');

        // 3. 가격 정보
        const hasPrice = f.prices && (
            (Array.isArray(f.prices) && f.prices.length > 0) ||
            (typeof f.prices === 'object' && Object.keys(f.prices).length > 0)
        );
        if (hasPrice) score++; else missingFields.push('가격');

        // 4. 전화번호
        const hasPhone = f.phone && f.phone.trim().length > 0;
        if (hasPhone) score++; else missingFields.push('전화번호');

        // 5. 설명
        const hasDescription = f.description && f.description.length > 20;
        if (hasDescription) score++; else missingFields.push('설명');

        // 6. 주소 (한글)
        const hasKoreanAddress = f.address && !(/South Korea|Korea|KR$/i.test(f.address));
        if (hasKoreanAddress) score++; else missingFields.push('한글주소');

        // 7. 웹사이트/운영시간 (보너스)
        const hasExtra = f.website_url || f.hours;
        if (hasExtra) score++;

        // 구글 데이터 여부 판별
        const hasGoogleData =
            (f.data_source === 'google') ||
            (f.gallery_images && f.gallery_images.some((url: string) => url?.includes('googleusercontent'))) ||
            (f.image_url && f.image_url.includes('googleusercontent'));

        // 분류
        let dataStatus: 'complete' | 'partial' | 'minimal';
        if (score >= 6) {
            dataStatus = 'complete';
            complete.push({ ...f, dataStatus, missingFields, hasGoogleData });
        } else if (score >= 3) {
            dataStatus = 'partial';
            partial.push({ ...f, dataStatus, missingFields, hasGoogleData });
        } else {
            dataStatus = 'minimal';
            minimal.push({ ...f, dataStatus, missingFields, hasGoogleData });
        }
    });

    // Markdown 보고서 생성
    let report = `# 📊 DB 데이터 완성도 분석 보고서\n\n`;
    report += `**분석 시간**: ${new Date().toLocaleString('ko-KR')}\n\n`;
    report += `---\n\n`;

    // 요약
    report += `## 📈 전체 요약\n\n`;
    report += `| 분류 | 개수 | 비율 |\n`;
    report += `|------|------|------|\n`;
    report += `| ✅ 완전 (Complete) | ${complete.length}개 | ${((complete.length / (facilities?.length || 1)) * 100).toFixed(1)}% |\n`;
    report += `| ⚠️ 부분 (Partial) | ${partial.length}개 | ${((partial.length / (facilities?.length || 1)) * 100).toFixed(1)}% |\n`;
    report += `| ❌ 최소 (Minimal) | ${minimal.length}개 | ${((minimal.length / (facilities?.length || 1)) * 100).toFixed(1)}% |\n`;
    report += `| **전체** | **${facilities?.length}개** | **100%** |\n\n`;

    // 타입별 분석
    report += `## 📁 타입별 현황\n\n`;
    const typeNames: Record<string, string> = {
        'funeral': '장례식장',
        'charnel': '봉안시설',
        'natural': '자연장',
        'park': '공원묘지',
        'complex': '복합시설',
        'pet': '동물장례',
        'sea': '해양장'
    };

    const allFacilities = [...complete, ...partial, ...minimal];
    const byType: Record<string, CompleteFacility[]> = {};
    allFacilities.forEach(f => {
        if (!byType[f.type]) byType[f.type] = [];
        byType[f.type].push(f);
    });

    for (const [type, list] of Object.entries(byType)) {
        const typeName = typeNames[type] || type;
        const completeCount = list.filter(f => f.dataStatus === 'complete').length;
        const partialCount = list.filter(f => f.dataStatus === 'partial').length;
        const minimalCount = list.filter(f => f.dataStatus === 'minimal').length;
        const googleCount = list.filter(f => f.hasGoogleData).length;

        report += `### ${typeName} (${type}) - ${list.length}개\n`;
        report += `- ✅ 완전: ${completeCount}개\n`;
        report += `- ⚠️ 부분: ${partialCount}개\n`;
        report += `- ❌ 최소: ${minimalCount}개\n`;
        report += `- 🔍 구글 데이터: ${googleCount}개\n\n`;
    }

    // ========== 완전 데이터 ==========
    report += `---\n\n`;
    report += `## ✅ 완전 데이터 시설 (${complete.length}개)\n\n`;
    report += `> 사진, 갤러리, 가격, 전화번호, 설명, 주소 모두 있음\n\n`;

    if (complete.length > 0) {
        report += `| # | 이름 | 타입 | 구글 | 비고 |\n`;
        report += `|---|------|------|------|------|\n`;
        complete.slice(0, 50).forEach((f, i) => {
            const googleMark = f.hasGoogleData ? '🔍 구글 업데이트' : '';
            const type = typeNames[f.type] || f.type;
            report += `| ${i + 1} | ${f.name} | ${type} | ${googleMark} | ${f.missingFields.length > 0 ? f.missingFields.join(', ') : '-'} |\n`;
        });
        if (complete.length > 50) {
            report += `\n*...외 ${complete.length - 50}개 더*\n`;
        }
    }

    // ========== 부분 데이터 ==========
    report += `\n---\n\n`;
    report += `## ⚠️ 부분 데이터 시설 (${partial.length}개)\n\n`;
    report += `> 일부 핵심 데이터 누락 (3~5개 필드 있음)\n\n`;

    if (partial.length > 0) {
        report += `| # | 이름 | 타입 | 구글 | 누락 필드 |\n`;
        report += `|---|------|------|------|------------|\n`;
        partial.forEach((f, i) => {
            const googleMark = f.hasGoogleData ? '🔍' : '';
            const type = typeNames[f.type] || f.type;
            report += `| ${i + 1} | ${f.name} | ${type} | ${googleMark} | ${f.missingFields.join(', ')} |\n`;
        });
    }

    // ========== 최소 데이터 ==========
    report += `\n---\n\n`;
    report += `## ❌ 최소 데이터 시설 (${minimal.length}개)\n\n`;
    report += `> 대부분의 데이터 누락 (0~2개 필드만 있음) - **우선 보완 필요**\n\n`;

    if (minimal.length > 0) {
        report += `| # | 이름 | 타입 | 구글 | 누락 필드 |\n`;
        report += `|---|------|------|------|------------|\n`;
        minimal.forEach((f, i) => {
            const googleMark = f.hasGoogleData ? '🔍' : '';
            const type = typeNames[f.type] || f.type;
            report += `| ${i + 1} | ${f.name} | ${type} | ${googleMark} | ${f.missingFields.join(', ')} |\n`;
        });
    }

    // ========== 구글 데이터 요약 ==========
    report += `\n---\n\n`;
    report += `## 🔍 구글 업데이트 시설 요약\n\n`;
    const googleFacilities = allFacilities.filter(f => f.hasGoogleData);
    report += `총 **${googleFacilities.length}개** 시설에 구글 데이터 적용됨\n\n`;

    if (googleFacilities.length > 0) {
        report += `| # | 이름 | 타입 | 상태 |\n`;
        report += `|---|------|------|------|\n`;
        googleFacilities.slice(0, 30).forEach((f, i) => {
            const type = typeNames[f.type] || f.type;
            const status = f.dataStatus === 'complete' ? '✅ 완전' : f.dataStatus === 'partial' ? '⚠️ 부분' : '❌ 최소';
            report += `| ${i + 1} | ${f.name} | ${type} | ${status} |\n`;
        });
        if (googleFacilities.length > 30) {
            report += `\n*...외 ${googleFacilities.length - 30}개 더*\n`;
        }
    }

    // ========== 필드별 누락 통계 ==========
    report += `\n---\n\n`;
    report += `## 📉 필드별 누락 현황\n\n`;
    const fieldStats: Record<string, number> = {};
    allFacilities.forEach(f => {
        f.missingFields.forEach(field => {
            fieldStats[field] = (fieldStats[field] || 0) + 1;
        });
    });

    report += `| 필드 | 누락 개수 | 비율 |\n`;
    report += `|------|----------|------|\n`;
    Object.entries(fieldStats)
        .sort((a, b) => b[1] - a[1])
        .forEach(([field, count]) => {
            const percent = ((count / allFacilities.length) * 100).toFixed(1);
            report += `| ${field} | ${count}개 | ${percent}% |\n`;
        });

    // 권장 작업
    report += `\n---\n\n`;
    report += `## 🎯 권장 작업 우선순위\n\n`;
    report += `1. **최소 데이터 시설 보완** (${minimal.length}개) - 구글 검색/크롤링 필요\n`;
    report += `2. **메인 사진 추가** (${fieldStats['메인사진'] || 0}개)\n`;
    report += `3. **가격 정보 수집** (${fieldStats['가격'] || 0}개)\n`;
    report += `4. **전화번호 확인** (${fieldStats['전화번호'] || 0}개)\n`;
    report += `5. **영문 주소 한글 변환** (${fieldStats['한글주소'] || 0}개)\n`;

    // 파일 저장
    const reportPath = path.resolve(process.cwd(), 'scripts/db_completeness_report.md');
    fs.writeFileSync(reportPath, report, 'utf-8');
    console.log(`\n✅ 보고서 저장 완료: scripts/db_completeness_report.md`);

    // 콘솔 요약 출력
    console.log('\n' + '='.repeat(60));
    console.log('📊 분석 완료 요약');
    console.log('='.repeat(60));
    console.log(`✅ 완전 데이터: ${complete.length}개`);
    console.log(`⚠️ 부분 데이터: ${partial.length}개`);
    console.log(`❌ 최소 데이터: ${minimal.length}개`);
    console.log(`🔍 구글 업데이트: ${googleFacilities.length}개`);
    console.log('='.repeat(60));
}

analyzeDbCompleteness();
