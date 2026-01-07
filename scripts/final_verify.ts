import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
    const ids = ['24', '886284015', '1014'];
    console.log('--- Final URL Verification ---');

    for (const id of ids) {
        const { data } = await supabase.from('memorial_spaces').select('name, image_url').eq('id', id).single();
        console.log(`${data?.name}: ${data?.image_url}`);
    }
}

verify();
