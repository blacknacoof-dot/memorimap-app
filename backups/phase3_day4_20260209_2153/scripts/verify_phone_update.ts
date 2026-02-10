import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function verify() {
    const { data: company, error } = await supabase
        .from('funeral_companies')
        .select('name, phone')
        .ilike('name', '%프리드%')
        .maybeSingle();

    if (error) {
        console.error('Error fetching company:', error);
    } else {
        console.log('Verification Result:', company);
    }
}

verify();
