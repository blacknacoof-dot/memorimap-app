
import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as dotenv from 'dotenv';
import * as readline from 'readline';

// Load Env
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
);

const JUNK_KEYWORDS = [
    '무인민원',
    '민원발급',
    '출구',
    '입구',
    '분향소',
    '안치실',
    ' 제2봉안',
    ' 제3봉안',
    ' 제1봉안',
    '이벤트광장',
    '바바카페'
];

async function cleanJunkData() {
    console.log("🧹 Searching for Junk Data...");

    let allJunk: any[] = [];

    // Search for each keyword
    for (const keyword of JUNK_KEYWORDS) {
        const { data, error } = await supabase
            .from('memorial_spaces')
            .select('*')
            .ilike('name', `%${keyword}%`);

        if (data) {
            allJunk.push(...data);
        }
    }

    // Deduplicate by ID
    allJunk = allJunk.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);

    console.log(`📋 Found ${allJunk.length} potential junk records.`);

    if (allJunk.length === 0) {
        console.log("✨ No junk data found.");
        return;
    }

    console.log("--- Junk Data Candidates ---");
    allJunk.forEach(f => console.log(`[${f.id}] ${f.name} (${f.address})`));
    console.log("----------------------------");

    // Note: Since we cannot interactively ask user in this script easily without blocking agent, 
    // we will just Perform Deletion if confident, or dry run.
    // Let's make it a DRY RUN by default, pass argument --confirm to delete.

    const isConfirm = process.argv.includes('--confirm');

    if (!isConfirm) {
        console.log("\n⚠️  DRY RUN MODE. Use 'npx tsx scripts/clean-junk-data.ts --confirm' to verify deletion.");
        return;
    }

    // --- Part 2: Categorize Pet Facilities ---
    console.log("\n🐶 Searching for Pet Facilities to Update...");
    const PET_KEYWORDS = ['반려동물', '애견'];
    let allPets: any[] = [];

    for (const keyword of PET_KEYWORDS) {
        const { data } = await supabase
            .from('memorial_spaces')
            .select('*')
            .ilike('name', `%${keyword}%`);
        if (data) allPets.push(...data);
    }

    // Deduplicate
    allPets = allPets.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);

    // Filter those that are NOT already 'pet'
    const petsToUpdate = allPets.filter(p => p.type !== 'pet');

    if (petsToUpdate.length > 0) {
        console.log(`📋 Found ${petsToUpdate.length} pet facilities to classify as 'pet'.`);
        petsToUpdate.forEach(p => console.log(`   - ${p.name} (${p.type} -> pet)`));

        if (isConfirm) {
            const idsToUpdate = petsToUpdate.map(p => p.id);
            const { error: updateError } = await supabase
                .from('memorial_spaces')
                .update({ type: 'pet' })
                .in('id', idsToUpdate);

            if (updateError) console.error("❌ Type Update Failed:", updateError);
            else console.log("✅ Successfully updated facility types to 'pet'.");
        } else {
            console.log("⚠️  (Dry Run) Skipping update.");
        }
    } else {
        console.log("✨ All pet facilities are already correctly classified.");
    }

    if (allJunk.length === 0) return;

    console.log(`\n🗑️  Deleting ${allJunk.length} junk records...`);

    const idsToDelete = allJunk.map(f => f.id);
    const { error } = await supabase
        .from('memorial_spaces')
        .delete()
        .in('id', idsToDelete);

    if (error) {
        console.error("❌ Deletion Failed:", error);
    } else {
        console.log("✅ Successfully deleted junk records.");
    }
}

cleanJunkData();
