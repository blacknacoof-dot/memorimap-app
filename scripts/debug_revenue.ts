
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase URL or Service Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugRevenue() {
    console.log('--- Checking subscription_payments table ---');
    const { data: payments, error: pError } = await supabase
        .from('subscription_payments')
        .select('*');

    if (pError) {
        console.error('Error fetching payments:', pError);
    } else {
        console.log(`Total payments found: ${payments.length}`);
        const total = payments.reduce((acc, curr) => acc + (Number(curr.amount) || Number(curr.final_amount) || 0), 0);
        console.log(`Total revenue (sum of amount/final_amount): ${total}`);
        if (payments.length > 0) {
            console.log('Sample payment:', payments[0]);
        }
    }

    console.log('\n--- Checking facility_subscriptions table ---');
    const { data: subs, error: sError } = await supabase
        .from('facility_subscriptions')
        .select('*, plan:subscription_plans(name, price)');

    if (sError) {
        console.error('Error fetching subscriptions:', sError);
    } else {
        console.log(`Total subscriptions found: ${subs.length}`);
        if (subs.length > 0) {
            console.log('Sample subscription:', subs[0]);
        }
    }

    console.log('\n--- Checking All Profiles ---');
    const { data: allProfiles, error: prError } = await supabase
        .from('profiles')
        .select('*');

    if (prError) {
        console.error('Error fetching profiles:', prError);
    } else {
        console.log(`Total profiles found: ${allProfiles?.length}`);
        allProfiles?.forEach(p => console.log(`- ${p.email || p.full_name || p.id} (ID: ${p.id}, Role: ${p.role})`));
    }
}

debugRevenue();
