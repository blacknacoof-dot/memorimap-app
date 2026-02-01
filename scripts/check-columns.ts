import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnose() {
    console.log('--- Table: reviews Columns ---');
    const { data, error } = await supabase.rpc('get_table_columns', { table_name: 'reviews' });

    if (error) {
        // Fallback: try querying information_schema if RPC doesn't exist
        const { data: schemaData, error: schemaError } = await supabase
            .from('information_schema.columns' as any)
            .select('column_name, data_type')
            .eq('table_name', 'reviews');

        if (schemaError) {
            console.log('Error checking schema:', schemaError);
        } else {
            console.table(schemaData);
        }
    } else {
        console.table(data);
    }
}

diagnose();
