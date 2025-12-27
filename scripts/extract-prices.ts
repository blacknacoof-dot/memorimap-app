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

interface PriceInfo {
    name: string;
    roomPrices: number[];    // 빈소+접객실 가격들
    morguePrices: number[];  // 안치실 가격들
}

const facilities: Map<string, PriceInfo> = new Map();

console.log(`총 ${lines.length}개 라인 읽음\n`);

// 헤더 확인
console.log('헤더:', lines[0]);
console.log('샘플:', lines[1]);
console.log('');

// 헤더 스킵
for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const parts = line.split(',');

    if (parts.length < 8) continue;

    const facilityName = parts[2]?.trim();
    const category = parts[3]?.trim();       // 항목: 시설임대료, 안치실이용료
    const subCategory = parts[4]?.trim();    // 품종: 빈소+접객실, 일반 등
    const priceStr = parts[7]?.trim();
    const price = parseInt(priceStr) || 0;

    if (!facilityName || price === 0) continue;

    // 기존 데이터 가져오기
    let info = facilities.get(facilityName);
    if (!info) {
        info = { name: facilityName, roomPrices: [], morguePrices: [] };
        facilities.set(facilityName, info);
    }

    // 빈소+접객실 (시설임대료)
    if (category === '시설임대료' && subCategory === '빈소+접객실') {
        info.roomPrices.push(price);
    }

    // 안치실이용료
    if (category === '안치실이용료') {
        info.morguePrices.push(price);
    }
}

// 결과 정리
interface Result {
    name: string;
    roomPrice: string;
    morguePrice: string;
    roomPriceMin: number | null;
    roomPriceMax: number | null;
    morguePriceMin: number | null;
}

const results: Result[] = [];

for (const [name, info] of facilities) {
    // 빈소 가격대
    let roomPriceStr = '';
    let roomMin: number | null = null;
    let roomMax: number | null = null;

    if (info.roomPrices.length > 0) {
        roomMin = Math.min(...info.roomPrices);
        roomMax = Math.max(...info.roomPrices);

        if (roomMin !== roomMax) {
            roomPriceStr = `${(roomMin / 10000).toFixed(0)}~${(roomMax / 10000).toFixed(0)}만원`;
        } else {
            roomPriceStr = `${(roomMin / 10000).toFixed(0)}만원`;
        }
    }

    // 안치실 가격 (최저가)
    let morguePriceStr = '';
    let morgueMin: number | null = null;

    if (info.morguePrices.length > 0) {
        morgueMin = Math.min(...info.morguePrices);
        morguePriceStr = `${(morgueMin / 10000).toFixed(0)}만원`;
    }

    if (roomPriceStr || morguePriceStr) {
        results.push({
            name,
            roomPrice: roomPriceStr,
            morguePrice: morguePriceStr,
            roomPriceMin: roomMin,
            roomPriceMax: roomMax,
            morguePriceMin: morgueMin
        });
    }
}

// 출력
console.log('=== 장례식장 가격 정보 (빈소+접객실 / 안치실) ===\n');
console.log(`총 ${results.length}개 시설\n`);

console.log('장례식장명 | 빈소+접객실 | 안치실');
console.log('─'.repeat(70));

for (const r of results.slice(0, 30)) {
    console.log(`${r.name.substring(0, 25).padEnd(25)} | ${(r.roomPrice || '-').padEnd(15)} | ${r.morguePrice || '-'}`);
}

if (results.length > 30) {
    console.log(`\n... 외 ${results.length - 30}개 시설`);
}

// JSON 파일 저장 (웹 업데이트용)
const jsonOutput = results.map(r => ({
    장례식장명: r.name,
    빈소접객실: r.roomPrice || null,
    안치실이용료: r.morguePrice || null,
    // 숫자 값도 포함 (DB 업데이트용)
    room_price_min: r.roomPriceMin,
    room_price_max: r.roomPriceMax,
    morgue_price: r.morguePriceMin
}));

const outputPath = path.join(__dirname, '..', 'funeral_prices.json');
fs.writeFileSync(outputPath, JSON.stringify(jsonOutput, null, 2), 'utf-8');
console.log(`\n✅ JSON 저장: ${outputPath}`);

// 통계
console.log('\n=== 통계 ===');
console.log(`빈소+접객실 정보 있음: ${results.filter(r => r.roomPrice).length}개`);
console.log(`안치실 정보 있음: ${results.filter(r => r.morguePrice).length}개`);
