import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) { process.exit(1); }
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('🔍 Checking Description in DB...');

    // Check a few companies
    const names = ["프리드라이프", "더리본", "보람상조"];

    for (const name of names) {
        const { data } = await supabase.from('memorial_spaces').select('name, description').ilike('name', `%${name}%`).maybeSingle();
        if (data) {
            console.log(`\n[${data.name}]`);
            console.log(`Description Length: ${data.description?.length || 0}`);
            console.log(`Preview: ${data.description?.substring(0, 50)}...`);
        } else {
            console.log(`\n[${name}] NOT FOUND`);
        }
    }
}

check();
