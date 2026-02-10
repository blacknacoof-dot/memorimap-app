
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkFacility() {
    console.log('Searching for "일산장례서비스"...');

    const { data, error } = await supabase
        .from('facilities')
        .select('id, name, type, address')
        .ilike('name', '%일산백장례서비스%');

    if (error) {
        console.error('Error fetching facility:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log('Found facilities:', data);
    } else {
        console.log('No facility found with that name.');
    }
}

checkFacility();
