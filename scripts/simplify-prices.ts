import path from 'path';
import fs from 'fs';
import iconv from 'iconv-lite';

// CSV 파일 읽기 (EUC-KR 인코딩)
const csvPath = path.resolve(process.cwd(), 'data', '2023년 6월', '3.장사시설(장례식장제외)가격정보_20230601.csv');
const buffer = fs.readFileSync(csvPath);
const content = iconv.decode(buffer, 'euc-kr');

const lines = content.split('\n').filter(line => line.trim());
console.log('=== 가격 데이터 간소화 ===');
console.log(`원본 라인 수: ${lines.length - 1}\n`);

// 시설별 가격 수집
interface FacilityPrices {
    type: string;  // 묘지, 봉안시설, 화장시설, 자연장지
    name: string;
    개인단: number[];
    부부단: number[];
    기타: number[];
}

const facilities = new Map<string, FacilityPrices>();

for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    if (cols.length < 7) continue;

    const type = cols[0]?.trim();
    const name = cols[2]?.trim();
    const category = cols[3]?.trim();  // 품목분류
    const item = cols[4]?.trim();      // 품목
    const spec = cols[5]?.trim();      // 규격
    const priceStr = cols[6]?.trim().replace(/\r/g, '');

    if (!name || !type) continue;

    const priceWon = parseInt(priceStr?.replace(/,/g, '') || '0');
    if (priceWon <= 0) continue;

    const priceManwon = Math.round(priceWon / 10000 * 10) / 10;

    const key = `${type}|${name}`;
    if (!facilities.has(key)) {
        facilities.set(key, { type, name, 개인단: [], 부부단: [], 기타: [] });
    }

    const fac = facilities.get(key)!;
    const itemLower = (item + spec).toLowerCase();

    // 개인단/부부단 분류
    if (itemLower.includes('부부') || itemLower.includes('2위') || itemLower.includes('쌍')) {
        fac.부부단.push(priceManwon);
    } else if (itemLower.includes('개인') || itemLower.includes('1위') || itemLower.includes('단') ||
        itemLower.includes('사용료') || itemLower.includes('안치')) {
        fac.개인단.push(priceManwon);
    } else {
        fac.기타.push(priceManwon);
    }
}

console.log(`시설 수: ${facilities.size}개`);

// 평균 계산 및 대표 가격 생성
interface SimplifiedPrice {
    type: string;
    name: string;
    개인단_대표: number | null;
    부부단_대표: number | null;
}

const simplified: SimplifiedPrice[] = [];

const avg = (arr: number[]) => arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length * 10) / 10 : null;

facilities.forEach((fac, key) => {
    let 개인단_가격 = avg(fac.개인단);
    let 부부단_가격 = avg(fac.부부단);

    // 개인단이 없으면 기타에서 가져오기
    if (!개인단_가격 && fac.기타.length > 0) {
        개인단_가격 = avg(fac.기타);
    }

    // 부부단이 없으면 개인단의 1.5~2배로 추정 (있는 경우만)
    // 또는 기타에서 큰 값 사용

    if (개인단_가격 || 부부단_가격) {
        simplified.push({
            type: fac.type,
            name: fac.name,
            개인단_대표: 개인단_가격,
            부부단_대표: 부부단_가격
        });
    }
});

console.log(`간소화된 시설 수: ${simplified.length}개`);

// 시설 유형별 통계
const typeStats = new Map<string, { count: number; with개인: number; with부부: number }>();
simplified.forEach(s => {
    if (!typeStats.has(s.type)) {
        typeStats.set(s.type, { count: 0, with개인: 0, with부부: 0 });
    }
    const stat = typeStats.get(s.type)!;
    stat.count++;
    if (s.개인단_대표) stat.with개인++;
    if (s.부부단_대표) stat.with부부++;
});

console.log('\n=== 시설 유형별 통계 ===');
typeStats.forEach((stat, type) => {
    console.log(`${type}: ${stat.count}개 (개인단: ${stat.with개인}개, 부부단: ${stat.with부부}개)`);
});

// 샘플 출력
console.log('\n=== 샘플 데이터 (처음 20개) ===');
simplified.slice(0, 20).forEach((s, i) => {
    const 개인 = s.개인단_대표 ? `${s.개인단_대표}만원` : '-';
    const 부부 = s.부부단_대표 ? `${s.부부단_대표}만원` : '-';
    console.log(`${i + 1}. [${s.type}] ${s.name} | 개인단: ${개인} | 부부단: ${부부}`);
});

// CSV 저장
const outputPath = path.resolve(process.cwd(), 'data', '비장례시설_가격_간소화.csv');
let csv = '시설유형,시설명,개인단_가격(만원),부부단_가격(만원)\n';
simplified.forEach(s => {
    const 개인 = s.개인단_대표 ?? '';
    const 부부 = s.부부단_대표 ?? '';
    csv += `"${s.type}","${s.name}",${개인},${부부}\n`;
});
fs.writeFileSync(outputPath, '\ufeff' + csv, 'utf-8');

console.log(`\n✅ 간소화된 CSV 저장: ${outputPath}`);
console.log(`   총 ${simplified.length}개 시설`);
console.log(`   컬럼: 시설유형, 시설명, 개인단_가격(만원), 부부단_가격(만원)`);
