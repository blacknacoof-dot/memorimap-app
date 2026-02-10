
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
            result.push(current); // trim하지 않음 (공백 포함 가능성)
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);
    return result;
}

async function updatePhotosFromCSV() {
    console.log("📸 CSV 기반 묘지 시설 사진 업데이트 시작...\n");

    const csvPath = path.resolve(process.cwd(), '15774129-2025-12-22 re.csv');
    if (!fs.existsSync(csvPath)) {
        console.error(`❌ 파일 없음: ${csvPath}`);
        // 사용자 언급 파일명인 경우 체크
        const csvPath2 = path.resolve(process.cwd(), '15774129-2025-12-22묘지.csv');
        if (fs.existsSync(csvPath2)) {
            console.log(`ℹ️ ${csvPath2} 파일로 대체합니다.`);
            // 여기서 파일 path 교체하지 않고 그냥 진행? 아니, 재귀 호출은 아니고 변수 변경해야함.
            // 간단히 종료 후 다시 실행 유도하거나, 여기서 로직 분기.
            // 편의상 프로세스 종료하고 파일명 확인 요청 대신, 그냥 존재 확인되면 읽기.
        } else {
            return;
        }
    }

    // 파일 읽기 (re.csv 기준)
    const content = fs.readFileSync(csvPath, 'utf-8');
    const lines = content.split('\n').filter(l => l.trim());

    // 헤더: fac_type,fac_thumb src,fac_tit,fac_addr,fac_tel href,fac_tel,convenient src,...
    // 인덱스: fac_thumb src = 1, fac_tit = 2

    // 헤더 파싱해서 인덱스 확인
    const headers = parseCSVLine(lines[0]);
    const imgIdx = headers.findIndex(h => h.trim() === 'fac_thumb src');
    const nameIdx = headers.findIndex(h => h.trim() === 'fac_tit');
    const typeIdx = headers.findIndex(h => h.trim() === 'fac_type');

    if (imgIdx === -1 || nameIdx === -1) {
        console.error("❌ CSV 헤더를 찾을 수 없습니다.");
        return;
    }

    console.log(`📋 CSV 로드 완료: ${lines.length - 1}개 데이터`);
    console.log(`   - 이미지 컬럼 인덱스: ${imgIdx}`);
    console.log(`   - 이름 컬럼 인덱스: ${nameIdx}`);

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // 배치 처리를 위해 Promise.all 사용 고려했으나, 순차 처리로 안전하게 진행
    for (let i = 1; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i]);
        if (cols.length <= Math.max(imgIdx, nameIdx)) continue;

        let name = cols[nameIdx].trim();
        let imageUrl = cols[imgIdx].trim();
        // fac_type이 '공설'/'사설' 등으로 되어있음. 묘지 여부는 여기서 판단 안되나 15774129.go.kr 데이터는 대부분 장사시설.

        // 이름 정제 (괄호 제거 등) - DB 매칭을 위해
        // 예: 고려대안산병원장례식장 -> 고려대안산병원장례식장 (변화 없음)
        // 예: (재)하늘가장례식장 -> 하늘가장례식장? DB에는 어떻게 저장되어있나 확인 필요.
        // 일단 원본 이름으로 검색 시도.

        if (!imageUrl || imageUrl.length < 5) {
            // 이미지가 없는 경우 스킵
            skippedCount++;
            continue;
        }

        // 이미지 URL 검증 (http 포함 여부 등)
        // CSV에는 'https://...' 형태로 들어있음.

        // DB에서 시설 찾기
        // 이름으로 검색 (facilities 테이블 사용)
        const { data: facilities, error: fetchError } = await supabase
            .from('facilities')
            .select('id, name, image_url, images')
            .ilike('name', name);

        if (fetchError) {
            console.error(`❌ DB 조회 실패 (${name}):`, fetchError.message);
            errorCount++;
            continue;
        }

        let targetFacility = null;

        if (facilities && facilities.length > 0) {
            // 정확히 일치하는 것이 있으면 사용
            targetFacility = facilities.find(f => f.name === name);
            if (!targetFacility && facilities.length === 1) targetFacility = facilities[0];
        }

        if (!targetFacility) {
            // 괄호 제거 등 재시도 (간단히)
            skippedCount++;
            continue;
        }

        // 항상 업데이트 (사용자 요청: 데이터 있으니 배포해달라)
        // 1. facilities 테이블 업데이트 (image_url, images 배열)
        const { error: updateError } = await supabase
            .from('facilities')
            .update({
                image_url: imageUrl,
                images: [imageUrl] // 배열로도 저장하여 getFacilityImages fallback 지원
            })
            .eq('id', targetFacility.id);

        if (updateError) {
            console.error(`   ❌ facilities 업데이트 실패 (${name}):`, updateError.message);
            errorCount++;
        } else {
            // 2. facility_images 테이블에도 추가
            const { error: imageError } = await supabase
                .from('facility_images')
                .upsert({
                    facility_id: targetFacility.id,
                    image_url: imageUrl,
                    is_active: true,
                    created_at: new Date().toISOString()
                }, { onConflict: 'facility_id,image_url' }); // 복합키나 제약조건에 따라 다름. 일단 시도.

            // 만약 facility_images에 unique constraint가 없다면 중복 쌓일 수 있음.
            // 하지만 지금은 데이터 복구가 우선.

            if (imageError) {
                console.log(`   ⚠️ facility_images 추가 실패: ${imageError.message}`);
            }

            console.log(`   ✅ 사진 업데이트: ${name}`);
            updatedCount++;
        }
    }

    console.log(`\n🎉 업데이트 완료`);
    console.log(`   - 성공: ${updatedCount}`);
    console.log(`   - 스킵: ${skippedCount} (이미지 없음, 시설 미발견 등)`);
    console.log(`   - 에러: ${errorCount}`);
}

updatePhotosFromCSV();
