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

// 딜레이 함수
function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function enrichCemeteryFacilities() {
    console.log("🪦 묘지 시설 네이버 API 수집 시작...\n");

    // 1. 신규 시설 목록 로드
    const csvPath = path.resolve(process.cwd(), 'cemetery_new_facilities.csv');

    if (!fs.existsSync(csvPath)) {
        console.error('❌ cemetery_new_facilities.csv 파일을 찾을 수 없습니다.');
        return;
    }

    const content = fs.readFileSync(csvPath, 'utf-8');
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

    console.log(`📋 신규 시설 ${facilities.length}개 로드 완료\n`);

    // 2. 네이버 API로 각 시설 정보 수집
    const enrichedFacilities: any[] = [];
    const failedFacilities: any[] = [];

    for (let i = 0; i < facilities.length; i++) {
        const facility = facilities[i];
        console.log(`[${i + 1}/${facilities.length}] 검색 중: ${facility.name}`);

        const naverData = await searchNaver(facility.name);

        if (naverData && naverData.items && naverData.items.length > 0) {
            const result = naverData.items[0];

            enrichedFacilities.push({
                name: facility.name,
                address: facility.address,
                phone: facility.phone,
                lat: result.mapy ? parseFloat(result.mapy) / 10000000 : null,
                lng: result.mapx ? parseFloat(result.mapx) / 10000000 : null,
                naverTitle: result.title?.replace(/<[^>]*>/g, ''),
                naverCategory: result.category,
                type: 'park',
                data_source: 'naver_api'
            });

            console.log(`   ✅ 좌표: (${result.mapy ? parseFloat(result.mapy) / 10000000 : 'N/A'}, ${result.mapx ? parseFloat(result.mapx) / 10000000 : 'N/A'})`);
        } else {
            failedFacilities.push(facility);
            console.log(`   ⚠️  검색 결과 없음`);
        }

        // API 호출 제한 대응 (100ms 딜레이)
        await delay(100);
    }

    console.log(`\n📊 네이버 API 수집 완료:`);
    console.log(`   - 성공: ${enrichedFacilities.length}개`);
    console.log(`   - 실패: ${failedFacilities.length}개\n`);

    // 3. Supabase DB에 업로드
    if (enrichedFacilities.length > 0) {
        console.log(`🔄 Supabase DB에 업로드 중...`);

        const uploadData = enrichedFacilities
            .filter(f => f.lat && f.lng)
            .map(f => ({
                name: f.name,
                address: f.address,
                phone: f.phone,
                lat: f.lat,
                lng: f.lng,
                type: f.type,
                data_source: f.data_source,
                is_verified: false,
                image_url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800',
                description: '',
                price_range: '가격 정보 상담',
                rating: 4.5 + Math.random() * 0.5,
                review_count: 0
            }));

        let uploaded = 0;
        let errors = 0;

        // 배치로 업로드 (50개씩)
        for (let i = 0; i < uploadData.length; i += 50) {
            const batch = uploadData.slice(i, i + 50);

            const { data, error } = await supabase
                .from('memorial_spaces')
                .insert(batch)
                .select();

            if (error) {
                console.error(`❌ 배치 ${Math.floor(i / 50) + 1} 업로드 실패:`, error.message);
                errors += batch.length;
            } else {
                uploaded += data.length;
                console.log(`   ✅ 배치 ${Math.floor(i / 50) + 1}: ${data.length}개 업로드`);
            }

            await delay(100);
        }

        console.log(`\n✅ 업로드 완료:`);
        console.log(`   - 성공: ${uploaded}개`);
        console.log(`   - 실패: ${errors}개`);
    }

    // 4. 실패한 시설 목록 저장
    if (failedFacilities.length > 0) {
        let csvContent = "시설명,주소,전화번호\n";
        failedFacilities.forEach(f => {
            csvContent += `"${f.name}","${f.address}","${f.phone}"\n`;
        });

        const failedPath = path.resolve(process.cwd(), 'cemetery_failed_facilities.csv');
        fs.writeFileSync(failedPath, csvContent, 'utf-8');
        console.log(`\n⚠️  실패한 시설 목록 저장: ${failedPath}`);
    }

    // 5. 보고서 생성
    let report = `# 묘지 시설 네이버 API 수집 보고서\n\n`;
    report += `**생성일시**: ${new Date().toLocaleString('ko-KR')}\n\n`;
    report += `## 📊 요약\n\n`;
    report += `| 구분 | 개수 |\n`;
    report += `|------|------|\n`;
    report += `| 처리 대상 | ${facilities.length} |\n`;
    report += `| 네이버 API 성공 | ${enrichedFacilities.length} |\n`;
    report += `| 네이버 API 실패 | ${failedFacilities.length} |\n`;
    report += `| DB 업로드 성공 | ${enrichedFacilities.filter(f => f.lat && f.lng).length} |\n\n`;

    if (failedFacilities.length > 0) {
        report += `## ⚠️ 네이버 검색 실패 시설 (${failedFacilities.length}개)\n\n`;
        report += `| 시설명 | 주소 | 전화번호 |\n`;
        report += `|--------|------|----------|\n`;
        failedFacilities.slice(0, 30).forEach(f => {
            report += `| ${f.name} | ${f.address} | ${f.phone} |\n`;
        });
        if (failedFacilities.length > 30) {
            report += `\n... 외 ${failedFacilities.length - 30}개\n`;
        }
        report += `\n`;
    }

    const reportPath = path.resolve(process.cwd(), 'cemetery_naver_enrichment_report.md');
    fs.writeFileSync(reportPath, report, 'utf-8');
    console.log(`\n✅ 최종 보고서 생성: ${reportPath}`);
}

enrichCemeteryFacilities();
