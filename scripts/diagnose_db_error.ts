
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function diagnose() {
    console.log('--- Diagnosing Favorites Table ---');

    // 1. Check if we can select from favorites
    try {
        const { data, error, status, statusText } = await supabase
            .from('favorites')
            .select('count', { count: 'exact', head: true });

        console.log('Query: SELECT count FROM favorites');
        if (error) {
            console.error('Error:', error);
            console.error('Status:', status, statusText);
            console.log('\n❌ DIAGNOSIS: The "favorites" table likely does not exist or permission is denied.');
        } else {
            console.log('Success! Table exists.');
            console.log('Count:', data); // data is null for head:true usually, count is in count
        }
    } catch (err) {
        console.error('Exception during query:', err);
    }

    // 2. Check schema using RPC if available (optional, but head request is usually enough)
}

diagnose();
