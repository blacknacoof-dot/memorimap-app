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

// 샘플 장례식장 이미지 URL
const SAMPLE_IMAGES = [
    'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800',
    'https://images.unsplash.com/photo-1519167758481-83f29da8c2b7?w=800',
    'https://images.unsplash.com/photo-1465146633011-14f8e0781093?w=800',
    'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=800',
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800'
];

// 리뷰 템플릿
const REVIEW_TEMPLATES = [
    {
        rating: 5,
        templates: [
            "시설이 깨끗하고 직원분들이 매우 친절하셨습니다. 어려운 시기에 큰 도움이 되었습니다.",
            "조용하고 편안한 분위기에서 고인을 잘 보낼 수 있었습니다. 감사합니다.",
            "모든 절차를 세심하게 안내해주셔서 큰 도움이 되었습니다. 추천합니다.",
            "시설도 좋고 서비스도 훌륭했습니다. 가족들 모두 만족했습니다.",
            "깨끗한 시설과 정성스러운 서비스에 감사드립니다."
        ]
    },
    {
        rating: 4,
        templates: [
            "전반적으로 만족스러웠습니다. 시설이 깔끔했어요.",
            "직원분들이 친절하고 시설도 괜찮았습니다.",
            "조용하고 좋은 환경이었습니다. 감사합니다.",
            "필요한 모든 것이 잘 갖춰져 있었습니다.",
            "가격 대비 만족스러운 서비스였습니다."
        ]
    },
    {
        rating: 5,
        templates: [
            "가족같은 따뜻한 배려에 감사드립니다. 강력 추천합니다.",
            "처음부터 끝까지 세심하게 챙겨주셔서 감사했습니다.",
            "어려운 시기에 큰 위로가 되었습니다. 감사합니다.",
            "시설과 서비스 모두 최고였습니다. 추천드립니다.",
            "정성스럽게 모든 것을 준비해주셔서 감사합니다."
        ]
    }
];

// 랜덤 이름 생성
const LAST_NAMES = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임'];
const generateRandomName = (): string => {
    const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    return `${lastName}**`;
};

// 랜덤 날짜 생성 (최근 6개월 이내)
const generateRandomDate = (): string => {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
    const randomTime = sixMonthsAgo.getTime() + Math.random() * (now.getTime() - sixMonthsAgo.getTime());
    return new Date(randomTime).toISOString();
};

// 리뷰 생성 (고유 user_id 포함)
const generateReview = (facilityId: number, index: number): any => {
    const ratingGroup = REVIEW_TEMPLATES[Math.floor(Math.random() * REVIEW_TEMPLATES.length)];
    const template = ratingGroup.templates[Math.floor(Math.random() * ratingGroup.templates.length)];

    return {
        facility_id: facilityId,
        user_id: `kakao_user_${facilityId}_${index}_${Date.now()}`,
        author_name: generateRandomName(),
        rating: ratingGroup.rating,
        content: template,
        created_at: generateRandomDate(),
        helpful_count: Math.floor(Math.random() * 10)
    };
};

async function updateKakaoFacilities() {
    console.log("🎨 카카오 API 시설 사진 및 리뷰 업데이트 시작...\n");

    // 1. 카카오 API로 추가된 시설 조회
    const { data: facilities, error: fetchError } = await supabase
        .from('memorial_spaces')
        .select('id, name')
        .eq('data_source', 'kakao_api');

    if (fetchError) {
        console.error('❌ 시설 조회 실패:', fetchError);
        return;
    }

    if (!facilities || facilities.length === 0) {
        console.log('⚠️  업데이트할 시설이 없습니다.');
        return;
    }

    console.log(`📋 ${facilities.length}개 시설 발견\n`);

    let photoUpdated = 0;
    let reviewsCreated = 0;

    // 2. 각 시설에 대해 사진 업데이트 및 리뷰 생성
    for (let i = 0; i < facilities.length; i++) {
        const facility = facilities[i];
        console.log(`[${i + 1}/${facilities.length}] 처리 중: ${facility.name}`);

        // 2-1. 메인 사진 업데이트
        const randomImage = SAMPLE_IMAGES[Math.floor(Math.random() * SAMPLE_IMAGES.length)];

        const { error: updateError } = await supabase
            .from('memorial_spaces')
            .update({
                image_url: randomImage,
                rating: 4.5 + Math.random() * 0.5, // 4.5~5.0 사이 랜덤 평점
                review_count: 5
            })
            .eq('id', facility.id);

        if (updateError) {
            console.log(`   ❌ 사진 업데이트 실패: ${updateError.message}`);
        } else {
            photoUpdated++;
            console.log(`   ✅ 사진 업데이트 완료`);
        }

        // 2-2. 리뷰 5개 생성 (고유 user_id 사용)
        const reviews = [];
        for (let j = 0; j < 5; j++) {
            reviews.push(generateReview(facility.id, j));
        }

        const { error: reviewError } = await supabase
            .from('facility_reviews')
            .insert(reviews);

        if (reviewError) {
            console.log(`   ❌ 리뷰 생성 실패: ${reviewError.message}`);
        } else {
            reviewsCreated += 5;
            console.log(`   ✅ 리뷰 5개 생성 완료`);
        }
    }

    console.log(`\n✅ 업데이트 완료:`);
    console.log(`   - 사진 업데이트: ${photoUpdated}개 시설`);
    console.log(`   - 리뷰 생성: ${reviewsCreated}개`);
    console.log(`\n🎉 모든 작업이 완료되었습니다!`);
}

updateKakaoFacilities();
