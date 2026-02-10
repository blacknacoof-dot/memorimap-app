
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseServiceKey || supabaseKey!);

async function verifySuperAdminData() {
    console.log('--- Verifying Super Admin Dashboard Data (Backend) ---\n');

    // 1. Leads (Counseling Requests)
    console.log('1. Checking Leads (AdminLeadsView)...');
    const { data: leads, error: lError } = await supabase
        .from('leads')
        .select('id, contact_name, status')
        .limit(5);

    if (lError) {
        console.error('❌ Error fetching leads:', lError);
    } else {
        console.log(`✅ Leads found: ${leads?.length || 0}`);
        if (leads && leads.length > 0) console.log('   Sample Lead:', leads[0]);
    }

    // 2. Partner Inquiries (PartnerManagement)
    console.log('\n2. Checking Partner Inquiries (PartnerManagement)...');
    const { data: inquiries, error: pError } = await supabase
        .from('partner_inquiries')
        .select('id, company_name, status')
        .limit(5);

    if (pError) {
        console.error('❌ Error fetching partner inquiries:', pError);
    } else {
        console.log(`✅ Partner Inquiries found: ${inquiries?.length || 0}`);
        if (inquiries && inquiries.length > 0) console.log('   Sample Inquiry:', inquiries[0]);
    }

    // 3. Subscription Payments (RevenueManagement)
    console.log('\n3. Checking Subscription Payments (RevenueManagement Check)...');
    const { data: payments, error: rError } = await supabase
        .from('subscription_payments')
        .select('id, amount, status')
        .limit(5);

    if (rError) {
        console.error('❌ Error fetching payments:', rError);
    } else {
        console.log(`✅ Payments found: ${payments?.length || 0}`);
    }

    // 4. Super Admin User Check
    console.log('\n4. Checking Super Admin Existence...');
    // Trying to find a user with 'super_admin' role in profiles or super_admins table
    const { data: superAdmins, error: saError } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('role', 'super_admin')
        .limit(1);

    if (saError) {
        console.warn('⚠️ Could not query profiles for super_admin role:', saError.message);
    } else {
        if (superAdmins && superAdmins.length > 0) {
            console.log(`✅ Found Super Admin profile: ${superAdmins[0].id}`);
        } else {
            console.log('ℹ️ No user with role="super_admin" in profiles table.');

            // Check separate table if exists
            const { data: saTable } = await supabase.from('super_admins').select('id').limit(1);
            if (saTable && saTable.length > 0) {
                console.log(`✅ Found record in 'super_admins' table: ${saTable[0].id}`);
            } else {
                console.warn('⚠️ No Super Admin found in DB. You might not be able to log in as Super Admin.');
            }
        }
    }

    console.log('\n--- Super Admin Verification Complete ---');
}

verifySuperAdminData();
