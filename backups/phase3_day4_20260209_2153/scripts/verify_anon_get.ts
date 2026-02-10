
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

async function checkAnonGet() {
    console.log('Simulating frontend GET request for reviews (using anon key)...');

    const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('facility_id', 'fc_new_7') // Testing with '부모사랑' ID
        .limit(10);

    if (error) {
        console.log('❌ GET failed with message:', error.message);
        console.log('Error details:', error);
    } else {
        console.log('✅ GET SUCCEEDED! Found', data.length, 'reviews.');
        console.log('Sample IDs:', data.map(r => r.facility_id));
    }
}

checkAnonGet();
