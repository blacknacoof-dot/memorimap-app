
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkAnonPost() {
    console.log('Simulating frontend POST request for reviews (using anon key)...');

    // Note: Anon users might not have permission to insert, 
    // but the type error (22P02) happens BEFORE permission check 
    // if PostgREST tries to cast the input.

    const { error } = await supabase
        .from('reviews')
        .insert([{
            facility_id: 'fc_new_7',
            user_id: 'user_36vml1WCaPN5YGZFA84gzmgDHAW',
            content: 'Verification test',
            rating: 5,
            user_name: 'Verifier'
        }]);

    if (error) {
        console.log('Post failed with message:', error.message);
        console.log('Error code:', error.code);
        if (error.code === '22P02') {
            console.log('❌ CONFIRMED: 22P02 type error detected!');
        } else if (error.code === '42501') {
            console.log('✅ Columns accept strings, but failed due to permission (correct behavior).');
        } else {
            console.log('Unexpected error code:', error.code);
        }
    } else {
        console.log('✅ Post SUCCEEDED! (Anomaly: should have failed due to permissions unless RLS is off)');
    }
}

checkAnonPost();
