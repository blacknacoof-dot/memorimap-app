import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import * as dotenv from 'dotenv';
import * as path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// 원본 46개 상조 회사 데이터
const RAW_DATA = `1,프리드라이프,https://www.freedlife.com
2,교원라이프,https://www.kyowonlife.co.kr
3,대명스테이션,https://www.daemyungstation.co.kr
4,더케이예다함,https://www.yedaham.co.kr
5,보람상조개발,https://www.boram.com
6,보람상조라이프,https://www.boram.com
7,부모사랑,https://www.bumosarang.co.kr
8,보람상조리더스,https://www.boram.com
9,더피플라이프,https://www.thepeoplelife.co.kr
10,더리본,https://www.the-reborn.co.kr
11,보람상조피플,https://www.boram.com
12,효원상조,https://www.hwsj.co.kr
13,늘곁애라이프온,https://www.lifeon.co.kr
14,평화누리,https://www.phnuri.co.kr
15,SJ산림조합상조,https://www.sjsangjo.com
16,보람상조애니콜,https://www.boram.com
17,에이치디투어존,https://www.htourzone.kr
18,휴먼라이프,https://www.humanlifesj.com
19,제이케이,https://www.jk-life.co.kr
20,대노복지사업단,https://www.koreapeople.net
21,경우라이프,https://www.kwlife.co.kr
22,다온플랜,https://www.daonplan.com
23,에이플러스라이프,https://www.apluslife.co.kr
24,현대에스라이프,https://www.hyundaislife.com
25,한라상조,https://www.hallasangjo.co.kr
26,보람상조실로암,https://www.boram.com
27,디에스라이프,https://www.sangjo.com
28,엘비라이프,https://www.elbeelife.com
29,금호라이프,https://www.kumholife.co.kr
30,크리스찬상조,https://www.4christian.co.kr
31,우정라이프,https://www.ujeonglife.com
32,보훈상조,https://www.bohoon.co.kr
33,용인공원라이프,https://www.yonginparklife.com
34,불국토,https://www.bulgukto.co.kr
35,대한라이프보증,
36,우리제주상조,https://www.woorijeju-sangjo.co.kr
37,유토피아퓨처,https://www.utopiafuture.co.kr
38,다나상조,https://www.danasj.co.kr
39,아가페라이프,https://www.agapelife.co.kr
40,웰리빙라이프,https://www.yeadream.com
41,삼육리더스라이프,https://www.sda36sj.co.kr
42,우리관광,
43,세종라이프,https://www.sjlife.co.kr
44,삼우라이프,
45,태양라이프,
46,새부산상조,`;

// 한국 성씨
const surnames = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오', '서', '신', '권', '황', '안', '송', '전', '홍'];

// 별점별 후기 템플릿
const reviewTemplates = {
    5: [
        '아버지 장례를 치르면서 상조 서비스를 이용했는데 정말 만족스러웠습니다. 처음부터 끝까지 세심하게 케어해주셔서 유가족으로서 큰 힘이 되었습니다.',
        '어머니 장례식을 진행했는데 모든 과정이 원활하게 진행되었습니다. 예상치 못한 추가 비용도 없었고, 직원분들이 정말 친절하셔서 감사했습니다.',
        '급하게 장례를 치르게 되어 걱정이 많았는데, 24시간 상담 서비스 덕분에 빠르게 준비할 수 있었습니다. 주변에 적극 추천하고 싶습니다.',
    ],
    4: [
        '전반적으로 만족스러운 서비스였습니다. 장례 절차가 순조롭게 진행되었고 직원분들도 친절하셨습니다.',
        '상조 서비스 품질은 좋았습니다. 담당자가 성실하게 응대해주셨고 장례식도 무난하게 치렀습니다.',
    ],
    3: [
        '장례는 무사히 치렀지만 기대했던 것보다는 조금 아쉬웠습니다.',
        '기본적인 장례 서비스는 제공되었으나 특별히 만족스럽지는 않았습니다.',
    ]
};

function generateUserName(): string {
    return `${surnames[Math.floor(Math.random() * surnames.length)]}**`;
}

function generateRandomDate(): string {
    const now = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(now.getMonth() - 6);
    const randomTime = sixMonthsAgo.getTime() + Math.random() * (now.getTime() - sixMonthsAgo.getTime());
    return new Date(randomTime).toISOString();
}

function getRandomRating(): 3 | 4 | 5 {
    const ratings: (3 | 4 | 5)[] = [3, 4, 5];
    return ratings[Math.floor(Math.random() * ratings.length)];
}

function createReview(rating: 3 | 4 | 5) {
    const templates = reviewTemplates[rating];
    return {
        id: uuidv4(),
        userId: uuidv4(),
        rating,
        content: templates[Math.floor(Math.random() * templates.length)],
        created_at: generateRandomDate()
    };
}

async function main() {
    console.log('🚀 46개 상조 회사 및 후기 추가 시작...\n');

    const lines = RAW_DATA.split('\n').filter(l => l.trim());
    const existingCompanies = new Set<string>();

    // 기존 회사 확인
    const { data: existing } = await supabase.from('funeral_companies').select('name');
    if (existing) {
        existing.forEach(c => existingCompanies.add(c.name));
    }

    let added = 0;
    let totalReviews = 0;

    for (const line of lines) {
        const [rank, name, homepage] = line.split(',').map(s => s.trim());

        if (existingCompanies.has(name)) {
            console.log(`⏭️  ${name} - 이미 존재함`);
            continue;
        }

        // 회사 추가
        const companyId = `fc${rank}`;
        const { error: insertError } = await supabase
            .from('funeral_companies')
            .insert({
                id: companyId,
                name,
                rating: 0,
                review_count: 0,
                image_url: '/images/default_sangjo.png',
                description: `${name}의 프리미엄 상조 서비스입니다.`,
                features: ['전국 의전망', '24시간 상담'],
                phone: '1588-0000',
                price_range: '문의',
                benefits: ['회원 전용 혜택']
            });

        if (insertError) {
            console.error(`❌ ${name} 추가 실패:`, insertError.message);
            continue;
        }

        // 리뷰 5개 추가
        const reviews = Array(5).fill(null).map(() => {
            const rating = getRandomRating();
            return createReview(rating);
        });

        const reviewsToInsert = reviews.map(r => ({
            id: r.id,
            user_id: r.userId,
            facility_id: companyId,
            rating: r.rating,
            content: r.content,
            created_at: r.created_at
        }));

        const { error: revError } = await supabase.from('reviews').insert(reviewsToInsert);

        if (revError) {
            console.error(`❌ ${name} 리뷰 실패:`, revError.message);
        }

        // 통계 업데이트
        const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
        const averageRating = parseFloat((totalRating / reviews.length).toFixed(1));

        await supabase
            .from('funeral_companies')
            .update({ review_count: 5, rating: averageRating })
            .eq('id', companyId);

        console.log(`✅ ${name} 추가 완료 (${reviews.length}개 리뷰, 평균 ${averageRating}점)`);
        added++;
        totalReviews += 5;
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✨ 완료! ${added}개 회사 추가, 총 ${totalReviews}개 리뷰 생성`);
    console.log('='.repeat(60));
}

main();
