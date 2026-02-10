import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyTable() {
    const { data, error } = await supabase
        .from('user_notifications')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Verification failed:', error.message);
        process.exit(1);
    }

    console.log('✅ user_notifications table verified!');
}

verifyTable();
