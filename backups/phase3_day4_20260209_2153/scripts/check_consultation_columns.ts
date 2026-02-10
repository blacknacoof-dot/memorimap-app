
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase URL or Service Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkColumns() {
    console.log('Checking consultations table columns...');

    // Try to insert a dummy record to see if we can trigger an error or just fetch keys if any exist
    // Actually, let's just inspect the definition if possible? No.
    // Let's try to select 1 row.
    const { data, error } = await supabase
        .from('consultations')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching consultations:', error);
        // If table doesn't exist, it will say so
        return;
    }

    if (data && data.length > 0) {
        console.log('Existing columns found in the first row:', Object.keys(data[0]));
    } else {
        console.log('No rows found. Attempting to insert a dummy row to discover columns (basic ones).');
        // We can't easily discover columns without existing data or information schema access
        // But we can try to guess 'answer' column

        // Attempt insert with basic required fields
        const dummy = {
            facility_id: 'test_check_columns',
            user_id: '00000000-0000-0000-0000-000000000000', // valid UUID format required usually?
            // We'll use service role so we can bypass RLS?
        };
        // Actually insert might fail due to FK constraints if user_id/facility_id invalid.
        console.log('Cannot probe columns on empty table effectively without potentially violating constraints.');
    }
}

checkColumns();
