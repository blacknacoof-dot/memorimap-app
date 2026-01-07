import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function countTypes() {
    const { data, error } = await supabase
        .from('memorial_spaces')
        .select('type', { count: 'exact' });

    if (error) {
        console.error(error);
        return;
    }

    const counts: any = {};
    data.forEach(f => {
        counts[f.type] = (counts[f.type] || 0) + 1;
    });

    console.log('--- Type Counts ---');
    console.table(counts);
}

countTypes();
