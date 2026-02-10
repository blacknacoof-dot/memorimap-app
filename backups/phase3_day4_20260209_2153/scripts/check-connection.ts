
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!);
async function run() {
    console.log('Checking connection...');
    const { data, error } = await supabase.from('memorial_spaces').select('count', { count: 'exact', head: true });
    if (error) console.error('Connection Error:', error);
    else console.log('Connection OK, row count:', data ? 'N/A' : 'Head request success');

    const { data: d2 } = await supabase.from('memorial_spaces').select('*').eq('id', 1014);
    console.log('ID 1014:', d2);
}
run();
