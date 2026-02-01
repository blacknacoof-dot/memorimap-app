
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

async function checkExactTypes() {
    console.log('Fetching exact column types from information_schema...');

    // We'll use a trick: query the rest api for a non-existent rpc or just exploit the fact that we can't do raw sql easily
    // Actually, I'll try to use a SELECT on a view if it exists, or just try to trigger a specific type error to see the type.

    // Better: let's try to query information_schema using the service_role's power if possible.
    // However, PostgREST doesn't expose information_schema by default.

    // Let's try to use the 'get_column_info' RPC if it exists (from previous diagnostic scripts I saw)
    const { data, error } = await supabase.rpc('get_column_info', { p_table: 'reviews' });

    if (error) {
        console.log('get_column_info RPC failed:', error.message);

        // Alternative: Try to fetch one row and see if we can infer anything, 
        // but we already did that.

        // Let's try to insert something and if it fails, parse the error message.
        console.log('Trying to insert deliberate type mismatch...');
        const { error: insertError } = await supabase.from('reviews').insert({
            user_id: 'not-a-uuid',
            facility_id: 'not-a-uuid',
            content: 'test',
            rating: 5
        });

        if (insertError) {
            console.log('Insert failed with message:', insertError.message);
            console.log('Error details:', insertError);
        } else {
            console.log('✅ Insert SUCCEEDED! The columns ARE text or similar.');
        }
    } else {
        console.log('Column Info:', data);
    }
}

checkExactTypes();
