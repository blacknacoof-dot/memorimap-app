
function normalizeAddress(addr: string): string {
    if (!addr) return '';
    return addr
        .replace(/\s+/g, '')
        .replace(/부산광역시/g, '부산')
        .replace(/서울특별시/g, '서울')
        .replace(/대구광역시/g, '대구')
        .replace(/인천광역시/g, '인천')
        .replace(/광주광역시/g, '광주')
        .replace(/대전광역시/g, '대전')
        .replace(/울산광역시/g, '울산')
        .replace(/세종특별자치시/g, '세종')
        .replace(/경기도/g, '경기')
        .replace(/강원특별자치도|강원도/g, '강원')
        .replace(/충청북도/g, '충북')
        .replace(/충청남도/g, '충남')
        .replace(/전북특별자치도|전라북도/g, '전북')
        .replace(/전라남도/g, '전남')
        .replace(/경상북도/g, '경북')
        .replace(/경상남도/g, '경남')
        .replace(/제주특별자치도|제주도/g, '제주')
        .replace(/\(.*\)/g, '')
        .replace(/장례식장/g, '')
        .split(',')[0].trim();
}

const dbAddr = "부산 사상구 낙동대로 1056";
const csvAddr = "부산광역시 사상구 낙동대로 1056 (감전동, 부산전문장례예식장)";

console.log("DB Norm  :", normalizeAddress(dbAddr));
console.log("CSV Norm :", normalizeAddress(csvAddr));
console.log("Match    :", normalizeAddress(dbAddr) === normalizeAddress(csvAddr));
