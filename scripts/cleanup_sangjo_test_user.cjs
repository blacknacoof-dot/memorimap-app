/**
 * 상조 테스트 계정 정리 (create_sangjo_test_user.cjs의 역작업)
 *
 * 사용법: node scripts/cleanup_sangjo_test_user.cjs
 * 필요: VITE_SUPABASE_URL, VITE_SUPABASE_SERVICE_ROLE_KEY (.env.local)
 */
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('VITE_SUPABASE_URL 또는 VITE_SUPABASE_SERVICE_ROLE_KEY가 .env.local에 없습니다.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

const TEST_EMAIL = 'sangjo-test@memorimap.com';

async function main() {
    console.log('=== 상조 테스트 계정 정리 ===\n');

    // 1. Auth 사용자 찾기
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const testUser = existingUsers?.users?.find(u => u.email === TEST_EMAIL);

    if (!testUser) {
        console.log('테스트 계정이 존재하지 않습니다. 이미 정리되었거나 생성되지 않았습니다.');
        return;
    }

    const userId = testUser.id;
    console.log(`테스트 계정 발견: ${TEST_EMAIL} (${userId})`);

    // 2. sangjo_dashboard_users 삭제
    const { error: dashErr } = await supabase
        .from('sangjo_dashboard_users')
        .delete()
        .eq('id', userId);

    if (dashErr) {
        console.log(`sangjo_dashboard_users 삭제 스킵 (${dashErr.message})`);
    } else {
        console.log('sangjo_dashboard_users 삭제 완료');
    }

    // 3. sangjo_hq_admins 삭제
    const { error: hqErr } = await supabase
        .from('sangjo_hq_admins')
        .delete()
        .eq('user_id', userId);

    if (hqErr) {
        console.log(`sangjo_hq_admins 삭제 스킵 (${hqErr.message})`);
    } else {
        console.log('sangjo_hq_admins 삭제 완료');
    }

    // 4. profiles 삭제
    const { error: profileErr } = await supabase
        .from('profiles')
        .delete()
        .eq('clerk_id', userId);

    if (profileErr) {
        console.error('profiles 삭제 실패:', profileErr.message);
    } else {
        console.log('profiles 삭제 완료');
    }

    // 5. Auth 사용자 삭제
    const { error: authErr } = await supabase.auth.admin.deleteUser(userId);

    if (authErr) {
        console.error('Auth 사용자 삭제 실패:', authErr.message);
    } else {
        console.log('Auth 사용자 삭제 완료');
    }

    console.log('\n========================================');
    console.log('테스트 모드 정리 완료');
    console.log('삭제된 계정: ' + TEST_EMAIL);
    console.log('========================================\n');
}

main().catch(err => {
    console.error('예상치 못한 오류:', err);
    process.exit(1);
});
