import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
);

interface GoogleEnrichmentCandidate {
    db_id: number;
    original_name: string;
    original_address: string;
    google_data: {
        name: string;
        formattedAddress: string;
        phone: string | null;
        website: string | null;
        googleMapsUri: string;
        rating: number | null;
        userRatingCount: number | null;
        openingHours: string[] | null;
        location: { latitude: number; longitude: number };
        photos: string[];
    };
    similarity_score: number;
    status: string;
    notes: string[];
}

async function applyGoogleDataToDb() {
    console.log('🚀 구글 데이터 DB 적용 시작...\n');

    // 1. 구글 데이터 파일 로드
    const dataPath = path.resolve(process.cwd(), 'scripts/google_enrichment_candidates_2025-12-27T14-50-54-891Z.json');

    if (!fs.existsSync(dataPath)) {
        console.error('❌ 구글 데이터 파일을 찾을 수 없습니다:', dataPath);
        return;
    }

    const candidates: GoogleEnrichmentCandidate[] = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    console.log(`📋 구글 데이터 ${candidates.length}개 로드 완료\n`);

    // 2. 통계
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    const updateLog: any[] = [];

    // 3. 각 시설 업데이트
    for (let i = 0; i < candidates.length; i++) {
        const candidate = candidates[i];
        const gd = candidate.google_data;

        // match 또는 review_needed 상태만 적용 (mismatch 제외)
        if (candidate.status === 'mismatch') {
            skipped++;
            continue;
        }

        // 업데이트할 데이터 준비 (평점/리뷰 제외, DB에 없는 컬럼 제외)
        const updateData: Record<string, any> = {};

        // 전화번호 (기존값 없으면 적용)
        if (gd.phone) {
            updateData.phone = gd.phone;
        }

        // 갤러리 이미지 (기존값 없거나 비어있으면 적용)
        if (gd.photos && gd.photos.length > 0) {
            updateData.gallery_images = gd.photos;
        }

        // 메인 이미지 (기존값이 unsplash 기본 이미지면 교체)
        if (gd.photos && gd.photos.length > 0) {
            // 첫번째 사진을 메인 이미지로 사용
            updateData.image_url = gd.photos[0];
        }

        // 업데이트할 데이터가 없으면 스킵
        if (Object.keys(updateData).length === 0) {
            skipped++;
            continue;
        }

        // DB 업데이트
        const { error } = await supabase
            .from('memorial_spaces')
            .update(updateData)
            .eq('id', candidate.db_id);

        if (error) {
            console.error(`❌ [${i + 1}/${candidates.length}] ${candidate.original_name}: ${error.message}`);
            errors++;
        } else {
            updated++;
            updateLog.push({
                id: candidate.db_id,
                name: candidate.original_name,
                updates: Object.keys(updateData)
            });

            if (updated % 50 === 0) {
                console.log(`✅ ${updated}개 업데이트 완료...`);
            }
        }

        // API 제한 대응 (50ms 딜레이)
        await new Promise(resolve => setTimeout(resolve, 50));
    }

    // 4. 결과 출력
    console.log('\n' + '='.repeat(50));
    console.log('📊 DB 업데이트 완료');
    console.log('='.repeat(50));
    console.log(`✅ 업데이트: ${updated}개`);
    console.log(`⏭️  스킵: ${skipped}개 (mismatch 또는 데이터 없음)`);
    console.log(`❌ 오류: ${errors}개`);

    // 5. 로그 저장
    const logPath = path.resolve(process.cwd(), 'scripts/google_db_update_log.json');
    fs.writeFileSync(logPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        totalProcessed: candidates.length,
        updated,
        skipped,
        errors,
        updates: updateLog
    }, null, 2));
    console.log(`\n📝 업데이트 로그 저장: ${logPath}`);
}

applyGoogleDataToDb();
