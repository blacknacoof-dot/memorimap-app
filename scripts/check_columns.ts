
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function checkColumns() {
    const { data, error } = await supabase
        .from('facilities')
        .select('*')
        .limit(1);

    if (data && data.length > 0) {
        console.log('Columns found:', Object.keys(data[0]));
    } else if (error) {
        console.error('Error:', error);
    } else {
        console.log('Table empty or no access, trying RPC if possible or assume empty.');
    }
}

checkColumns();
