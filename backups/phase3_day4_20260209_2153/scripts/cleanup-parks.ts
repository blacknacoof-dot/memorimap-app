
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

async function cleanupFacilities() {
    // 1. Delete all entries with "화장장" or "유택동산" in name
    console.log('=== Step 1: Deleting entries with "화장장" or "유택동산" ===\n');

    const { data: hwajangData, error: err1 } = await supabase
        .from('memorial_spaces')
        .select('id, name')
        .ilike('name', '%화장장%');

    if (err1) console.error(err1);
    else {
        console.log(`Found ${hwajangData?.length} entries with "화장장":`);
        for (const f of hwajangData || []) {
            console.log(`  Deleting [${f.id}] ${f.name}`);
            await supabase.from('memorial_spaces').delete().eq('id', f.id);
        }
    }

    const { data: yutaekData, error: err2 } = await supabase
        .from('memorial_spaces')
        .select('id, name')
        .ilike('name', '%유택동산%');

    if (err2) console.error(err2);
    else {
        console.log(`\nFound ${yutaekData?.length} entries with "유택동산":`);
        for (const f of yutaekData || []) {
            console.log(`  Deleting [${f.id}] ${f.name}`);
            await supabase.from('memorial_spaces').delete().eq('id', f.id);
        }
    }

    // 2. Find same-name duplicates (ignoring spaces)
    console.log('\n=== Step 2: Finding same-name duplicates ===\n');

    const { data: allFacilities, error: err3 } = await supabase
        .from('memorial_spaces')
        .select('id, name, address, type, created_at')
        .order('id');

    if (err3) {
        console.error(err3);
        return;
    }

    const nameMap = new Map<string, any[]>();
    const normalize = (s: string) => (s || '').replace(/\s+/g, '').trim();

    allFacilities?.forEach(f => {
        const key = normalize(f.name);
        if (!nameMap.has(key)) nameMap.set(key, []);
        nameMap.get(key)!.push(f);
    });

    let deletedCount = 0;
    nameMap.forEach((list, name) => {
        if (list.length > 1) {
            // Keep the first (oldest by ID), delete others
            const [keep, ...toDelete] = list;
            console.log(`"${keep.name}" has ${list.length} entries. Keeping ID ${keep.id}, deleting ${toDelete.map(d => d.id).join(', ')}`);
            toDelete.forEach(async (d) => {
                const { error } = await supabase.from('memorial_spaces').delete().eq('id', d.id);
                if (error) console.error(`  Failed to delete ${d.id}:`, error.message);
                else deletedCount++;
            });
        }
    });

    console.log(`\nTotal duplicates deleted: ${deletedCount}`);
    console.log('\nDone!');
}

cleanupFacilities();
