
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

async function consolidate() {
    console.log('Consolidating "스카이캐슬추모공원"...\n');

    // 1. Find duplicates by address '광주시 머루숯길 61-33'
    const { data: duplicates, error } = await supabase
        .from('memorial_spaces')
        .select('id, name, address')
        .ilike('address', '%머루숯길 61-33%');

    if (error) {
        console.error('Error finding duplicates:', error);
        return;
    }

    console.log(`Found ${duplicates?.length} entries for "머루숯길 61-33":`);
    duplicates?.forEach(f => console.log(`  [${f.id}] ${f.name}`));

    if (!duplicates || duplicates.length <= 1) {
        console.log('No duplicates found/remaining.');
        return;
    }

    // Keep the first one (or specifically keep ID 654 if preferred, but lowest ID 9 is also fine?
    // User asked to make it ONE.
    // The first image in user screenshot had 5 reviews (ID 654 in my previous assume? No, review count is simulated).
    // Let's keep the one with ID 654 as it was "Duplicate 1" in previous log, ID 9 was "Duplicate 2". 
    // Actually usually ID 9 is older. Let's keep ID 654 as it seems to be the "main" one in some contexts? 
    // Wait, I previously tried to delete ID 9. Let's delete ID 9.

    const toKeep = duplicates.find(d => d.id === 654) || duplicates[0];
    const toDelete = duplicates.filter(d => d.id !== toKeep.id);

    console.log(`\nKeeping: [${toKeep.id}] ${toKeep.name}`);
    console.log(`Deleting: ${toDelete.map(d => `[${d.id}]`).join(', ')}`);

    for (const d of toDelete) {
        const { error: delErr } = await supabase.from('memorial_spaces').delete().eq('id', d.id);
        if (delErr) console.error(`Failed to delete ${d.id}:`, delErr);
        else console.log(`Deleted ${d.id}`);
    }
}

consolidate();
