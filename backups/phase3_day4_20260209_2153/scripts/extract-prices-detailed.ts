import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// UTF-8로 변환된 CSV 파일 읽기
const csvPath = path.join(__dirname, '..', 'data', 'funeral_prices_utf8.csv');
const content = fs.readFileSync(csvPath, 'utf-8');
const lines = content.split('\n').filter(line => line.trim());

interface PriceItem {
    category: string;      // 항목: 시설임대료, 안치실이용료
    subCategory: string;   // 품종: 빈소+접객실, 일반 등
    name: string;          // 품명: 장례식장임대료, 안치료 등
    detail: string;        // 세부내용: 특1호실1일사용료
    price: number;         // 금액
    priceDisplay: string;  // 표시용: "40만원"
}

interface FacilityPrices {
    facilityName: string;
    prices: PriceItem[];
}

const facilitiesMap: Map<string, PriceItem[]> = new Map();

console.log(`총 ${lines.length}개 라인 처리 중...\n`);

// 헤더 스킵, 데이터 파싱
for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const parts = line.split(',');

    if (parts.length < 8) continue;

    const facilityName = parts[2]?.trim();
    const category = parts[3]?.trim();       // 항목
    const subCategory = parts[4]?.trim();    // 품종
    const itemName = parts[5]?.trim();       // 품명
    const detail = parts[6]?.trim();         // 세부내용
    const priceStr = parts[7]?.trim();
    const price = parseInt(priceStr) || 0;

    if (!facilityName || price === 0) continue;

    // 빈소+접객실 또는 안치실이용료만 필터링
    if (category !== '시설임대료' && category !== '안치실이용료') continue;
    if (category === '시설임대료' && subCategory !== '빈소+접객실' && subCategory !== '접객실') continue;

    // 가격 표시 형식
    let priceDisplay: string;
    if (price >= 10000) {
        priceDisplay = `${(price / 10000).toFixed(0)}만원`;
    } else {
        priceDisplay = `${price.toLocaleString()}원`;
    }

    const priceItem: PriceItem = {
        category,
        subCategory,
        name: itemName,
        detail,
        price,
        priceDisplay
    };

    if (!facilitiesMap.has(facilityName)) {
        facilitiesMap.set(facilityName, []);
    }
    facilitiesMap.get(facilityName)!.push(priceItem);
}

// 결과 정리
const results: FacilityPrices[] = [];

for (const [name, prices] of facilitiesMap) {
    if (prices.length > 0) {
        results.push({ facilityName: name, prices });
    }
}

console.log(`=== 상세 가격 정보 처리 완료 ===\n`);
console.log(`총 ${results.length}개 시설\n`);

// 샘플 출력 (5개)
console.log('=== 샘플 데이터 (5개 시설) ===\n');
for (const fac of results.slice(0, 5)) {
    console.log(`📍 ${fac.facilityName}`);
    for (const p of fac.prices.slice(0, 5)) {
        console.log(`   ${p.subCategory} | ${p.detail} | ${p.priceDisplay}`);
    }
    if (fac.prices.length > 5) {
        console.log(`   ... 외 ${fac.prices.length - 5}개 항목`);
    }
    console.log('');
}

// JSON 저장 (상세형)
const outputPath = path.join(__dirname, '..', 'funeral_prices_detailed.json');
fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf-8');
console.log(`✅ 상세 가격 JSON 저장: ${outputPath}`);

// 통계
const totalItems = results.reduce((sum, f) => sum + f.prices.length, 0);
console.log(`\n=== 통계 ===`);
console.log(`시설 수: ${results.length}개`);
console.log(`총 가격 항목: ${totalItems}개`);
console.log(`시설당 평균 항목: ${(totalItems / results.length).toFixed(1)}개`);
