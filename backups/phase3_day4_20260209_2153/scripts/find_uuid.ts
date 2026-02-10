
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
    const uuid = 'fe21de9f-49d9-4eb3-b1af-5b885a8111dd';
    console.log(`Searching for UUID: ${uuid}`);

    const tables = ['memorial_spaces', 'facilities', 'partners', 'users', 'funeral_companies']; // potential tables

    for (const t of tables) {
        try {
            // Try selecting assuming 'id' column exists. If UUID type mismatch, it might error or return nothing.
            const { data, error } = await supabase.from(t).select('*').eq('id', uuid).maybeSingle();
            if (data) {
                console.log(`FOUND in table [${t}]!`);
                console.log(data);
                return;
            } else if (error) {
                // Ignore type errors (e.g. searching UUID in int column)
                // console.log(`Table [${t}] error:`, error.message);
            }
        } catch (e) {
            // ignore
        }
    }
    console.log('Not found in common tables.');
}
run();
