
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!);

async function manualFixes() {
    const isFix919 = process.argv.includes('--fix-919');

    if (isFix919) {
        console.log("🛠️ Fixing ID 919 (Parent/Child Conflict)...");
        // 919 is Loser (Parent), 914 is Winner (Child).
        // 1. Unlink 914 from 919
        await supabase.from('memorial_spaces').update({ parent_id: null }).eq('id', 914);

        // 2. Move any other children of 919 to 914
        await supabase.from('memorial_spaces').update({ parent_id: 914 }).eq('parent_id', 919);

        // 3. Move relations (reviews/images) - possibly already done by merge script but safe to retry
        await supabase.from('facility_reviews').update({ facility_id: 914 }).eq('facility_id', 919);
        await supabase.from('facility_images').update({ facility_id: 914 }).eq('facility_id', 919);

        // 4. Delete 919
        const { error } = await supabase.from('memorial_spaces').delete().eq('id', 919);
        if (error) console.error("   ❌ Delete 919 failed:", error);
        else console.log("   ✅ Deleted 919.");
        return;
    }

    // ... original code (omitted for brevity in this overwrite) ...
}

manualFixes();
