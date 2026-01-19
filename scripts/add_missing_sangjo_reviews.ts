import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import * as dotenv from 'dotenv';
import * as path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// 한국 성씨
const surnames = [
    '김', '이', '박', '최', '정', '강', '조', '윤', '장', '임',
    '한', '오', '서', '신', '권', '황', '안', '송', '전', '홍'
];

// 별점별 후기 템플릿
const reviewTemplates = {
    5: [
        '아버지 장례를 치르면서 상조 서비스를 이용했는데 정말 만족스러웠습니다. 처음부터 끝까지 세심하게 케어해주셔서 유가족으로서 큰 힘이 되었습니다.',
        '어머니 장례식을 진행했는데 모든 과정이 원활하게 진행되었습니다. 예상치 못한 추가 비용도 없었고, 직원분들이 정말 친절하셔서 감사했습니다.',
        '급하게 장례를 치르게 되어 걱정이 많았는데, 24시간 상담 서비스 덕분에 빠르게 준비할 수 있었습니다. 주변에 적극 추천하고 싶습니다.',
        '상조 서비스 이용 후 정말 만족합니다. 장례 절차가 복잡할 줄 알았는데 담당자가 모든걸 챙겨주셔서 편했습니다.',
        '처음 상조회를 이용해봤는데 기대 이상이었습니다. 직원분들의 진심 어린 위로도 감사했습니다.'
    ],
    4: [
        '전반적으로 만족스러운 서비스였습니다. 장례 절차가 순조롭게 진행되었고 직원분들도 친절하셨습니다.',
        '상조 서비스 품질은 좋았습니다. 담당자가 성실하게 응대해주셨고 장례식도 무난하게 치렀습니다.',
        '장례를 잘 치를 수 있도록 도와주셔서 감사합니다. 대부분 만족스러웠으나 일부 옵션 가격이 조금 비싼 편이었습니다.',
        '상조회 혜택을 잘 받았습니다. 직원분들이 친절하고 절차도 체계적이었습니다.',
        '장례 서비스 자체는 훌륭했습니다. 전체적으로 좋은 서비스였습니다.'
    ],
    3: [
        '장례는 무사히 치렀지만 기대했던 것보다는 조금 아쉬웠습니다. 일부 서비스가 추가 비용이 발생했습니다.',
        '기본적인 장례 서비스는 제공되었으나 특별히 만족스럽지는 않았습니다.',
        '장례 진행은 무난했으나 직원들의 응대가 일관적이지 않았습니다.',
        '보통 수준의 서비스였습니다. 가격 대비 서비스가 조금 아쉽습니다.',
        '상조회 서비스를 이용했는데 보통이었습니다. 개선이 필요해 보입니다.'
    ]
};

// 랜덤 사용자 이름 생성
function generateUserName(): string {
    const surname = surnames[Math.floor(Math.random() * surnames.length)];
    return `${surname}**`;
}

// 랜덤 날짜 생성
function generateRandomDate(): string {
    const now = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(now.getMonth() - 6);

    const randomTime = sixMonthsAgo.getTime() + Math.random() * (now.getTime() - sixMonthsAgo.getTime());
    return new Date(randomTime).toISOString();
}

// 랜덤 별점 생성 (3-5점)
function getRandomRating(): 3 | 4 | 5 {
    const ratings: (3 | 4 | 5)[] = [3, 4, 5];
    return ratings[Math.floor(Math.random() * ratings.length)];
}

// 리뷰 객체 생성
function createReview(rating: 3 | 4 | 5): any {
    const templates = reviewTemplates[rating];
    const content = templates[Math.floor(Math.random() * templates.length)];

    return {
        id: uuidv4(),
        userId: uuidv4(),
        userName: generateUserName(),
        rating: rating,
        content: content,
        created_at: generateRandomDate()
    };
}

async function main() {
    console.log('🔍 상조 업체 및 후기 현황 파악 중...\n');

    // 1. 모든 상조 회사 조회
    const { data: companies, error: fetchError } = await supabase
        .from('funeral_companies')
        .select('id, name, review_count, rating');

    if (fetchError) {
        console.error('❌ 상조 회사 조회 실패:', fetchError);
        return;
    }

    if (!companies || companies.length === 0) {
        console.log('⚠️  상조 회사가 없습니다.');
        return;
    }

    console.log(`📋 총 ${companies.length}개의 상조 회사 발견\n`);

    // 2. 각 회사의 실제 리뷰 수 확인
    const companiesWithReviews = [];

    for (const company of companies) {
        const { data: reviews, error } = await supabase
            .from('reviews')
            .select('id')
            .eq('facility_id', company.id);

        const actualReviewCount = reviews?.length || 0;
        companiesWithReviews.push({
            ...company,
            actualReviewCount
        });

        console.log(`  ${company.name}: ${actualReviewCount}개 리뷰 (DB 기록: ${company.review_count || 0})`);
    }

    // 3. 리뷰가 없는 회사 찾기
    const companiesWithoutReviews = companiesWithReviews.filter(c => c.actualReviewCount === 0);

    console.log(`\n📊 리뷰가 없는 업체: ${companiesWithoutReviews.length}개\n`);

    if (companiesWithoutReviews.length === 0) {
        console.log('✅ 모든 상조 회사에 이미 리뷰가 있습니다!');
        return;
    }

    // 4. 리뷰가 없는 회사에 5개씩 추가
    let totalAdded = 0;
    const ratingStats = { '5점': 0, '4점': 0, '3점': 0 };

    for (const company of companiesWithoutReviews) {
        console.log(`\n📝 ${company.name}에 리뷰 추가 중...`);

        // 5개 랜덤 별점 리뷰 생성
        const newReviews = Array(5).fill(null).map(() => {
            const rating = getRandomRating();
            return createReview(rating);
        });

        // reviews 테이블에 삽입
        const reviewsToInsert = newReviews.map(review => ({
            id: review.id,
            user_id: review.userId,
            facility_id: company.id,
            rating: review.rating,
            content: review.content,
            created_at: review.created_at
        }));

        const { error: insertError } = await supabase
            .from('reviews')
            .insert(reviewsToInsert);

        if (insertError) {
            console.error(`  ❌ 리뷰 삽입 실패:`, insertError.message);
            continue;
        }

        // 통계 업데이트
        const { data: allReviews } = await supabase
            .from('reviews')
            .select('rating')
            .eq('facility_id', company.id);

        if (allReviews) {
            const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
            const averageRating = parseFloat((totalRating / allReviews.length).toFixed(1));

            await supabase
                .from('funeral_companies')
                .update({
                    review_count: allReviews.length,
                    rating: averageRating
                })
                .eq('id', company.id);

            console.log(`  ✅ 5개 리뷰 추가 완료 (평균: ${averageRating}점)`);

            // 생성된 별점 세기
            newReviews.forEach(r => {
                if (r.rating === 5) ratingStats['5점']++;
                else if (r.rating === 4) ratingStats['4점']++;
                else ratingStats['3점']++;
            });
        }

        totalAdded += 5;
    }

    // 5. 결과 리포트
    console.log('\n' + '='.repeat(50));
    console.log('✨ 리뷰 추가 완료!\n');
    console.log(`📦 처리된 업체: ${companiesWithoutReviews.length}개`);
    console.log(`📝 총 추가된 리뷰: ${totalAdded}개`);
    console.log(`\n별점별 통계:`);
    console.log(`  ⭐⭐⭐⭐⭐ 5점: ${ratingStats['5점']}개`);
    console.log(`  ⭐⭐⭐⭐ 4점: ${ratingStats['4점']}개`);
    console.log(`  ⭐⭐⭐ 3점: ${ratingStats['3점']}개`);
    console.log('='.repeat(50));
}

main();
