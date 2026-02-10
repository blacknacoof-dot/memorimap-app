import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

// Load Env
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
);

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

// 정규화 함수
function normalizeName(name: string): string {
    return name.replace(/\s+/g, '').toLowerCase();
}

function normalizeAddress(addr: string): string {
    return addr
        .replace(/\s+/g, '')
        .replace(/[()]/g, '')
        .toLowerCase();
}

async function checkCemeteryData() {
    console.log("🪦 묘지 데이터 DB 일치 확인 시작...\n");

    // 1. CSV 파일 읽기
    const csvPath = path.resolve(process.cwd(), '납골당보안시설자료', '15774129-2025-12-22묘지.csv');

    if (!fs.existsSync(csvPath)) {
        console.error('❌ CSV 파일을 찾을 수 없습니다.');
        return;
    }

    const content = fs.readFileSync(csvPath, 'utf-8');
    const lines = content.split('\n').filter(l => l.trim());

    console.log(`📋 CSV 파일: ${lines.length - 1}개 항목 발견\n`);

    // 2. DB에서 묘지/납골당 데이터 조회
    const { data: dbFacilities, error } = await supabase
        .from('memorial_spaces')
        .select('id, name, address, type')
        .in('type', ['cemetery', 'columbarium']);

    if (error) {
        console.error('❌ DB 조회 실패:', error);
        return;
    }

    console.log(`💾 DB: ${dbFacilities?.length || 0}개 묘지/납골당 시설\n`);

    // 3. CSV 파싱 및 비교
    const header = lines[0].toLowerCase();
    const hasFacTit = header.includes('fac_tit');

    let csvItems: Array<{ name: string; address: string; normName: string; normAddr: string }> = [];

    for (let i = 1; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i]);
        if (cols.length < 3) continue;

        let name, addr;

        if (hasFacTit) {
            // 새 형식
            name = cols[1]?.replace(/"/g, '').trim();
            addr = cols[2]?.replace(/"/g, '').trim();
        } else {
            // 기존 형식
            name = cols[1]?.replace(/"/g, '').trim();
            addr = cols[2]?.replace(/"/g, '').trim();
        }

        if (name && addr) {
            csvItems.push({
                name,
                address: addr,
                normName: normalizeName(name),
                normAddr: normalizeAddress(addr)
            });
        }
    }

    console.log(`✅ CSV 파싱 완료: ${csvItems.length}개 항목\n`);

    // 4. 매칭 확인
    let matchedCount = 0;
    let unmatchedCount = 0;
    const unmatchedItems: any[] = [];

    for (const csvItem of csvItems) {
        const matched = dbFacilities?.find(db => {
            const dbNormName = normalizeName(db.name);
            const dbNormAddr = normalizeAddress(db.address || '');

            return dbNormName === csvItem.normName ||
                dbNormAddr.includes(csvItem.normAddr) ||
                csvItem.normAddr.includes(dbNormAddr);
        });

        if (matched) {
            matchedCount++;
        } else {
            unmatchedCount++;
            unmatchedItems.push(csvItem);
        }
    }

    // 5. 결과 출력
    console.log(`\n📊 매칭 결과:`);
    console.log(`   ✅ DB에 존재: ${matchedCount}개`);
    console.log(`   ❌ DB에 없음: ${unmatchedCount}개`);
    console.log(`   📈 일치율: ${((matchedCount / csvItems.length) * 100).toFixed(1)}%\n`);

    // 6. 미매칭 항목 저장
    if (unmatchedItems.length > 0) {
        let csvContent = "시설명,주소\n";
        unmatchedItems.forEach(item => {
            csvContent += `"${item.name}","${item.address}"\n`;
        });

        const outputPath = path.resolve(process.cwd(), 'cemetery_unmatched.csv');
        fs.writeFileSync(outputPath, csvContent, 'utf-8');
        console.log(`📄 미매칭 항목 저장: ${outputPath}`);

        console.log(`\n⚠️  미매칭 항목 샘플 (최대 10개):`);
        unmatchedItems.slice(0, 10).forEach((item, idx) => {
            console.log(`   ${idx + 1}. ${item.name} - ${item.address}`);
        });
    }

    console.log(`\n🎉 확인 완료!`);
}

checkCemeteryData();
