import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAllSangjoData() {
    console.log('🔍 상조 데이터 전체 확인 중...\n');

    // 1. funeral_companies 테이블의 모든 레코드 조회
    const { data: companies, error: compError } = await supabase
        .from('funeral_companies')
        .select('*');

    if (compError) {
        console.error('❌ funeral_companies 조회 실패:', compError);
        return;
    }

    console.log(`📊 funeral_companies 테이블: ${companies?.length || 0}개 업체\n`);

    if (companies && companies.length > 0) {
        for (const company of companies) {
            // 각 업체의 실제 리뷰 수 확인
            const { data: reviews, error: revError } = await supabase
                .from('reviews')
                .select('id, rating, content, created_at')
                .eq('facility_id', company.id);

            const reviewCount = reviews?.length || 0;

            console.log(`\n📌 ${company.name}`);
            console.log(`   ID: ${company.id}`);
            console.log(`   DB review_count: ${company.review_count || 0}`);
            console.log(`   실제 리뷰 수: ${reviewCount}`);
            console.log(`   평균 별점: ${company.rating || 0}`);

            if (reviewCount === 0) {
                console.log(`   ⚠️  리뷰 없음!`);
            } else if (reviewCount < 5) {
                console.log(`   ⚠️  리뷰가 ${reviewCount}개밖에 없음`);
            }
        }
    }

    // 2. memorial_spaces 테이블에서 sangjo 타입 확인
    const { data: memorialSangjo, error: memError } = await supabase
        .from('memorial_spaces')
        .select('id, name, type')
        .eq('type', 'sangjo');

    console.log(`\n\n📊 memorial_spaces 테이블의 sangjo: ${memorialSangjo?.length || 0}개`);

    if (memorialSangjo && memorialSangjo.length > 0) {
        console.log('\n⚠️  memorial_spaces에 sangjo가 있습니다:');
        memorialSangjo.forEach(m => {
            console.log(`   - ${m.name} (ID: ${m.id})`);
        });
    }

    // 3. facilities 테이블에서 sangjo 카테고리 확인
    const { data: facilitiesSangjo, error: facError } = await supabase
        .from('facilities')
        .select('id, name, category')
        .eq('category', 'sangjo');

    console.log(`\n📊 facilities 테이블의 sangjo: ${facilitiesSangjo?.length || 0}개`);

    if (facilitiesSangjo && facilitiesSangjo.length > 0) {
        console.log('\n⚠️  facilities에 sangjo가 있습니다:');
        facilitiesSangjo.forEach(f => {
            console.log(`   - ${f.name} (ID: ${f.id})`);
        });
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ 전체 확인 완료');
    console.log('='.repeat(60));
}

checkAllSangjoData();
