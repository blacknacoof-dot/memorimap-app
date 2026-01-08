import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
    try {
        const { data: ms } = await supabase.from('memorial_spaces').select('id, name, type').ilike('name', '%상조%');
        console.log('MS with "상조":', ms);

        const { data: facs } = await supabase.from('facilities').select('id, name, category').ilike('name', '%상조%');
        console.log('Facs with "상조":', facs);

        const { data: preed } = await supabase.from('memorial_spaces').select('id, name, type').ilike('name', '%프리드%');
        console.log('MS with "프리드":', preed);

        const { data: preedFac } = await supabase.from('facilities').select('id, name, category').ilike('name', '%프리드%');
        console.log('Facs with "프리드":', preedFac);

    } catch (e) {
        console.error(e);
    }
}
check();
