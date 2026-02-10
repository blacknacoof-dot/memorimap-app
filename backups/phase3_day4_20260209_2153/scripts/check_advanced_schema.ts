
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTriggersAndConstraints() {
    console.log('Checking for triggers and constraints on "reviews" table...');

    // Check constraints
    const { data: constraints, error: conError } = await supabase.rpc('get_constraints', { p_table: 'reviews' });
    if (conError) {
        console.log('get_constraints RPC failed, trying generic query if it failed...');
    } else {
        console.log('Constraints:', constraints);
    }

    // Check triggers
    const { data: triggers, error: trigError } = await supabase.rpc('get_triggers', { p_table: 'reviews' });
    if (trigError) {
        console.log('get_triggers RPC failed.');
    } else {
        console.log('Triggers:', triggers);
    }

    // If those RPCs don't exist, we can try to guess by looking at the schema cache if we can find it, 
    // or just assume there might be a trigger.

    // One thing to check: Does 'auth.uid()' match 'user_id' in a string sense?
    const { data: userInfo, error: userError } = await supabase.auth.getUser();
    console.log('Current User ID (from Node):', userInfo?.user?.id);
}

checkTriggersAndConstraints();
