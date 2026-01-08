import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
);

async function removeEvStationSuffix() {
    console.log('🔌 Removing "전기차충전소" suffix from both tables...');

    const tables = [
        { name: 'memorial_spaces', nameCol: 'name' },
        { name: 'facilities', nameCol: 'name' }
    ];

    for (const table of tables) {
        console.log(`\nProcessing ${table.name}...`);

        const { data: targets, error } = await supabase
            .from(table.name)
            .select(`id, ${table.nameCol}`)
            .ilike(table.nameCol, '%전기차충전소%');

        if (error) {
            console.error(`❌ Fetch failed for ${table.name}:`, error.message);
            continue;
        }

        if (!targets || targets.length === 0) {
            console.log(`✅ No "전기차충전소" found in ${table.name}.`);
            continue;
        }

        console.log(`🔍 Found ${targets.length} records in ${table.name}.`);

        let updateCount = 0;
        for (const record of targets) {
            const currentName = record[table.nameCol];
            // Regex to remove "전기차충전소" or "전기차 충전소"
            const newName = currentName
                .replace(/전기차\s*충전소/g, '')
                .trim();

            if (newName === currentName) continue;

            if (newName.length < 2) {
                console.warn(`⚠️ Skipping: "${currentName}" becomes too short. Manually check.`);
                continue;
            }

            const { error: updateError } = await supabase
                .from(table.name)
                .update({ [table.nameCol]: newName })
                .eq('id', record.id);

            if (updateError) {
                console.error(`   ❌ Failed [${record.id}]:`, updateError.message);
            } else {
                console.log(`   ✨ Fixed: "${currentName}" -> "${newName}"`);
                updateCount++;
            }
        }
        console.log(`🎉 Done with ${table.name}. Fixed ${updateCount} records.`);
    }

    console.log('\n--- Name Cleanup Complete ---');
}

removeEvStationSuffix();
