
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function checkPhones() {
    const { data, error } = await supabase
        .from('facilities')
        .select('name, phone')
        .not('phone', 'is', null)
        .limit(10);

    if (data) {
        console.log('DB Phones Sample:', data);
    } else {
        console.error(error);
    }
}

checkPhones();
