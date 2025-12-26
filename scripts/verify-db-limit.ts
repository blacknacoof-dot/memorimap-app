
import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as dotenv from 'dotenv';

const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
);

async function checkCounts() {
    // Total count
    const { count: total, error: totalError } = await supabase
        .from('memorial_spaces')
        .select('*', { count: 'exact', head: true });

    // Funeral count
    const { count: funeral, error: funeralError } = await supabase
        .from('memorial_spaces')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'funeral');

    // Counts by type
    const { data: types, error: typeError } = await supabase
        .from('memorial_spaces')
        .select('type');

    if (totalError || funeralError) {
        console.error("Error:", totalError || funeralError);
        return;
    }

    console.log(`Total facilities in DB: ${total}`);
    console.log(`Funeral facilities in DB: ${funeral}`);

    if (types) {
        const counts = types.reduce((acc: any, curr: any) => {
            acc[curr.type] = (acc[curr.type] || 0) + 1;
            return acc;
        }, {});
        console.log("Counts by type:", counts);
    }
}

checkCounts();
