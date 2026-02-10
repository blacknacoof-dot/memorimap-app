
import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as dotenv from 'dotenv';

const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
);

async function debugFacility() {
    const { data, error } = await supabase
        .from('memorial_spaces')
        .select('*')
        .ilike('name', '%녹색%');

    if (error) console.error(error);
    else console.log(JSON.stringify(data, null, 2));
}

debugFacility();
