import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!);

async function search() {
    console.log('🔍 Searching DB...');

    const keywords = ['삼성', 'Samsung', '개발'];

    for (const k of keywords) {
        const { data } = await supabase.from('memorial_spaces').select('id, name').ilike('name', `%${k}%`);
        if (data && data.length > 0) {
            console.log(`\nMatch for '${k}':`);
            data.forEach(d => console.log(`- ${d.name} (ID: ${d.id})`));
        } else {
            console.log(`No match for '${k}'`);
        }
    }
}

search();
