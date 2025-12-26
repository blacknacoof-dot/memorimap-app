import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// 환경 변수 로드
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("❌ 필수 설정(Supabase)이 누락되었습니다.");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const DATA_DIR = path.resolve(process.cwd(), '납골당보안시설자료');

// 타입 추론
function inferType(name: string, fileName: string): string {
    if (fileName.includes('봉안')) return 'charnel';
    if (fileName.includes('묘지')) return 'park';
    if (fileName.includes('자연장') || fileName.includes('수목장')) return 'natural';
    if (fileName.includes('산분장')) return 'sea';

    // 이름 기반 추론
    if (name.includes('납골') || name.includes('봉안')) return 'charnel';
    if (name.includes('수목') || name.includes('자연장')) return 'natural';
    if (name.includes('해양') || name.includes('산분장')) return 'sea';
    if (name.includes('공원') || name.includes('묘원')) return 'park';

    return 'charnel'; // Default
}

// CSV 파싱
function parseCSVLine(line: string) {
    const result = [];
    let current = '';
    let inQuote = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '\"') {
            inQuote = !inQuote;
        } else if (char === ',' && !inQuote) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
}

async function processFile(filePath: string) {
    const fileName = path.basename(filePath);
    console.log(`\n📁 처리 중: ${fileName}`);

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split(/\r?\n/);

    let successCount = 0;
    let failCount = 0;

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const cols = parseCSVLine(line);
        if (cols.length < 6) continue;

        const imageUrl = cols[1];
        const name = cols[2];
        const address = cols[3].replace(/\"/g, '');
        const phone = cols[5];

        if (!name) continue;

        const facilityType = inferType(name, fileName);

        // 기존 데이터 확인
        const { data: existing } = await supabase
            .from('memorial_spaces')
            .select('id')
            .eq('name', name)
            .maybeSingle();

        if (existing) {
            // 기존 시설 업데이트 (이미지, 주소, 전화번호)
            const { error: updateError } = await supabase
                .from('memorial_spaces')
                .update({
                    image_url: imageUrl,
                    address,
                    phone
                })
                .eq('id', existing.id);

            if (updateError) {
                console.error(`  ❌ 업데이트 실패 (${name}): ${updateError.message}`);
                failCount++;
            } else {
                successCount++;
            }
        } else {
            // 신규 등록
            const payload: any = {
                name,
                address,
                phone,
                image_url: imageUrl,
                type: facilityType,
                id: Math.floor(Math.random() * 9000000000 + 1000000000).toString(),
                lat: 37.5,
                lng: 127.0,
                is_verified: false,
                data_source: 'public_data'
            };

            const { error } = await supabase
                .from('memorial_spaces')
                .insert(payload);

            if (error) {
                console.error(`  ❌ 실패 (${name}): ${error.message}`);
                failCount++;
            } else {
                successCount++;
            }
        }
    }

    console.log(`  ✅ 성공: ${successCount} | ❌ 실패: ${failCount}`);
}

async function importAll() {
    console.log("🚀 납골당·보안시설 데이터 일괄 등록 시작...\n");

    if (!fs.existsSync(DATA_DIR)) {
        console.error(`❌ 디렉토리를 찾을 수 없습니다: ${DATA_DIR}`);
        return;
    }

    const files = fs.readdirSync(DATA_DIR)
        .filter(f => f.endsWith('.csv'))
        .sort();

    console.log(`📊 총 ${files.length}개 파일 발견\n`);

    for (const file of files) {
        await processFile(path.join(DATA_DIR, file));
    }

    console.log("\n🎉 전체 작업 완료!");
}

importAll();
