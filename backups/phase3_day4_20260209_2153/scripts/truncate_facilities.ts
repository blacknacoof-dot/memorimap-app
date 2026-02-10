
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY; // Must use Service Role for truncation

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase env vars (Need SERVICE ROLE KEY)');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function truncateFacilities() {
    console.log('🗑️  Truncating facilities table...');
    const { error } = await supabase
        .from('facilities')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all basically

    if (error) {
        console.error('Error truncating:', error);
    } else {
        console.log('✅ Facilities table cleared.');
    }
}

truncateFacilities();
