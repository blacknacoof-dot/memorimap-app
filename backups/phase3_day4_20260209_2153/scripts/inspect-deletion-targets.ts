
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function findTargets() {
    console.log('Searching for facilities...\n');

    // Search by address '신현로 116' (Address from Excel for '분당 스카이캐슬')
    const { data: addressMatch, error: err1 } = await supabase
        .from('memorial_spaces')
        .select('*')
        .ilike('address', '%신현로 116%');

    if (err1) console.error('Error searching address:', err1);
    else {
        console.log(`[Address Match: 신현로 116] Found ${addressMatch?.length || 0}:`);
        addressMatch?.forEach(f => console.log(`  ID: ${f.id}, Name: ${f.name}, Addr: ${f.address}`));
    }

    // Search by name '분당 스카이캐슬'
    const { data: nameMatch, error: err2 } = await supabase
        .from('memorial_spaces')
        .select('*')
        .ilike('name', '%분당%스카이%'); // Wide search

    if (err2) console.error('Error searching name:', err2);
    else {
        console.log(`\n[Name Match: 분당 스카이] Found ${nameMatch?.length || 0}:`);
        nameMatch?.forEach(f => console.log(`  ID: ${f.id}, Name: ${f.name}, Addr: ${f.address}`));
    }

    // Search for '스카이캐슬추모공원' to confirm what to keep
    const { data: keepMatch, error: err3 } = await supabase
        .from('memorial_spaces')
        .select('*')
        .ilike('name', '%스카이캐슬추모공원%');

    if (err3) console.error('Error searching keep:', err3);
    else {
        console.log(`\n[Keep Candidate: 스카이캐슬추모공원] Found ${keepMatch?.length}:`);
        keepMatch?.forEach(f => console.log(`  ID: ${f.id}, Name: ${f.name}, Addr: ${f.address}`));
    }

}

findTargets();
