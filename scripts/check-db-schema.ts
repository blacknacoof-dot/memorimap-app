import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log('Checking memorial_spaces schema...');
    const { data: cols, error } = await supabase.rpc('get_table_schema', { table_name: 'memorial_spaces' });

    if (error) {
        console.log('Error or RPC missing. Trying to select a row to check types...');
        const { data, error: selectError } = await supabase.from('memorial_spaces').select('*').limit(1);
        if (selectError) {
            console.error('Select error:', selectError.message);
        } else {
            console.log('Sample row:', data[0]);
            if (data[0]) {
                console.log('ID type in JS:', typeof data[0].id);
            }
        }
    } else {
        console.log('Columns:', cols);
    }

    console.log('\nChecking facility_faqs schema...');
    const { data: faqData, error: faqError } = await supabase.from('facility_faqs').select('*').limit(1);
    if (faqError) {
        console.error('FAQ Select error:', faqError.message);
    } else {
        console.log('FAQ Sample row:', faqData[0]);
    }
}

checkSchema();
