import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log('🔍 Checking sangjo_favorites schema...');

    // Try to insert a dummy record with text user_id to see if it fails
    // This is a direct test of the error condition
    const testId = 'user_test_' + Date.now();

    // Check column types using RPC if available, or just try an operation
    // Since we don't have direct SQL access easily via JS client without RPC, 
    // we will infer from error message or successfully querying pg_stat (if allowed)

    // Attempt to invoke a query that casts user_id to text explicitly
    // If user_id is UUID, filtering by a text that is not a UUID will fail with 22P02

    try {
        const { data, error } = await supabase
            .from('sangjo_favorites')
            .select('user_id')
            .limit(1);

        if (error) {
            console.error('❌ Error selecting from table:', error);
        } else {
            console.log('✅ Table exists. Sample data:', data);
        }

        // Test insertion with TEXT user_id
        console.log('\n🧪 Testing insertion with TEXT user_id...');
        const { error: insertError } = await supabase
            .from('sangjo_favorites')
            .insert({
                user_id: 'test_user_text_id',
                company_id: 'test_company',
                company_name: 'Test Co'
            });

        if (insertError) {
            console.error('❌ Insertion failed:', insertError);
            if (insertError.code === '22P02') {
                console.log('🚨 DIAGNOSIS: user_id column likely assumes UUID type but received TEXT.');
            }
        } else {
            console.log('✅ Insertion successful! user_id allows TEXT.');
            // Cleanup
            await supabase.from('sangjo_favorites').delete().eq('user_id', 'test_user_text_id');
        }

    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

checkSchema();
