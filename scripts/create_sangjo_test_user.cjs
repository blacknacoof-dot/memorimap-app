/**
 * 상조 대시보드 테스트 계정 생성 스크립트
 *
 * 사용법: node scripts/create_sangjo_test_user.cjs
 * 필요: VITE_SUPABASE_URL, VITE_SUPABASE_SERVICE_ROLE_KEY (.env.local)
 */
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ VITE_SUPABASE_URL 또는 VITE_SUPABASE_SERVICE_ROLE_KEY가 .env.local에 없습니다.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

const TEST_EMAIL = 'sangjo-test@memorimap.com';
const TEST_PASSWORD = 'SangjoTest2026!';
const TEST_NAME = '상조테스트관리자';

async function main() {
    console.log('=== 상조 대시보드 테스트 계정 생성 ===\n');

    // 1. 상조 시설 ID 조회 (DB에서 type='sangjo' 첫 번째)
    const { data: sangjoFacility, error: facError } = await supabase
        .from('facilities')
        .select('id, name, type')
        .eq('type', 'sangjo')
        .limit(1)
        .maybeSingle();

    let sangjoId;
    if (sangjoFacility) {
        sangjoId = sangjoFacility.id;
        console.log(`✅ 상조 시설 발견: ${sangjoFacility.name} (${sangjoId})`);
    } else {
        // sangjo 타입이 없으면 이름으로 검색
        const { data: byName } = await supabase
            .from('facilities')
            .select('id, name, type')
            .ilike('name', '%프리드라이프%')
            .limit(1)
            .maybeSingle();

        if (byName) {
            sangjoId = byName.id;
            console.log(`✅ 상조 시설 (이름 검색): ${byName.name} (${sangjoId})`);
        } else {
            // 아무 시설이라도 사용
            const { data: anyFac } = await supabase
                .from('facilities')
                .select('id, name')
                .limit(1)
                .single();
            sangjoId = anyFac?.id || 'test-sangjo-id';
            console.log(`⚠️  상조 시설 없음, 대체 시설 사용: ${anyFac?.name || sangjoId}`);
        }
    }

    // 2. 기존 사용자 확인
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existing = existingUsers?.users?.find(u => u.email === TEST_EMAIL);

    let userId;
    if (existing) {
        userId = existing.id;
        console.log(`⚠️  기존 사용자 존재: ${TEST_EMAIL} (${userId})`);
    } else {
        // 3. Auth 사용자 생성
        const { data: newUser, error: authError } = await supabase.auth.admin.createUser({
            email: TEST_EMAIL,
            password: TEST_PASSWORD,
            email_confirm: true, // 이메일 인증 건너뛰기
            user_metadata: { name: TEST_NAME }
        });

        if (authError) {
            console.error('❌ Auth 사용자 생성 실패:', authError.message);
            process.exit(1);
        }
        userId = newUser.user.id;
        console.log(`✅ Auth 사용자 생성: ${TEST_EMAIL} (${userId})`);
    }

    // 4. profiles 테이블 upsert
    const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
            clerk_id: userId,
            name: TEST_NAME,
            email: TEST_EMAIL,
            role: 'sangjo_hq_admin',
        }, { onConflict: 'clerk_id' });

    if (profileError) {
        console.error('❌ profiles upsert 실패:', profileError.message);
    } else {
        console.log(`✅ profiles 설정: role=sangjo_hq_admin`);
    }

    // 5. sangjo_dashboard_users upsert
    const { error: dashError } = await supabase
        .from('sangjo_dashboard_users')
        .upsert({
            id: userId,
            sangjo_id: sangjoId,
            role: 'admin',
            name: TEST_NAME
        }, { onConflict: 'id' });

    if (dashError) {
        console.error('⚠️  sangjo_dashboard_users upsert 실패 (테이블 없을 수 있음):', dashError.message);

        // fallback: sangjo_hq_admins 시도
        const { error: hqError } = await supabase
            .from('sangjo_hq_admins')
            .upsert({
                user_id: userId,
                sangjo_id: sangjoId,
                role: 'admin',
                company_name: TEST_NAME
            }, { onConflict: 'user_id' });

        if (hqError) {
            console.error('❌ sangjo_hq_admins upsert도 실패:', hqError.message);
        } else {
            console.log(`✅ sangjo_hq_admins 설정: sangjo_id=${sangjoId}`);
        }
    } else {
        console.log(`✅ sangjo_dashboard_users 설정: sangjo_id=${sangjoId}`);
    }

    // 결과 출력
    console.log('\n========================================');
    console.log('📋 테스트 계정 정보');
    console.log('========================================');
    console.log(`이메일:   ${TEST_EMAIL}`);
    console.log(`비밀번호: ${TEST_PASSWORD}`);
    console.log(`역할:     sangjo_hq_admin (상조 본사 관리자)`);
    console.log(`상조 ID:  ${sangjoId}`);
    console.log(`Auth UID: ${userId}`);
    console.log('========================================');
    console.log('➡️  앱에서 위 이메일/비밀번호로 로그인하면 상조 대시보드로 이동합니다.\n');
}

main().catch(err => {
    console.error('❌ 예상치 못한 오류:', err);
    process.exit(1);
});
