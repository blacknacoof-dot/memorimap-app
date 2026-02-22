import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import axios from 'axios';

// Load Env
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
);

const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID || '';
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET || '';

// CSV 파싱 함수
function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
}

// 네이버 검색 API 호출
async function searchNaver(query: string): Promise<any> {
    try {
        const response = await axios.get('https://openapi.naver.com/v1/search/local.json', {
            params: {
                query: query,
                display: 5,
                start: 1,
                sort: 'random'
            },
            headers: {
                'X-Naver-Client-Id': NAVER_CLIENT_ID,
                'X-Naver-Client-Secret': NAVER_CLIENT_SECRET
            }
        });

        return response.data;
    } catch (error: any) {
        console.error(`❌ Naver API Error for "${query}":`, error.message);
        return null;
    }
}

// 딜레이 함수 (API 호출 제한 대응)
function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function enrichAndUpload() {
    console.log("🚀 신규 시설 네이버 API 수집 및 업로드 시작...\n");

    // 1. 진짜 신규 시설 목록 로드 (cross_verification_report.md에서 추출)
    const reportPath = path.resolve(process.cwd(), 'cross_verification_report.md');
    const reportContent = fs.readFileSync(reportPath, 'utf-8');

    // "진짜 신규 시설" 섹션 파싱
    const newFacilitiesSection = reportContent.split('## ✨ 진짜 신규 시설')[1];
    if (!newFacilitiesSection) {
        console.error('❌ 진짜 신규 시설 섹션을 찾을 수 없습니다.');
        return;
    }

    const lines = newFacilitiesSection.split('\n').filter(l => l.trim() && l.startsWith('|') && !l.includes('시설명'));
    const facilities: Array<{ name: string; address: string; phone: string }> = [];

    for (const line of lines) {
        const cols = line.split('|').map(c => c.trim()).filter(c => c);
        if (cols.length >= 3) {
            facilities.push({
                name: cols[0],
                address: cols[1],
                phone: cols[2]
            });
        }
    }

    console.log(`📋 진짜 신규 시설 ${facilities.length}개 로드 완료\n`);

    // 2. 네이버 API로 각 시설 정보 수집
    const enrichedFacilities: any[] = [];
    const failedFacilities: any[] = [];

    for (let i = 0; i < facilities.length; i++) {
        const facility = facilities[i];
        console.log(`[${i + 1}/${facilities.length}] 검색 중: ${facility.name}`);

        // 네이버 검색 쿼리 (시설명 + 지역)
        const region = facility.address.split(' ')[0]; // 첫 번째 단어 (시/도)
        const searchQuery = `${facility.name} ${region} 장례식장`;

        const naverData = await searchNaver(searchQuery);

        if (naverData && naverData.items && naverData.items.length > 0) {
            // 가장 관련성 높은 결과 선택
            const bestMatch = naverData.items[0];

            enrichedFacilities.push({
                name: facility.name,
                address: facility.address,
                phone: facility.phone,
                lat: bestMatch.mapy ? parseFloat(bestMatch.mapy) / 10000000 : null,
                lng: bestMatch.mapx ? parseFloat(bestMatch.mapx) / 10000000 : null,
                naverTitle: bestMatch.title?.replace(/<[^>]*>/g, ''),
                naverAddress: bestMatch.address,
                naverRoadAddress: bestMatch.roadAddress,
                naverCategory: bestMatch.category,
                link: bestMatch.link,
                type: 'funeral',
                data_source: 'naver_api',
                is_verified: false
            });

            console.log(`   ✅ 좌표: (${bestMatch.mapy ? parseFloat(bestMatch.mapy) / 10000000 : 'N/A'}, ${bestMatch.mapx ? parseFloat(bestMatch.mapx) / 10000000 : 'N/A'})`);
        } else {
            failedFacilities.push(facility);
            console.log(`   ⚠️  네이버 검색 결과 없음`);
        }

        // API 호출 제한 대응 (100ms 딜레이)
        await delay(100);
    }

    console.log(`\n📊 수집 완료:`);
    console.log(`   - 성공: ${enrichedFacilities.length}개`);
    console.log(`   - 실패: ${failedFacilities.length}개\n`);

    // 3. Supabase DB에 업로드
    if (enrichedFacilities.length > 0) {
        console.log(`🔄 Supabase DB에 업로드 중...`);

        const uploadData = enrichedFacilities.map(f => ({
            name: f.name,
            address: f.address,
            phone: f.phone,
            lat: f.lat,
            lng: f.lng,
            type: f.type,
            data_source: f.data_source,
            is_verified: f.is_verified,
            image_url: '', // 추후 이미지 수집 가능
            description: '',
            price_range: '가격 정보 상담',
            rating: 0,
            review_count: 0
        }));

        // 배치 업로드 (100개씩)
        const batchSize = 100;
        let uploaded = 0;
        let errors = 0;

        for (let i = 0; i < uploadData.length; i += batchSize) {
            const batch = uploadData.slice(i, i + batchSize);

            const { data, error } = await supabase
                .from('memorial_spaces')
                .insert(batch);

            if (error) {
                console.error(`❌ 배치 ${Math.floor(i / batchSize) + 1} 업로드 실패:`, error.message);
                errors += batch.length;
            } else {
                uploaded += batch.length;
                console.log(`   ✅ 배치 ${Math.floor(i / batchSize) + 1} 업로드 완료 (${batch.length}개)`);
            }
        }

        console.log(`\n✅ 업로드 완료:`);
        console.log(`   - 성공: ${uploaded}개`);
        console.log(`   - 실패: ${errors}개`);
    }

    // 4. 실패한 시설 목록 저장
    if (failedFacilities.length > 0) {
        const failedPath = path.resolve(process.cwd(), 'failed_facilities.csv');
        let csvContent = "시설명,주소,전화번호\n";
        failedFacilities.forEach(f => {
            csvContent += `"${f.name}","${f.address}","${f.phone}"\n`;
        });
        fs.writeFileSync(failedPath, csvContent, 'utf-8');
        console.log(`\n⚠️  실패한 시설 목록 저장: ${failedPath}`);
    }

    // 5. 최종 보고서 생성
    let report = `# 신규 시설 네이버 API 수집 및 업로드 보고서\n\n`;
    report += `**생성일시**: ${new Date().toLocaleString('ko-KR')}\n\n`;
    report += `## 📊 요약\n\n`;
    report += `| 구분 | 개수 |\n`;
    report += `|------|------|\n`;
    report += `| 처리 대상 | ${facilities.length} |\n`;
    report += `| 네이버 API 성공 | ${enrichedFacilities.length} |\n`;
    report += `| 네이버 API 실패 | ${failedFacilities.length} |\n`;
    report += `| DB 업로드 성공 | ${enrichedFacilities.length} |\n\n`;

    if (failedFacilities.length > 0) {
        report += `## ⚠️ 네이버 검색 실패 시설 (${failedFacilities.length}개)\n\n`;
        report += `| 시설명 | 주소 | 전화번호 |\n`;
        report += `|--------|------|----------|\n`;
        failedFacilities.forEach(f => {
            report += `| ${f.name} | ${f.address} | ${f.phone} |\n`;
        });
        report += `\n`;
    }

    const reportOutputPath = path.resolve(process.cwd(), 'naver_enrichment_report.md');
    fs.writeFileSync(reportOutputPath, report, 'utf-8');
    console.log(`\n✅ 최종 보고서 생성: ${reportOutputPath}`);
}

enrichAndUpload();
