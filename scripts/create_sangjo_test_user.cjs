/**
 * Create a sangjo dashboard test account.
 *
 * Usage: node scripts/create_sangjo_test_user.cjs
 * Required in .env.local:
 * - VITE_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 * - SANGJO_TEST_PASSWORD
 */
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TEST_PASSWORD = process.env.SANGJO_TEST_PASSWORD;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local.');
    process.exit(1);
}

if (!TEST_PASSWORD) {
    throw new Error('Missing SANGJO_TEST_PASSWORD');
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

const TEST_EMAIL = 'sangjo-test@memorimap.com';
const TEST_NAME = 'Sangjo Test Manager';

async function main() {
    console.log('=== Create sangjo dashboard test account ===\n');

    const { data: sangjoFacility } = await supabase
        .from('facilities')
        .select('id, name, type')
        .eq('type', 'sangjo')
        .limit(1)
        .maybeSingle();

    let sangjoId;
    if (sangjoFacility) {
        sangjoId = sangjoFacility.id;
        console.log(`Found sangjo facility: ${sangjoFacility.name} (${sangjoId})`);
    } else {
        const { data: byName } = await supabase
            .from('facilities')
            .select('id, name, type')
            .ilike('name', '%프리드라이프%')
            .limit(1)
            .maybeSingle();

        if (byName) {
            sangjoId = byName.id;
            console.log(`Found facility by name: ${byName.name} (${sangjoId})`);
        } else {
            const { data: anyFac } = await supabase
                .from('facilities')
                .select('id, name')
                .limit(1)
                .single();
            sangjoId = anyFac?.id || 'test-sangjo-id';
            console.log(`No sangjo facility found, using fallback: ${anyFac?.name || sangjoId}`);
        }
    }

    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existing = existingUsers?.users?.find((user) => user.email === TEST_EMAIL);

    let userId;
    if (existing) {
        userId = existing.id;
        console.log(`Existing user found: ${TEST_EMAIL} (${userId})`);
    } else {
        const { data: newUser, error: authError } = await supabase.auth.admin.createUser({
            email: TEST_EMAIL,
            password: TEST_PASSWORD,
            email_confirm: true,
            user_metadata: { name: TEST_NAME }
        });

        if (authError) {
            console.error('Failed to create auth user:', authError.message);
            process.exit(1);
        }
        userId = newUser.user.id;
        console.log(`Created auth user: ${TEST_EMAIL} (${userId})`);
    }

    const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
            clerk_id: userId,
            name: TEST_NAME,
            email: TEST_EMAIL,
            role: 'sangjo_hq_admin',
        }, { onConflict: 'clerk_id' });

    if (profileError) {
        console.error('Failed to upsert profile:', profileError.message);
    } else {
        console.log('Profile updated with sangjo_hq_admin role');
    }

    const { error: dashError } = await supabase
        .from('sangjo_dashboard_users')
        .upsert({
            id: userId,
            sangjo_id: sangjoId,
            role: 'admin',
            name: TEST_NAME
        }, { onConflict: 'id' });

    if (dashError) {
        console.error('sangjo_dashboard_users upsert failed, trying sangjo_hq_admins:', dashError.message);

        const { error: hqError } = await supabase
            .from('sangjo_hq_admins')
            .upsert({
                user_id: userId,
                sangjo_id: sangjoId,
                role: 'admin',
                company_name: TEST_NAME
            }, { onConflict: 'user_id' });

        if (hqError) {
            console.error('Failed to upsert sangjo_hq_admins:', hqError.message);
        } else {
            console.log(`sangjo_hq_admins linked: sangjo_id=${sangjoId}`);
        }
    } else {
        console.log(`sangjo_dashboard_users linked: sangjo_id=${sangjoId}`);
    }

    console.log('\n========================================');
    console.log('Test account created');
    console.log('========================================');
    console.log(`Email:    ${TEST_EMAIL}`);
    console.log(`Password: ${TEST_PASSWORD}`);
    console.log('Role:     sangjo_hq_admin');
    console.log(`Sangjo:   ${sangjoId}`);
    console.log(`Auth UID: ${userId}`);
    console.log('========================================\n');
}

main().catch((err) => {
    console.error('Unexpected error:', err);
    process.exit(1);
});
