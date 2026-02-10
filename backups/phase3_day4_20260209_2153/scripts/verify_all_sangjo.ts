
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
    console.log('--- Setting all sangjo to is_verified=true ---');
    const { data, error } = await supabase
        .from('memorial_spaces')
        .update({ is_verified: true })
        .eq('type', 'sangjo');

    if (error) {
        console.error('Error updating:', error);
    } else {
        console.log('Update successful.');
    }

    // Double check "프리드라이프"
    const { data: preed } = await supabase
        .from('memorial_spaces')
        .select('*')
        .eq('name', '프리드라이프')
        .maybeSingle();

    console.log('Preed Life Status:', preed ? { id: preed.id, is_verified: preed.is_verified, type: preed.type } : 'Not found');
}

run();
