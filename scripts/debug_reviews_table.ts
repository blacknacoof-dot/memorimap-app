import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugReviews() {
    console.log('🔍 리뷰 데이터 상세 확인\n');

    // 1. reviews 테이블 총 개수
    const { data: allReviews, error: allError, count: totalCount } = await supabase
        .from('reviews')
        .select('*', { count: 'exact' });

    console.log(`📊 reviews 테이블 총 개수: ${totalCount || allReviews?.length || 0}`);

    // 2. facility_id별 리뷰 개수
    if (allReviews && allReviews.length > 0) {
        const facilityGroups = allReviews.reduce((acc, review) => {
            const fid = review.facility_id || 'NULL';
            acc[fid] = (acc[fid] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        console.log('\n📋 facility_id별 리뷰 개수:');
        Object.entries(facilityGroups).forEach(([fid, count]) => {
            console.log(`  ${fid}: ${count}개`);
        });

        // 3. 샘플 리뷰 3개
        console.log('\n📝 샘플 리뷰 (최근 3개):');
        allReviews.slice(0, 3).forEach((r, i) => {
            console.log(`\n  [${i + 1}] ID: ${r.id}`);
            console.log(`      facility_id: ${r.facility_id}`);
            console.log(`      user_id: ${r.user_id}`);
            console.log(`      rating: ${r.rating}`);
            console.log(`      content: ${r.content?.substring(0, 50)}...`);
            console.log(`      created_at: ${r.created_at}`);
        });
    }

    // 4. funeral_companies 테이블과 조인 확인
    console.log('\n\n🔗 funeral_companies와 reviews 조인 테스트:');
    const { data: joinTest, error: joinError } = await supabase
        .from('funeral_companies')
        .select('id, name, review_count')
        .limit(5);

    if (joinTest) {
        for (const company of joinTest) {
            const { data: companyReviews } = await supabase
                .from('reviews')
                .select('id')
                .eq('facility_id', company.id);

            console.log(`  ${company.name} (${company.id}): DB=${company.review_count}, 실제=${companyReviews?.length || 0}`);
        }
    }

    // 5. 테이블 스키마 확인
    console.log('\n\n📐 reviews 테이블 컬럼 구조:');
    if (allReviews && allReviews.length > 0) {
        console.log('  ' + Object.keys(allReviews[0]).join(', '));
    }

    console.log('\n' + '='.repeat(70));
}

debugReviews();
