
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xvmpvzldezpoxxsarizm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2bXB2emxkZXpwb3h4c2FyaXptIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTg1MTAxOSwiZXhwIjoyMDgxNDI3MDE5fQ.F98y7OtBTjRCNeDycy3YQrKJdjM6-Hs_-ZYZHluWHio'; // SERVICE ROLE KEY

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log('Checking reviews table columns...');
    const { data, error } = await supabase.from('reviews').select('*').limit(1);
    if (error) {
        console.error('Error selecting from reviews:', error);
    } else if (data && data.length > 0) {
        console.log('Columns found:', Object.keys(data[0]));
    } else {
        console.log('No data in reviews table. Trying to insert a dummy to check error...');
        // Try to insert with space_id to see if it complains about column not found
        const { error: insertError } = await supabase.from('reviews').insert([{ space_id: 0, content: 'test schema' }]);
        if (insertError) {
            console.log('Insert error:', insertError.message);
        }
    }
}

checkSchema();
