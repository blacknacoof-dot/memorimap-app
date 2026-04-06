/**
 * Cleanup the sangjo dashboard test account created by create_sangjo_test_user.cjs.
 *
 * Usage: node scripts/cleanup_sangjo_test_user.cjs
 * Required in .env.local:
 * - VITE_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

const TEST_EMAIL = 'sangjo-test@memorimap.com';

async function main() {
    console.log('=== Cleanup sangjo dashboard test account ===\n');

    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const testUser = existingUsers?.users?.find((user) => user.email === TEST_EMAIL);

    if (!testUser) {
        console.log('Test account does not exist. It may already be cleaned up.');
        return;
    }

    const userId = testUser.id;
    console.log(`Found test account: ${TEST_EMAIL} (${userId})`);

    const { error: dashErr } = await supabase
        .from('sangjo_dashboard_users')
        .delete()
        .eq('id', userId);

    if (dashErr) {
        console.log(`sangjo_dashboard_users cleanup skipped (${dashErr.message})`);
    } else {
        console.log('sangjo_dashboard_users cleanup complete');
    }

    const { error: hqErr } = await supabase
        .from('sangjo_hq_admins')
        .delete()
        .eq('user_id', userId);

    if (hqErr) {
        console.log(`sangjo_hq_admins cleanup skipped (${hqErr.message})`);
    } else {
        console.log('sangjo_hq_admins cleanup complete');
    }

    const { error: profileErr } = await supabase
        .from('profiles')
        .delete()
        .eq('clerk_id', userId);

    if (profileErr) {
        console.error('Failed to delete profile:', profileErr.message);
    } else {
        console.log('Profile cleanup complete');
    }

    const { error: authErr } = await supabase.auth.admin.deleteUser(userId);

    if (authErr) {
        console.error('Failed to delete auth user:', authErr.message);
    } else {
        console.log('Auth user cleanup complete');
    }

    console.log('\n========================================');
    console.log(`Removed account: ${TEST_EMAIL}`);
    console.log('========================================\n');
}

main().catch((err) => {
    console.error('Unexpected error:', err);
    process.exit(1);
});
