
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log('Fetching table info facilities table...');

    // We can't easily select from information_schema via JS client usually, 
    // but we can try to select one row and check the type of ID,
    // or use an RPC if we had one.
    // Actually, easiest is to select one row.

    const { data, error } = await supabase
        .from('facilities')
        .select('id')
        .limit(1);

    if (error) {
        console.error('Error:', error);
        return;
    }

    if (data && data.length > 0) {
        const id = data[0].id;
        console.log('Sample ID:', id);
        console.log('Type of ID in JS:', typeof id);

        // Check if it looks like a UUID
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        console.log('Is valid UUID format?', isUUID);
    } else {
        console.log('No data found in facilities table.');
    }
}

checkSchema();
