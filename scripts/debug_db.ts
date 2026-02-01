import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDb() {
    console.log('🔍 Checking Database State...');

    // Check partners
    const { data: partners, error } = await supabase
        .from('partners')
        .select('id, name')
        .eq('id', 'fc_new_1');

    if (error) {
        console.error('❌ Error fetching partners:', error);
    } else {
        console.log('✅ Partners found with ID fc_new_1:', partners);
    }

    // Check schema (approximate via raw query if possible, but let's just use a sample insert)
    try {
        const testId = 'test_string_id_' + Date.now();
        const { error: insertError } = await supabase
            .from('partners')
            .insert([{ id: testId, name: 'Test' }]);

        if (insertError) {
            console.log('❌ String ID insert failed. id column might still be UUID.');
            console.error(insertError);
        } else {
            console.log('✅ String ID insert succeeded! id column is TEXT.');
            await supabase.from('partners').delete().eq('id', testId);
        }
    } catch (e) {
        console.error('Unexpected error:', e);
    }
}

checkDb();
