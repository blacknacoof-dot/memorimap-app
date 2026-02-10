import path from 'path';
import fs from 'fs';
import iconv from 'iconv-lite';

// Read CSV file with EUC-KR encoding
const csvPath = path.resolve(process.cwd(), 'data', '2023년 6월', '2.장례식장가격정보_20230601.csv');
const buffer = fs.readFileSync(csvPath);
const content = iconv.decode(buffer, 'euc-kr');

const lines = content.split('\n').filter(line => line.trim());
console.log('=== CSV 데이터 정리 시작 ===');
console.log(`원본 라인 수: ${lines.length}\n`);

// 헤더: 시설종류,순번,장례식장명,항목,품종,품명,세부내용,금액
// 유지할 항목:
// - 시설임대료 (장례식장 임대료)
// - 안치실이용료 (안치료)
// - 염습/입관 또는 염습료 관련

const keepCategories = [
    '시설임대료',      // 장례식장 임대료
    '안치실이용료',    // 안치료
    '염습/입관',       // 염습료
    '수시/초염',       // 염습 관련
];

// 제외할 항목 (품종 기준)
const excludeItems = [
    '밥류', '과일류', '반찬류', '국/찌개', '떡류', '안주류', '육류', '전류',
    '음료', '주류', '기타류', '기타', '관', '수의', '상주용품', '입관용품',
    '기타용품', '유골함', '조화/화환/헌환', '운구차량', '영정사진', '도우미',
    '제단', '제단장식', '청소/관리', '주차비', '전화비', '제사음식',
    '빈소용품', '접객용품', '칠성판/횡대', '관포(보)', '염포(보)', '명정',
    '리본/근조기', '수시(수세)포', '탈지면', '여상복', '오동나무', '대마',
    '저마', '향나무', '소나무', '면', '일반용품',
];

interface CleanedPrice {
    facilityName: string;
    category: string;      // 항목
    subCategory: string;   // 품종
    itemName: string;      // 품명
    detail: string;        // 세부내용
    priceWon: number;      // 원화
    priceManwon: number;   // 만원 단위
}

const cleanedData: CleanedPrice[] = [];
const skippedCategories = new Map<string, number>();

for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    if (cols.length < 8) continue;

    const facilityName = cols[2]?.trim();
    const category = cols[3]?.trim();      // 항목
    const subCategory = cols[4]?.trim();   // 품종
    const itemName = cols[5]?.trim();      // 품명
    const detail = cols[6]?.trim();        // 세부내용
    const priceStr = cols[7]?.trim().replace(/\r/g, '');

    // 카테고리 필터링
    if (!keepCategories.includes(category)) {
        skippedCategories.set(category, (skippedCategories.get(category) || 0) + 1);
        continue;
    }

    // 품종 필터링 (제외 항목 체크)
    if (excludeItems.includes(subCategory)) {
        continue;
    }

    // 가격 파싱
    const priceWon = parseInt(priceStr.replace(/,/g, ''));
    if (isNaN(priceWon) || priceWon <= 0) continue;

    // 만원 단위로 변환
    const priceManwon = Math.round(priceWon / 10000 * 10) / 10; // 소수점 1자리까지

    cleanedData.push({
        facilityName,
        category,
        subCategory,
        itemName,
        detail,
        priceWon,
        priceManwon
    });
}

console.log(`정리된 데이터 수: ${cleanedData.length}\n`);

console.log('=== 제외된 카테고리 ===');
const sortedSkipped = [...skippedCategories.entries()].sort((a, b) => b[1] - a[1]);
sortedSkipped.forEach(([cat, count]) => {
    console.log(`${cat}: ${count}건 제외`);
});

// 정리된 데이터 통계
const categoryStats = new Map<string, number>();
const subCategoryStats = new Map<string, number>();

for (const item of cleanedData) {
    categoryStats.set(item.category, (categoryStats.get(item.category) || 0) + 1);
    subCategoryStats.set(item.subCategory, (subCategoryStats.get(item.subCategory) || 0) + 1);
}

console.log('\n=== 정리된 데이터 카테고리별 분포 ===');
categoryStats.forEach((count, cat) => {
    console.log(`${cat}: ${count}건`);
});

console.log('\n=== 정리된 데이터 품종별 분포 ===');
const sortedSubCat = [...subCategoryStats.entries()].sort((a, b) => b[1] - a[1]);
sortedSubCat.forEach(([cat, count]) => {
    console.log(`${cat}: ${count}건`);
});

// 샘플 출력
console.log('\n=== 정리된 데이터 샘플 (처음 20건) ===');
cleanedData.slice(0, 20).forEach((item, i) => {
    console.log(`${i + 1}. ${item.facilityName}`);
    console.log(`   항목: ${item.category} | 품종: ${item.subCategory}`);
    console.log(`   품명: ${item.itemName} | 세부: ${item.detail}`);
    console.log(`   가격: ${item.priceWon.toLocaleString()}원 = ${item.priceManwon}만원`);
});

// CSV로 저장
const outputPath = path.resolve(process.cwd(), 'data', '장례식장_임대료_정리.csv');
const header = '장례식장명,항목,품종,품명,세부내용,가격(원),가격(만원)';
const csvLines = cleanedData.map(item =>
    `"${item.facilityName}","${item.category}","${item.subCategory}","${item.itemName}","${item.detail}",${item.priceWon},${item.priceManwon}`
);
const outputContent = [header, ...csvLines].join('\n');
fs.writeFileSync(outputPath, '\ufeff' + outputContent, 'utf-8'); // BOM for Excel

console.log(`\n✅ 정리된 CSV 파일 저장: ${outputPath}`);
console.log(`   총 ${cleanedData.length}건`);
