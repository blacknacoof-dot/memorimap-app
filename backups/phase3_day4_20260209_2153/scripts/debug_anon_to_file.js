import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const out = 'debug_anon_result.json';
fs.writeFileSync(out, 'STARTED\n');

async function check() {
    try {
        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        const { data, error } = await supabase.from('reviews').select('*').limit(5);

        const result = {
            success: !!data,
            count: data?.length || 0,
            error: error,
            sampleKeys: data?.[0] ? Object.keys(data[0]) : [],
            env: {
                hasUrl: !!supabaseUrl,
                hasAnon: !!supabaseAnonKey
            }
        };

        fs.writeFileSync(out, JSON.stringify(result, null, 2));
        console.log('DONE');
    } catch (err) {
        fs.writeFileSync(out, 'ERROR: ' + err.message);
    }
}

check();
