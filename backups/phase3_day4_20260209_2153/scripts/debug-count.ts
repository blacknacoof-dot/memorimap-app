
import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load Env
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
);

async function checkTotalCount() {
    const { count, error } = await supabase
        .from('memorial_spaces')
        .select('*', { count: 'exact', head: true }); // Head request for count

    if (error) {
        console.error("Error:", error);
    } else {
        console.log(`✅ Total Rows in DB: ${count}`);
    }
}

checkTotalCount();
