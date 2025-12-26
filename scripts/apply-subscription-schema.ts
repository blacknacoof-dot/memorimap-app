import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Supabase 클라이언트 생성
const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // 서비스 역할 키 필요

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ 환경 변수가 설정되지 않았습니다.');
    console.error('VITE_SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY를 확인하세요.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applySchema() {
    console.log('🚀 Supabase 스키마 적용 시작...\n');

    try {
        // SQL 파일 읽기
        const schemaPath = path.join(__dirname, 'subscription_schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

        console.log('📄 스키마 파일 읽기 완료');
        console.log(`📍 파일 경로: ${schemaPath}\n`);

        // SQL 실행
        console.log('⚙️  스키마 적용 중...');
        const { data, error } = await supabase.rpc('exec_sql', {
            sql_query: schemaSql
        });

        if (error) {
            console.error('❌ 스키마 적용 실패:', error);

            // 대안: SQL을 여러 부분으로 나눠서 실행
            console.log('\n💡 대안: Supabase 대시보드에서 직접 실행하세요.');
            console.log('1. https://supabase.com 접속');
            console.log('2. SQL Editor 열기');
            console.log('3. subscription_schema.sql 내용 복사 & 붙여넣기');
            console.log('4. Run 버튼 클릭\n');

            return;
        }

        console.log('✅ 스키마 적용 완료!\n');

        // 적용된 테이블 확인
        console.log('📊 생성된 테이블 확인 중...');
        const tables = [
            'subscription_plans',
            'facility_subscriptions',
            'facility_faqs',
            'sms_logs',
            'sms_templates',
            'subscription_payments'
        ];

        for (const table of tables) {
            const { count, error } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true });

            if (error) {
                console.log(`❌ ${table}: 생성 실패`);
            } else {
                console.log(`✅ ${table}: 생성 완료 (${count || 0}개 레코드)`);
            }
        }

        console.log('\n🎉 모든 작업이 완료되었습니다!');

    } catch (err) {
        console.error('❌ 오류 발생:', err);
        console.log('\n💡 Supabase 대시보드에서 수동으로 실행해주세요.');
    }
}

// 실행
applySchema();
