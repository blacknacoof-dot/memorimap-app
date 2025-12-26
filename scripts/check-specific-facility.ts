
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!);

const targetName = process.argv[2];

async function checkFacility() {
    console.log(`🔎 Checking for "${targetName}"...`);
    const { data: facilities, error } = await supabase
        .from('memorial_spaces')
        .select('*')
        .ilike('name', `%${targetName}%`);

    if (error) {
        console.error(error);
        return;
    }

    console.log(`Found ${facilities.length} matches:`);
    facilities.forEach(f => {
        console.log(`- [${f.id}] ${f.name} (${f.type})`);
        console.log(`  Addr: ${f.address}`);
        console.log(`  Loc: ${f.lat}, ${f.lng}`);
        console.log(`  Parent: ${f.parent_id}`);
        console.log(`  Normalized: ${f.name.replace(/\s+/g, '').trim()}`);
    });
}

checkFacility();
