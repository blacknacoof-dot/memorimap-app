import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import * as dotenv from 'dotenv';
import * as path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// 한국 성씨 (상위 30개)
const surnames = [
    '김', '이', '박', '최', '정', '강', '조', '윤', '장', '임',
    '한', '오', '서', '신', '권', '황', '안', '송', '전', '홍',
    '유', '고', '문', '양', '손', '배', '백', '허', '남', '심'
];

// 별점별 후기 템플릿
const reviewTemplates = {
    5: [
        '아버지 장례를 치르면서 상조 서비스를 이용했는데 정말 만족스러웠습니다. 처음부터 끝까지 세심하게 케어해주셔서 유가족으로서 큰 힘이 되었습니다. 특히 담당자분이 친절하고 전문적이어서 믿고 맡길 수 있었습니다.',
        '어머니 장례식을 진행했는데 모든 과정이 원활하게 진행되었습니다. 예상치 못한 추가 비용도 없었고, 직원분들이 정말 친절하셔서 감사했습니다. 상조회 가입해두길 정말 잘했다는 생각이 듭니다.',
        '급하게 장례를 치르게 되어 걱정이 많았는데, 24시간 상담 서비스 덕분에 빠르게 준비할 수 있었습니다. 장례 용품 품질도 우수했고, 진행 과정도 매끄러웠습니다. 주변에 적극 추천하고 싶습니다.',
        '상조 서비스 이용 후 정말 만족합니다. 장례 절차가 복잡할 줄 알았는데 담당자가 모든걸 챙겨주셔서 편했습니다. 가격도 합리적이고 서비스 품질도 훌륭했습니다. 가족들도 모두 만족했습니다.',
        '처음 상조회를 이용해봤는데 기대 이상이었습니다. 장례식장 선택부터 행정 처리까지 모든 것을 도와주셔서 큰 도움이 되었습니다. 직원분들의 진심 어린 위로도 감사했습니다.'
    ],
    4: [
        '전반적으로 만족스러운 서비스였습니다. 장례 절차가 순조롭게 진행되었고 직원분들도 친절하셨습니다. 다만 일부 옵션 상품의 가격이 조금 비싼 편이라 아쉬웠습니다.',
        '상조 서비스 품질은 좋았습니다. 담당자가 성실하게 응대해주셨고 장례식도 무난하게 치렀습니다. 초기 상담 시 좀 더 자세한 가격 안내가 있었으면 더 좋았을 것 같습니다.',
        '장례를 잘 치를 수 있도록 도와주셔서 감사합니다. 대부분 만족스러웠으나 일부 장례 용품의 선택지가 제한적이어서 조금 아쉬웠습니다. 그래도 전체적으로는 좋은 서비스였습니다.',
        '상조회 혜택을 잘 받았습니다. 직원분들이 친절하고 절차도 체계적이었습니다. 다만 주말에 연락이 조금 늦어져서 답답했던 순간이 있었지만 전반적으로는 괜찮았습니다.',
        '장례 서비스 자체는 훌륭했습니다. 다만 계약 당시와 실제 서비스 내용에 약간의 차이가 있어서 당황스러웠습니다. 그래도 담당자가 잘 설명해주셔서 이해할 수 있었습니다.'
    ],
    3: [
        '장례는 무사히 치렀지만 기대했던 것보다는 조금 아쉬웠습니다. 일부 서비스가 추가 비용이 발생해서 예산을 초과했고, 사전 안내가 부족했던 것 같습니다.',
        '기본적인 장례 서비스는 제공되었으나 특별히 만족스럽지는 않았습니다. 담당자 응대가 다소 기계적이었고, 장례 용품 품질도 평범한 수준이었습니다.',
        '상조회 가입 시 설명과 실제 서비스에 차이가 있어서 실망스러웠습니다. 장례는 치렀지만 추가 비용이 예상보다 많이 발생했습니다. 좀 더 투명한 가격 정책이 필요해 보입니다.',
        '장례 진행은 무난했으나 직원들의 응대가 일관적이지 않았습니다. 어떤 분은 친절하셨지만 어떤 분은 불친절했습니다. 서비스 품질 관리가 필요할 것 같습니다.',
        '보통 수준의 서비스였습니다. 특별히 나쁘지는 않았지만 감동적이지도 않았습니다. 가격 대비 서비스가 조금 아쉽고, 사후 관리도 부족한 느낌이었습니다.'
    ]
};

// 랜덤 사용자 이름 생성 (성씨**)
function generateUserName(): string {
    const surname = surnames[Math.floor(Math.random() * surnames.length)];
    return `${surname}**`;
}

// 랜덤 날짜 생성 (최근 6개월 이내)
function generateRandomDate(): string {
    const now = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(now.getMonth() - 6);

    const randomTime = sixMonthsAgo.getTime() + Math.random() * (now.getTime() - sixMonthsAgo.getTime());
    const randomDate = new Date(randomTime);

    return randomDate.toISOString();
}

// 리뷰 객체 생성
function createReview(rating: 3 | 4 | 5): any {
    const templates = reviewTemplates[rating];
    const content = templates[Math.floor(Math.random() * templates.length)];
    const userName = generateUserName();
    const userId = uuidv4();
    const reviewId = uuidv4();
    const createdAt = generateRandomDate();

    return {
        id: reviewId,
        userId: userId,
        user_id: userId,
        userName: userName,
        rating: rating,
        content: content,
        created_at: createdAt,
        date: createdAt.split('T')[0]
    };
}

// 메인 실행 함수
async function main() {
    console.log('🚀 상조서비스 후기 생성 시작...\n');

    // 1. 상조 회사 조회 (funeral_companies 테이블)
    const { data: companies, error: fetchError } = await supabase
        .from('funeral_companies')
        .select('id, name');

    if (fetchError) {
        console.error('❌ 상조 회사 조회 실패:', fetchError);
        return;
    }

    if (!companies || companies.length === 0) {
        console.log('⚠️  상조 회사가 없습니다.');
        return;
    }

    console.log(`📋 총 ${companies.length}개의 상조 회사 발견\n`);

    let totalReviewsAdded = 0;
    const stats = { '5점': 0, '4점': 0, '3점': 0 };

    // 2. 각 상조 회사에 리뷰 생성
    for (const company of companies) {
        console.log(`\n📝 처리 중: ${company.name} (ID: ${company.id})`);

        // 새로운 리뷰 15개 생성 (3점 5개, 4점 5개, 5점 5개)
        const newReviews = [
            ...Array(5).fill(null).map(() => createReview(5)),
            ...Array(5).fill(null).map(() => createReview(4)),
            ...Array(5).fill(null).map(() => createReview(3))
        ];

        // reviews 테이블에 삽입할 데이터 준비
        const reviewsToInsert = newReviews.map(review => ({
            id: review.id,
            user_id: review.userId,
            facility_id: company.id, // 상조 회사 ID
            rating: review.rating,
            content: review.content,
            created_at: review.created_at
        }));

        // reviews 테이블에 삽입
        const { error: insertError } = await supabase
            .from('reviews')
            .insert(reviewsToInsert);

        if (insertError) {
            console.error(`  ❌ 리뷰 삽입 실패:`, insertError.message);
            continue;
        }

        //  회사의 리뷰 통계 업데이트
        const { data: allReviews, error: countError } = await supabase
            .from('reviews')
            .select('rating')
            .eq('facility_id', company.id);

        if (!countError && allReviews) {
            const totalRating = allReviews.reduce((sum, review) => sum + review.rating, 0);
            const averageRating = parseFloat((totalRating / allReviews.length).toFixed(1));

            // funeral_companies 테이블 업데이트
            await supabase
                .from('funeral_companies')
                .update({
                    review_count: allReviews.length,
                    rating: averageRating
                })
                .eq('id', company.id);

            console.log(`  ✅ 15개 리뷰 추가 완료`);
            console.log(`  📊 총 리뷰: ${allReviews.length}개`);
            console.log(`  ⭐ 평균 별점: ${averageRating}`);
        }

        totalReviewsAdded += 15;
        stats['5점'] += 5;
        stats['4점'] += 5;
        stats['3점'] += 5;
    }

    // 3. 결과 리포트
    console.log('\n' + '='.repeat(50));
    console.log('✨ 상조서비스 후기 생성 완료!\n');
    console.log(`📦 처리된 상조 회사: ${companies.length}개`);
    console.log(`📝 총 생성된 리뷰: ${totalReviewsAdded}개`);
    console.log(`\n별점별 통계:`);
    console.log(`  ⭐⭐⭐⭐⭐ 5점: ${stats['5점']}개`);
    console.log(`  ⭐⭐⭐⭐ 4점: ${stats['4점']}개`);
    console.log(`  ⭐⭐⭐ 3점: ${stats['3점']}개`);
    console.log('='.repeat(50));
}

main();
