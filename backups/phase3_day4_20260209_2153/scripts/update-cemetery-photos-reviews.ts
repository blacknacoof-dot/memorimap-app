import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load Env
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
);

// 샘플 이미지 URL 목록
const SAMPLE_IMAGES = [
    'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800',
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800',
    'https://images.unsplash.com/photo-1519167758481-83f29da8c2b7?w=800',
    'https://images.unsplash.com/photo-1465146633011-14f8e0781093?w=800',
    'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=800'
];

// 샘플 리뷰 템플릿
const REVIEW_TEMPLATES = [
    '조용하고 평화로운 분위기가 좋습니다. 관리도 잘 되어 있어요.',
    '시설이 깨끗하고 직원분들이 친절합니다.',
    '접근성이 좋고 주차 공간도 넉넉합니다.',
    '자연 경관이 아름다운 곳입니다. 추천합니다.',
    '관리 상태가 매우 좋고 시설도 현대적입니다.'
];

async function updateCemeteryPhotosAndReviews() {
    console.log("📸 묘지 시설 사진 및 리뷰 업데이트 시작...\n");

    // 1. 최근 추가된 묘지 시설 조회 (data_source='naver_api' and type='park')
    const { data: facilities, error } = await supabase
        .from('memorial_spaces')
        .select('id, name')
        .eq('data_source', 'naver_api')
        .eq('type', 'park')
        .order('id', { ascending: false })
        .limit(400);

    if (error) {
        console.error('❌ 시설 조회 실패:', error);
        return;
    }

    console.log(`📋 업데이트 대상: ${facilities.length}개 시설\n`);

    let photoUpdated = 0;
    let reviewsAdded = 0;

    for (let i = 0; i < facilities.length; i++) {
        const facility = facilities[i];
        console.log(`[${i + 1}/${facilities.length}] 처리 중: ${facility.name}`);

        // 2. 메인 사진 업데이트
        const randomImage = SAMPLE_IMAGES[Math.floor(Math.random() * SAMPLE_IMAGES.length)];

        const { error: updateError } = await supabase
            .from('memorial_spaces')
            .update({ image_url: randomImage })
            .eq('id', facility.id);

        if (updateError) {
            console.log(`   ⚠️  사진 업데이트 실패`);
        } else {
            photoUpdated++;
        }

        const reviews = [];
        for (let j = 0; j < 5; j++) {
            reviews.push({
                facility_id: facility.id,
                user_id: `user_${Date.now()}_${i}_${j}`,
                author_name: '익명',
                rating: 4 + Math.random(),
                content: REVIEW_TEMPLATES[j],
                created_at: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString()
            });
        }

        const { error: reviewError } = await supabase
            .from('facility_reviews')
            .insert(reviews);

        if (reviewError) {
            console.log(`   ⚠️  리뷰 추가 실패: ${reviewError.message}`);
        } else {
            reviewsAdded += 5;
            console.log(`   ✅ 사진 + 리뷰 5개 추가`);
        }
    }

    console.log(`\n✅ 업데이트 완료:`);
    console.log(`   - 사진 업데이트: ${photoUpdated}개`);
    console.log(`   - 리뷰 추가: ${reviewsAdded}개`);
}

updateCemeteryPhotosAndReviews();
