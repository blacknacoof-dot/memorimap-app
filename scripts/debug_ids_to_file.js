import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const out = 'debug_ids_result.json';

async function check() {
    try {
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data: companies } = await supabase.from('funeral_companies').select('id, name').limit(10);
        const { data: reviews } = await supabase.from('reviews').select('id, facility_id').limit(10);

        const result = {
            companies: companies?.map(c => ({ id: c.id, type: typeof c.id, name: c.name })),
            reviews: reviews?.map(r => ({ id: r.id, facility_id: r.facility_id, type: typeof r.facility_id }))
        };

        fs.writeFileSync(out, JSON.stringify(result, null, 2));
        console.log('DONE');
    } catch (err) {
        fs.writeFileSync(out, JSON.stringify({ error: err.message }, null, 2));
    }
}

check();
