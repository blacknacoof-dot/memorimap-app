
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

async function checkFacilitiesTable() {
    console.log('Checking facilities table...');
    const { data, error } = await supabase.from('facilities').select('*').limit(5);
    if (error) {
        console.error('Error querying facilities:', error);
    } else {
        console.log(`Successfully queried 'facilities'. Found ${data.length} rows.`);
        if (data.length > 0) {
            console.log('Sample row:', data[0]);
        }
    }
}
checkFacilitiesTable();
