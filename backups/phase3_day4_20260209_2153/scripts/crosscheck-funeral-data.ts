import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseKey = envConfig.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// CSV 가격 데이터 로드
const csvPath = path.resolve(process.cwd(), 'data', '장례식장_가격_정리_v2.csv');
const csvContent = fs.readFileSync(csvPath, 'utf-8');
const csvLines = csvContent.split('\n').slice(1).filter(line => line.trim());

// CSV에서 장례식장명 추출 (중복 제거)
const csvFacilities = new Map<string, { prices: { category: string; detail: string; price: number }[] }>();

for (const line of csvLines) {
    const match = line.match(/"([^"]+)","([^"]+)","([^"]+)",([0-9.]+)/);
    if (match) {
        const [, name, category, detail, priceStr] = match;
        const price = parseFloat(priceStr);

        if (!csvFacilities.has(name)) {
            csvFacilities.set(name, { prices: [] });
        }
        csvFacilities.get(name)!.prices.push({ category, detail, price });
    }
}

console.log(`CSV 장례식장 수: ${csvFacilities.size}개\n`);

interface DBFacility {
    id: number;
    name: string;
    address: string;
    image_url: string | null;
    prices: any | null;
    is_verified: boolean;
}

async function crossCheck() {
    // DB에서 장례식장 조회
    const { data: dbFacilities, error } = await supabase
        .from('memorial_spaces')
        .select('id, name, address, image_url, prices, is_verified')
        .eq('type', 'funeral')
        .order('name');

    if (error) {
        console.error('DB Error:', error);
        return;
    }

    console.log(`DB 장례식장 수: ${dbFacilities?.length || 0}개\n`);

    // 크로스체크 결과
    const matched: { db: DBFacility; csvName: string; similarity: number }[] = [];
    const dbOnly: DBFacility[] = [];
    const csvOnly: string[] = [];

    // 이름 정규화 함수
    const normalizeName = (name: string) => {
        return name
            .replace(/\s+/g, '')
            .replace(/[()（）\[\]【】]/g, '')
            .replace(/장례식장/g, '')
            .replace(/장례문화원/g, '')
            .replace(/장례원/g, '')
            .replace(/병원/g, '')
            .toLowerCase();
    };

    // CSV 이름 맵 생성 (정규화된 이름 -> 원본 이름)
    const csvNormalizedMap = new Map<string, string>();
    for (const name of csvFacilities.keys()) {
        csvNormalizedMap.set(normalizeName(name), name);
    }

    const usedCsvNames = new Set<string>();

    // DB 시설과 CSV 매칭
    for (const dbFacility of dbFacilities || []) {
        const normalizedDbName = normalizeName(dbFacility.name);

        let bestMatch: { csvName: string; similarity: number } | null = null;

        // 정확히 일치
        if (csvNormalizedMap.has(normalizedDbName)) {
            const csvName = csvNormalizedMap.get(normalizedDbName)!;
            if (!usedCsvNames.has(csvName)) {
                bestMatch = { csvName, similarity: 100 };
            }
        }

        // 부분 일치 (포함 관계)
        if (!bestMatch) {
            for (const [normCsv, origCsv] of csvNormalizedMap.entries()) {
                if (usedCsvNames.has(origCsv)) continue;

                if (normalizedDbName.includes(normCsv) || normCsv.includes(normalizedDbName)) {
                    const similarity = Math.min(normalizedDbName.length, normCsv.length) /
                        Math.max(normalizedDbName.length, normCsv.length) * 100;
                    if (!bestMatch || similarity > bestMatch.similarity) {
                        bestMatch = { csvName: origCsv, similarity };
                    }
                }
            }
        }

        if (bestMatch && bestMatch.similarity >= 50) {
            matched.push({ db: dbFacility, csvName: bestMatch.csvName, similarity: bestMatch.similarity });
            usedCsvNames.add(bestMatch.csvName);
        } else {
            dbOnly.push(dbFacility);
        }
    }

    // CSV에만 있는 시설
    for (const csvName of csvFacilities.keys()) {
        if (!usedCsvNames.has(csvName)) {
            csvOnly.push(csvName);
        }
    }

    // 현황 분석
    const hasPrice = (dbFacilities || []).filter(f => f.prices && Array.isArray(f.prices) && f.prices.length > 0);
    const noPrice = (dbFacilities || []).filter(f => !f.prices || !Array.isArray(f.prices) || f.prices.length === 0);
    const hasPhoto = (dbFacilities || []).filter(f => f.image_url && !f.image_url.includes('unsplash'));
    const noPhoto = (dbFacilities || []).filter(f => !f.image_url || f.image_url.includes('unsplash'));

    // 리포트 생성
    let report = `# 장례식장 데이터 크로스체크 리포트\n\n`;
    report += `생성일: ${new Date().toLocaleString('ko-KR')}\n\n`;

    report += `## 요약\n\n`;
    report += `| 항목 | 수량 |\n`;
    report += `|------|------|\n`;
    report += `| DB 장례식장 | ${dbFacilities?.length || 0}개 |\n`;
    report += `| CSV 장례식장 | ${csvFacilities.size}개 |\n`;
    report += `| 매칭됨 | ${matched.length}개 |\n`;
    report += `| DB에만 있음 | ${dbOnly.length}개 |\n`;
    report += `| CSV에만 있음 | ${csvOnly.length}개 |\n\n`;

    report += `## 현황 분석\n\n`;
    report += `| 항목 | 있음 | 없음 |\n`;
    report += `|------|------|------|\n`;
    report += `| 가격 정보 | ${hasPrice.length}개 | ${noPrice.length}개 |\n`;
    report += `| 대표사진 | ${hasPhoto.length}개 | ${noPhoto.length}개 |\n\n`;

    report += `---\n\n`;
    report += `## 1. 매칭된 업체 (${matched.length}개)\n\n`;
    report += `| # | DB 업체명 | CSV 업체명 | 유사도 | 가격 | 사진 |\n`;
    report += `|---|-----------|------------|--------|------|------|\n`;
    matched.slice(0, 100).forEach((m, i) => {
        const hasP = m.db.prices && Array.isArray(m.db.prices) && m.db.prices.length > 0 ? '✓' : '✗';
        const hasPh = m.db.image_url && !m.db.image_url.includes('unsplash') ? '✓' : '✗';
        report += `| ${i + 1} | ${m.db.name} | ${m.csvName} | ${m.similarity.toFixed(0)}% | ${hasP} | ${hasPh} |\n`;
    });
    if (matched.length > 100) {
        report += `\n... 외 ${matched.length - 100}개\n`;
    }

    report += `\n---\n\n`;
    report += `## 2. DB에만 있는 업체 (${dbOnly.length}개)\n\n`;
    report += `| # | 업체명 | 주소 | 가격 | 사진 |\n`;
    report += `|---|--------|------|------|------|\n`;
    dbOnly.slice(0, 100).forEach((f, i) => {
        const hasP = f.prices && Array.isArray(f.prices) && f.prices.length > 0 ? '✓' : '✗';
        const hasPh = f.image_url && !f.image_url.includes('unsplash') ? '✓' : '✗';
        const addr = f.address?.substring(0, 30) || '';
        report += `| ${i + 1} | ${f.name} | ${addr} | ${hasP} | ${hasPh} |\n`;
    });
    if (dbOnly.length > 100) {
        report += `\n... 외 ${dbOnly.length - 100}개\n`;
    }

    report += `\n---\n\n`;
    report += `## 3. CSV에만 있는 업체 (${csvOnly.length}개)\n\n`;
    report += `이 업체들은 DB에 추가되어야 할 수 있습니다.\n\n`;
    report += `| # | 업체명 | 가격 항목 수 |\n`;
    report += `|---|--------|-------------|\n`;
    csvOnly.slice(0, 100).forEach((name, i) => {
        const priceCount = csvFacilities.get(name)?.prices.length || 0;
        report += `| ${i + 1} | ${name} | ${priceCount}개 |\n`;
    });
    if (csvOnly.length > 100) {
        report += `\n... 외 ${csvOnly.length - 100}개\n`;
    }

    report += `\n---\n\n`;
    report += `## 4. 가격 정보 없는 업체 (${noPrice.length}개)\n\n`;
    report += `| # | 업체명 | 인증 | 사진 |\n`;
    report += `|---|--------|------|------|\n`;
    noPrice.slice(0, 50).forEach((f, i) => {
        const verified = f.is_verified ? '✓' : '';
        const hasPh = f.image_url && !f.image_url.includes('unsplash') ? '✓' : '✗';
        report += `| ${i + 1} | ${f.name} | ${verified} | ${hasPh} |\n`;
    });
    if (noPrice.length > 50) {
        report += `\n... 외 ${noPrice.length - 50}개\n`;
    }

    report += `\n---\n\n`;
    report += `## 5. 대표사진 없는 업체 (${noPhoto.length}개)\n\n`;
    report += `| # | 업체명 | 인증 | 가격 |\n`;
    report += `|---|--------|------|------|\n`;
    noPhoto.slice(0, 50).forEach((f, i) => {
        const verified = f.is_verified ? '✓' : '';
        const hasP = f.prices && Array.isArray(f.prices) && f.prices.length > 0 ? '✓' : '✗';
        report += `| ${i + 1} | ${f.name} | ${verified} | ${hasP} |\n`;
    });
    if (noPhoto.length > 50) {
        report += `\n... 외 ${noPhoto.length - 50}개\n`;
    }

    // 리포트 저장
    const reportPath = path.resolve(process.cwd(), 'scripts', '장례식장_크로스체크_리포트.md');
    fs.writeFileSync(reportPath, report, 'utf-8');

    console.log('=== 크로스체크 완료 ===');
    console.log(`매칭: ${matched.length}개`);
    console.log(`DB에만: ${dbOnly.length}개`);
    console.log(`CSV에만: ${csvOnly.length}개`);
    console.log(`\n가격 있음: ${hasPrice.length}개 / 없음: ${noPrice.length}개`);
    console.log(`사진 있음: ${hasPhoto.length}개 / 없음: ${noPhoto.length}개`);
    console.log(`\n✅ 리포트 저장: ${reportPath}`);
}

crossCheck();
