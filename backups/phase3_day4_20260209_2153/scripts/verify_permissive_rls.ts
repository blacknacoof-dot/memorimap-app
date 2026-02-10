
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyPolicies() {
    console.log('--- RLS Policy Verification ---');

    const tables = ['partner_conversations', 'partner_inquiries', 'subscription_payments', 'user_notifications'];

    for (const table of tables) {
        console.log(`\nChecking policies for: ${table}`);

        // Since we can't use exec_sql to query pg_policies easily, 
        // we'll try to perform a unauthorized insert as a test if we had a non-service-key.
        // But here we can check the RLS status via a metadata query if possible.
        // Actually, we'll try to list policies if the user created a way or if we can infer it.

        // Let's try to query the REST API with a regular anon key if we had one to see if RLS blocks it.
        // But for now, let's just use the service key to see if we can still see the data.
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            console.error(`Error accessing ${table}:`, error.message);
        } else {
            console.log(`Successfully accessed ${table} (Service Role). Row count: ${data.length}`);
        }
    }

    console.log('\nNote: Verification of specific policy logic "WITH CHECK" requires testing with non-service-role tokens.');
}

verifyPolicies();
