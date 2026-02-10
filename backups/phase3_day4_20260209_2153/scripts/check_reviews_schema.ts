import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkReviewsTable() {
    console.log('🔍 facility_reviews 테이블 스키마 조회 중...\n');

    // 1. 샘플 데이터 조회
    const { data: sample, error: sampleError } = await supabase
        .from('facility_reviews')
        .select('*')
        .limit(1);

    if (sampleError) {
        console.error('샘플 조회 실패:', sampleError);
    } else if (sample && sample.length > 0) {
        const review = sample[0];
        console.log('\n✅ facility_reviews 샘플:');
        console.log(JSON.stringify(review, null, 2));

        console.log('\n--- 컬럼별 값 확인 ---');
        Object.entries(review).forEach(([key, value]) => {
            console.log(`${key}: ${value} (Type: ${typeof value})`);
        });
    }

    // 2. 익명 리뷰 수 확인
    const { count: anonymousCount, error: countError } = await supabase
        .from('facility_reviews')
        .select('*', { count: 'exact', head: true })
        .eq('author_name', '익명');

    if (!countError) {
        console.log(`\n📊 '익명'으로 표시된 리뷰 수: ${anonymousCount}건`);
    }

    // 3. 특정 요약 통계
    const { data: distribution, error: distError } = await supabase
        .from('facility_reviews')
        .select('author_name');

    if (!distError && distribution) {
        const counts: Record<string, number> = {};
        distribution.forEach(r => {
            counts[r.author_name] = (counts[r.author_name] || 0) + 1;
        });
        console.log('\n📊 작성자 이름 분포 (상위 10개):');
        Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .forEach(([name, count]) => {
                console.log(`- ${name}: ${count}건`);
            });
    }
}

checkReviewsTable();
