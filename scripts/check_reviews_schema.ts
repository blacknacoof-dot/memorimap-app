import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkReviewsTable() {
    console.log('🔍 reviews 테이블 스키마 조회 중...\n');

    // 1. 빈 insert 시도 (에러 메시지에서 필수 컬럼 확인)
    const { error: testError } = await supabase
        .from('reviews')
        .insert({});

    if (testError) {
        console.log('필수 컬럼 오류:', testError.message);
        console.log('상세:', testError);
    }

    // 2. 기존 리뷰 하나 조회하여 구조 확인
    const { data: sample, error: sampleError } = await supabase
        .from('reviews')
        .select('*')
        .limit(1);

    if (sampleError) {
        console.error('샘플 조회 실패:', sampleError);
    } else if (sample && sample.length > 0) {
        console.log('\n✅ 기존 리뷰 샘플 (컬럼 구조):');
        console.log(JSON.stringify(sample[0], null, 2));
        console.log('\n컬럼명 목록:', Object.keys(sample[0]));
    } else {
        console.log('⚠️ 리뷰 데이터가 없습니다.');
    }
}

checkReviewsTable();
