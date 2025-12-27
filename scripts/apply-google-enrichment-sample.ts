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
    console.log('🚀 구글 데이터 샘플 업데이트 (10개) 시작...');

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

    // 'match' 상태인 것 중 10개만 선택
    const targets = candidates.filter((c: any) => c.status === 'match').slice(0, 10);

    if (targets.length === 0) {
        console.error('❌ 업데이트할 매칭 데이터(match)가 없습니다.');
        return;
    }

    console.log(`📋 업데이트 대상: ${targets.length}개`);

    let successCount = 0;

    for (const item of targets) {
        console.log(`\n🔄 업데이트 중: ${item.original_name} (ID: ${item.db_id})`);

        const updateData = {
            // 기존 주소 덮어쓰기 여부 확인 (여기서는 덮어씀)
            address: item.google_data.formattedAddress,
            phone: item.google_data.phone || undefined, // null이면 제외
            // type: 'funeral', // 타입은 변경하지 않음

            // JSONB 필드 업데이트 (기존 데이터 유지하며 병합은 SQL 레벨이 안전하지만 여기선 단순화)
            // images: item.google_data.photos, // images 컬럼이 text[] 인지 jsonb인지 확인 필요

            // 추가 정보: 영업시간, 평점 등은 별도 컬럼이 없으면 description 등에 넣거나 무시
            rating: item.google_data.rating || undefined,
            review_count: item.google_data.userRatingCount || undefined,

            // 구글 데이터 출처 표시 (선택사항)
            // data_source: 'google_places_api'
        };

        // 이미지 처리 (Unsplash -> Google Photo)
        // memorial_spaces 테이블 스키마 확인 필요. 보통 image_url (대표이미지) + gallery_images (배열)
        if (item.google_data.photos.length > 0) {
            (updateData as any).image_url = item.google_data.photos[0];
            (updateData as any).gallery_images = item.google_data.photos;
        }

        const { error } = await supabase
            .from('memorial_spaces')
            .update(updateData)
            .eq('id', item.db_id);

        if (error) {
            console.error(`   ❌ 업데이트 실패: ${error.message}`);
        } else {
            console.log(`   ✅ 업데이트 완료`);
            console.log(`      주소: ${item.original_address} -> ${item.google_data.formattedAddress}`);
            successCount++;
        }
    }

    console.log(`\n✅ 총 ${successCount}개 시설 정보 업데이트 완료`);
}

main().catch(console.error);
