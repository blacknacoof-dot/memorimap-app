import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const out = 'debug_fc6_anon_result.json';

async function check() {
    try {
        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        const { data, error } = await supabase.from('reviews').select('*').eq('facility_id', 'fc6');

        const result = {
            success: !!data,
            count: data?.length || 0,
            error: error ? { code: error.code, message: error.message } : null,
            sample: data?.[0]
        };

        fs.writeFileSync(out, JSON.stringify(result, null, 2));
        console.log('DONE');
    } catch (err) {
        fs.writeFileSync(out, JSON.stringify({ error: err.message }, null, 2));
    }
}

check();
