
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
    console.log('--- Checking memorial_spaces schema ---');
    // We can't easily get the schema metadata via standard Supabase client, 
    // but we can try to select one row and see the keys.
    const { data, error } = await supabase.from('memorial_spaces').select('*').limit(1).single();

    if (error) {
        console.error('Error fetching data:', error);
        return;
    }

    console.log('Columns in memorial_spaces:', Object.keys(data));
}

run();
