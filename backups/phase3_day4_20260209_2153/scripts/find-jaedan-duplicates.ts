
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

async function findJaedanbeopinDuplicates() {
    console.log('=== Finding 재단법인 duplicates ===\n');

    // Get all facilities with 재단법인 in name
    const { data: jaedanData, error: err1 } = await supabase
        .from('memorial_spaces')
        .select('id, name, address')
        .ilike('name', '%재단법인%');

    if (err1) {
        console.error(err1);
        return;
    }

    console.log(`Found ${jaedanData?.length || 0} entries with "재단법인":\n`);

    const duplicates: any[] = [];

    for (const jf of jaedanData || []) {
        // Extract the name without 재단법인
        const cleanName = jf.name.replace(/재단법인\s*/g, '').replace(/\(재\)\s*/g, '').trim();

        // Search for facilities with similar name (without 재단법인)
        const { data: matches } = await supabase
            .from('memorial_spaces')
            .select('id, name, address')
            .ilike('name', `%${cleanName}%`)
            .neq('id', jf.id);

        if (matches && matches.length > 0) {
            // Check if any match is NOT 재단법인 (i.e., cleaner entry exists)
            const cleanMatch = matches.find(m => !m.name.includes('재단법인') && !m.name.includes('(재)'));
            if (cleanMatch) {
                duplicates.push({
                    jaedanbeopin: jf,
                    cleanVersion: cleanMatch,
                });
                console.log(`[DUPLICATE]`);
                console.log(`  재단법인: [${jf.id}] ${jf.name}`);
                console.log(`  Clean:    [${cleanMatch.id}] ${cleanMatch.name}`);
                console.log(`  Address:  ${jf.address}`);
                console.log('');
            }
        }
    }

    console.log(`\n=== Summary ===`);
    console.log(`Total 재단법인 entries: ${jaedanData?.length}`);
    console.log(`Duplicates (have clean version): ${duplicates.length}`);
    console.log(`\nIDs to delete (재단법인 versions):`);
    duplicates.forEach(d => console.log(`  ${d.jaedanbeopin.id} - ${d.jaedanbeopin.name}`));
}

findJaedanbeopinDuplicates();
