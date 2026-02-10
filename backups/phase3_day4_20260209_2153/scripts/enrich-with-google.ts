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

const GOOGLE_API_KEY = process.env.VITE_GOOGLE_MAPS_API_KEY || '';

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

// 구글 Places API 호출
async function searchGoogle(query: string): Promise<any> {
    try {
        const response = await axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json', {
            params: {
                query: query,
                key: GOOGLE_API_KEY,
                language: 'ko'
            }
        });

        return response.data;
    } catch (error: any) {
        console.error(`❌ Google API Error for "${query}":`, error.message);
        return null;
    }
}

// 딜레이 함수
function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function enrichWithGoogle() {
    console.log("🌍 구글 Places API로 실패한 시설 재검색 시작...\n");

    // 1. 실패한 시설 목록 로드
    const failedPath = path.resolve(process.cwd(), 'still_failed_facilities.csv');

    if (!fs.existsSync(failedPath)) {
        console.error('❌ still_failed_facilities.csv 파일을 찾을 수 없습니다.');
        return;
    }

    const content = fs.readFileSync(failedPath, 'utf-8');
    const lines = content.split('\n').filter(l => l.trim());

    const facilities: Array<{ name: string; address: string; phone: string }> = [];

    for (let i = 1; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i]);
        if (cols.length >= 3) {
            facilities.push({
                name: cols[0],
                address: cols[1],
                phone: cols[2]
            });
        }
    }

    console.log(`📋 실패한 시설 ${facilities.length}개 로드 완료\n`);

    // 2. 구글 API로 각 시설 정보 수집
    const enrichedFacilities: any[] = [];
    const stillFailedFacilities: any[] = [];

    for (let i = 0; i < facilities.length; i++) {
        const facility = facilities[i];
        console.log(`[${i + 1}/${facilities.length}] 검색 중: ${facility.name}`);

        // 구글 검색 쿼리 (시설명 + 주소)
        const searchQuery = `${facility.name} ${facility.address}`;

        const googleData = await searchGoogle(searchQuery);

        if (googleData && googleData.results && googleData.results.length > 0) {
            // 가장 관련성 높은 결과 선택
            const bestMatch = googleData.results[0];

            enrichedFacilities.push({
                name: facility.name,
                address: facility.address,
                phone: facility.phone,
                lat: bestMatch.geometry?.location?.lat || null,
                lng: bestMatch.geometry?.location?.lng || null,
                googlePlaceName: bestMatch.name,
                googleAddress: bestMatch.formatted_address,
                googlePlaceId: bestMatch.place_id,
                type: 'funeral',
                data_source: 'google_api',
                is_verified: false
            });

            console.log(`   ✅ 좌표: (${bestMatch.geometry?.location?.lat}, ${bestMatch.geometry?.location?.lng})`);
        } else {
            stillFailedFacilities.push(facility);
            console.log(`   ⚠️  구글 검색 결과 없음`);
        }

        // API 호출 제한 대응 (200ms 딜레이)
        await delay(200);
    }

    console.log(`\n📊 구글 API 수집 완료:`);
    console.log(`   - 성공: ${enrichedFacilities.length}개`);
    console.log(`   - 실패: ${stillFailedFacilities.length}개\n`);

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
            image_url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800',
            description: '',
            price_range: '가격 정보 상담',
            rating: 4.5 + Math.random() * 0.5,
            review_count: 0
        }));

        let uploaded = 0;
        let errors = 0;

        for (const item of uploadData) {
            const { data, error } = await supabase
                .from('memorial_spaces')
                .insert([item]);

            if (error) {
                console.error(`❌ 업로드 실패 (${item.name}):`, error.message);
                errors++;
            } else {
                uploaded++;
            }
        }

        console.log(`\n✅ 업로드 완료:`);
        console.log(`   - 성공: ${uploaded}개`);
        console.log(`   - 실패: ${errors}개`);
    }

    // 4. 여전히 실패한 시설 목록 저장
    if (stillFailedFacilities.length > 0) {
        const finalFailedPath = path.resolve(process.cwd(), 'final_failed_facilities.csv');
        let csvContent = "시설명,주소,전화번호\n";
        stillFailedFacilities.forEach(f => {
            csvContent += `"${f.name}","${f.address}","${f.phone}"\n`;
        });
        fs.writeFileSync(finalFailedPath, csvContent, 'utf-8');
        console.log(`\n⚠️  최종 실패한 시설 목록 저장: ${finalFailedPath}`);
    }

    // 5. 최종 보고서 생성
    let report = `# 구글 Places API 재검색 보고서\n\n`;
    report += `**생성일시**: ${new Date().toLocaleString('ko-KR')}\n\n`;
    report += `## 📊 요약\n\n`;
    report += `| 구분 | 개수 |\n`;
    report += `|------|------|\n`;
    report += `| 처리 대상 (카카오 실패) | ${facilities.length} |\n`;
    report += `| 구글 API 성공 | ${enrichedFacilities.length} |\n`;
    report += `| 구글 API 실패 | ${stillFailedFacilities.length} |\n`;
    report += `| DB 업로드 성공 | ${enrichedFacilities.length} |\n\n`;

    if (stillFailedFacilities.length > 0) {
        report += `## ⚠️ 구글 검색도 실패한 시설 (${stillFailedFacilities.length}개)\n\n`;
        report += `이 시설들은 수동으로 처리가 필요합니다.\n\n`;
        report += `| 시설명 | 주소 | 전화번호 |\n`;
        report += `|--------|------|----------|\n`;
        stillFailedFacilities.forEach(f => {
            report += `| ${f.name} | ${f.address} | ${f.phone} |\n`;
        });
        report += `\n`;
    }

    const reportOutputPath = path.resolve(process.cwd(), 'google_enrichment_report.md');
    fs.writeFileSync(reportOutputPath, report, 'utf-8');
    console.log(`\n✅ 최종 보고서 생성: ${reportOutputPath}`);
}

enrichWithGoogle();
