
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

async function debugProfiles() {
    console.log('--- Profiles Debugging ---');

    // 1. Check columns and types
    const { data: cols, error: colError } = await supabase.rpc('inspect_table_cols', { table_name: 'profiles' });
    // Since we don't have inspect_table_cols RPC, we'll try to get it from pg_catalog if possible, 
    // but usually we can't. Let's try to fetch one row with service role.

    const { data: row, error: fetchError } = await supabase.from('profiles').select('*').limit(1);
    if (fetchError) {
        console.error('Error fetching profiles row:', fetchError.message);
    } else {
        console.log('Columns in profiles:', Object.keys(row[0] || {}));
        console.log('Sample row values (subset):', row[0] ? { id: row[0].id, clerk_id: row[0].clerk_id } : 'No data');
    }

    // 2. Try to list policies via a clever trick if possible or just try to trigger it.
    // Actually, the best way is to ask the user to show the policies or use an RPC if available.
    // Since I can't see the policies directly without an RPC, I will propose a "Safe Reset" of policies.

    console.log('\n--- Recommendation ---');
    console.log('1. Reload PostgREST schema cache (NOTIFY_SCHEMA_CHANGE).');
    console.log('2. Verify if auth.uid() in the JWT matches clerk_id string.');
}

debugProfiles();
