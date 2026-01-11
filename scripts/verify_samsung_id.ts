import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!);

async function check() {
    const { data } = await supabase.from('memorial_spaces').select('*').eq('id', 2311).single();
    console.log('ID 2311 Details:');
    console.log('Name:', data.name);
    console.log('Type:', data.type); // Should be 'sangjo'
    console.log('Address:', data.address);
}

check();
