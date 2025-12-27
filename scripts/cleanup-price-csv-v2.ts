import path from 'path';
import fs from 'fs';
import iconv from 'iconv-lite';

// Read CSV file with EUC-KR encoding
const csvPath = path.resolve(process.cwd(), 'data', '2023년 6월', '2.장례식장가격정보_20230601.csv');
const buffer = fs.readFileSync(csvPath);
const content = iconv.decode(buffer, 'euc-kr');

const lines = content.split('\n').filter(line => line.trim());
console.log('=== CSV 데이터 정리 V2 ===');
console.log(`원본 라인 수: ${lines.length}\n`);

// 헤더: 시설종류,순번,장례식장명,항목,품종,품명,세부내용,금액
// 유지할 항목만
const keepCategories = [
    '시설임대료',      // 장례식장 임대료
    '안치실이용료',    // 안치료  
    '염습/입관',       // 염습료
    '수시/초염',       // 염습 관련
];

// 제외할 품종
const excludeSubCategories = [
    '기타', '기타류', '폐기물', '청소비', '관리비'
];

interface CleanedPrice {
    facilityName: string;
    category: string;      // 시설임대료 / 안치실이용료 / 염습
    roomType: string;      // 호실 종류 (특1호실, 일반실 등)
    priceManwon: number;   // 만원 단위
}

const cleanedData: CleanedPrice[] = [];

for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    if (cols.length < 8) continue;

    const facilityName = cols[2]?.trim();
    const category = cols[3]?.trim();      // 항목: 시설임대료, 안치실이용료 등
    const subCategory = cols[4]?.trim();   // 품종: 빈소+접객실, 일반 등
    const itemName = cols[5]?.trim();      // 품명: 장례식장임대료, 안치료 등
    const detail = cols[6]?.trim();        // 세부내용: 특1호실1일사용료
    const priceStr = cols[7]?.trim().replace(/\r/g, '');

    // 카테고리 필터링
    if (!keepCategories.includes(category)) continue;

    // 품종 필터링
    if (excludeSubCategories.includes(subCategory)) continue;

    // 가격 파싱
    const priceWon = parseInt(priceStr.replace(/,/g, ''));
    if (isNaN(priceWon) || priceWon <= 0) continue;

    // 만원 단위로 변환
    const priceManwon = Math.round(priceWon / 10000 * 10) / 10;

    // 카테고리 단순화
    let simpleCategory = '';
    if (category === '시설임대료') {
        simpleCategory = '장례식장 임대료';
    } else if (category === '안치실이용료') {
        simpleCategory = '안치료';
    } else if (category === '염습/입관' || category === '수시/초염') {
        simpleCategory = '염습료';
    }

    // 호실/상세 정보 결합 (중복 제거)
    let roomType = '';

    // 세부내용에서 호실 정보 추출
    if (detail) {
        // "특1호실1일사용료" -> "특1호실"
        const roomMatch = detail.match(/(특\d*호실|대특실|일반실|VIP실|일반|특수|특실)/);
        if (roomMatch) {
            roomType = roomMatch[1];
        } else {
            // 세부내용 그대로 사용 (너무 길면 자르기)
            roomType = detail.length > 20 ? detail.substring(0, 20) : detail;
        }
    }

    // 빈 경우 품종 + 품명 사용
    if (!roomType || roomType === '일반') {
        if (subCategory && subCategory !== '일반') {
            roomType = subCategory;
        } else if (itemName) {
            roomType = itemName;
        } else {
            roomType = '기본';
        }
    }

    cleanedData.push({
        facilityName,
        category: simpleCategory,
        roomType,
        priceManwon
    });
}

console.log(`정리된 데이터 수: ${cleanedData.length}\n`);

// 카테고리별 통계
const categoryStats = new Map<string, number>();
for (const item of cleanedData) {
    categoryStats.set(item.category, (categoryStats.get(item.category) || 0) + 1);
}

console.log('=== 카테고리별 분포 ===');
categoryStats.forEach((count, cat) => {
    console.log(`${cat}: ${count}건`);
});

// 샘플 출력
console.log('\n=== 정리된 데이터 샘플 (처음 30건) ===');
cleanedData.slice(0, 30).forEach((item, i) => {
    console.log(`${i + 1}. ${item.facilityName} | ${item.category} | ${item.roomType} | ${item.priceManwon}만원`);
});

// CSV로 저장 (간소화된 형식)
const outputPath = path.resolve(process.cwd(), 'data', '장례식장_가격_정리_v2.csv');
const header = '장례식장명,항목,호실/상세,가격(만원)';
const csvLines = cleanedData.map(item =>
    `"${item.facilityName}","${item.category}","${item.roomType}",${item.priceManwon}`
);
const outputContent = [header, ...csvLines].join('\n');
fs.writeFileSync(outputPath, '\ufeff' + outputContent, 'utf-8');

console.log(`\n✅ 간소화된 CSV 파일 저장: ${outputPath}`);
console.log(`   총 ${cleanedData.length}건`);
console.log(`   컬럼: 장례식장명, 항목, 호실/상세, 가격(만원)`);
