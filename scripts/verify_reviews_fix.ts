
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

async function checkColTypes() {
    console.log('Checking reviews table column types...');
    // We'll use the rest api to get schema info if possible, or try to insert a string and see if it fails
    // But better yet, if we have service role, we can use an RPC if available or just try to insert a test record.

    // Testing insert of a non-uuid string into user_id
    const testId = 'test_id_' + Date.now();
    const { error } = await supabase.from('reviews').insert({
        user_id: testId,
        facility_id: 'test_fac_' + Date.now(),
        content: 'Verification test',
        rating: 5,
        user_name: 'Verifer'
    });

    if (error) {
        console.log('Verification failed as expected if type is still UUID:', error.message);
        console.log('Error code:', error.code);
    } else {
        console.log('✅ Verification SUCCEEDED! user_id and facility_id accept strings.');

        // Clean up
        await supabase.from('reviews').delete().eq('user_id', testId);
        console.log('Test record cleaned up.');
    }
}

checkColTypes();
