
import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load Env
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
);

const JUNK_KEYWORDS = [
    '지원',    // Support
    '대행',    // Agency
    '제조',    // Manufacturing
    '용품',    // Supplies (Bonus, usually retail)
    '컨설팅'   // Consulting (Bonus)
];

async function cleanPetJunk() {
    console.log("🧹 Searching for Non-Funeral Business Records (Support/Agency/Manufacturing)...");

    let allJunk: any[] = [];

    for (const keyword of JUNK_KEYWORDS) {
        const { data } = await supabase
            .from('memorial_spaces')
            .select('*')
            .ilike('name', `%${keyword}%`);

        if (data) {
            allJunk.push(...data);
        }
    }

    // Deduplicate
    allJunk = allJunk.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);

    console.log(`📋 Found ${allJunk.length} records matching exclusion criteria.`);

    if (allJunk.length === 0) {
        console.log("✨ No records found to delete.");
        return;
    }

    console.log("--- Records to Delete ---");
    allJunk.forEach(f => console.log(`[${f.id}] ${f.name} (${f.type})`));
    console.log("-------------------------");

    // Execute Deletion
    console.log(`\n🗑️  Deleting ${allJunk.length} records...`);

    const idsToDelete = allJunk.map(f => f.id);
    const { error } = await supabase
        .from('memorial_spaces')
        .delete()
        .in('id', idsToDelete);

    if (error) {
        console.error("❌ Deletion Failed:", error);
    } else {
        console.log("✅ Successfully deleted records.");
    }
}

cleanPetJunk();
