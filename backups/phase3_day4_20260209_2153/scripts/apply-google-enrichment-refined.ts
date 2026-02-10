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

async function main() {
    console.log('🚀 (Refined) 구글 데이터 업데이트 시작...');

    // JSON 파일 로드 (가장 최근 것)
    const files = fs.readdirSync(path.join(process.cwd(), 'scripts'))
        .filter(f => f.startsWith('google_enrichment_candidates_') && f.endsWith('.json'))
        .sort().reverse();

    if (files.length === 0) {
        console.error('❌ 결과 파일을 찾을 수 없습니다.');
        return;
    }

    const latestFile = path.join(process.cwd(), 'scripts', files[0]);
    console.log(`📂 로드 중: ${files[0]}`);

    const candidates = JSON.parse(fs.readFileSync(latestFile, 'utf-8'));

    // 'match' 상태인 것만 선택
    // 테스트용으로 10개만 먼저 처리 (필요시 제거)
    const targets = candidates.filter((c: any) => c.status === 'match').slice(0, 10);
    // const targets = candidates.filter((c: any) => c.status === 'match'); // 전체 적용 시

    if (targets.length === 0) {
        console.error('❌ 업데이트할 매칭 데이터(match)가 없습니다.');
        return;
    }

    console.log(`📋 업데이트 대상: ${targets.length}개`);

    let successCount = 0;

    for (const item of targets) {
        console.log(`\n🔄 업데이트 중: ${item.original_name} (ID: ${item.db_id})`);

        // 1. 주소 결정
        let finalAddress = item.google_data.formattedAddress;

        // 노트에 "English Address Detected"가 있으면 원본 주소 유지
        const hasEnglishNote = item.notes && item.notes.some((n: string) => n.includes('English Address Detected'));
        if (hasEnglishNote) {
            finalAddress = item.original_address;
            console.log(`   🛡️ 영문 주소 감지 -> 기존 한글 주소 유지: ${finalAddress}`);
        } else {
            console.log(`   📍 주소 업데이트: ${item.original_address} -> ${finalAddress}`);
        }

        // 2. 전화번호 (이미 정제됨)
        const finalPhone = item.google_data.phone;
        if (finalPhone) console.log(`   📞 전화번호 업데이트: ${finalPhone}`);

        // 3. 사진 (업데이트 할지 결정)
        // 일단 사진은 추가하는 방향으로

        const updateData: any = {
            address: finalAddress,
            phone: finalPhone || undefined,
            rating: item.google_data.rating || undefined,
            review_count: item.google_data.userRatingCount || undefined,
            // data_source: 'google_places_api_enriched' // 필요한 경우
        };

        // 이미지 업데이트 (기존 이미지 없거나 Unsplash일 때 교체 고려, 여기선 덮어쓰기)
        if (item.google_data.photos.length > 0) {
            updateData.image_url = item.google_data.photos[0];
            updateData.gallery_images = item.google_data.photos;
            console.log(`   📸 사진 업데이트 (${item.google_data.photos.length}장)`);
        }

        const { error } = await supabase
            .from('memorial_spaces')
            .update(updateData)
            .eq('id', item.db_id);

        if (error) {
            console.error(`   ❌ 업데이트 실패: ${error.message}`);
        } else {
            console.log(`   ✅ 완료`);
            successCount++;
        }
    }

    console.log(`\n✅ 총 ${successCount}개 시설 정보 업데이트 완료`);
}

main().catch(console.error);
