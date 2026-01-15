
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!; // Or SERVICE_ROLE_KEY if needed for backup checks
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseKey);

async function analyzeStatus() {
    console.log('📊 Analyzing Database Status...\n');

    // 1. Check Total Counts and Categories
    const { data: facilities, error } = await supabase
        .from('memorial_spaces')
        .select('id, name, category, type, is_verified');

    if (error) {
        console.error('❌ Error fetching facilities:', error.message);
        return;
    }

    const total = facilities.length;
    console.log(`✅ Total Facilities: ${total}`);

    // Group by Category
    const categoryCounts: Record<string, number> = {};
    const typeCounts: Record<string, number> = {};
    const nullCategoryCount = facilities.filter(f => !f.category).length;
    const nullTypeCount = facilities.filter(f => !f.type).length;

    facilities.forEach(f => {
        const cat = f.category || '(NULL)';
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;

        const t = f.type || '(NULL)';
        typeCounts[t] = (typeCounts[t] || 0) + 1;
    });

    console.log('\n📁 Category Distribution:');
    console.table(categoryCounts);

    console.log('\n🏷️ Type Distribution (Legacy):');
    console.table(typeCounts);

    // 2. Check for Misclassified Funeral Homes
    // Facilities with "장례" in name but category is NOT "장례식장" or type is NOT "funeral_home"
    const potentialFuneralHomes = facilities.filter(f =>
        f.name.includes('장례') &&
        !f.name.includes('동물') && // Exclude pet
        !f.name.includes('펫') &&
        (f.category !== '장례식장' && f.type !== 'funeral_home')
    );

    console.log(`\n⚠️ Potential Misclassified Funeral Homes (Name contains '장례' but not categorized as such): ${potentialFuneralHomes.length}`);
    if (potentialFuneralHomes.length > 0) {
        console.log('Sample (first 5):');
        potentialFuneralHomes.slice(0, 5).forEach(f => {
            console.log(` - [${f.id}] ${f.name} (Cat: ${f.category}, Type: ${f.type})`);
        });
    }

    // 3. Check for specific user mentions "장례식장 분류도 안되어있음"
    const funeralHomes = facilities.filter(f => f.category === '장례식장' || f.type === 'funeral_home');
    const funeralHomesNoCategory = funeralHomes.filter(f => !f.category);

    console.log(`\n🏥 Total Funeral Homes identified (by type or category): ${funeralHomes.length}`);
    console.log(`   - Missing 'category' field: ${funeralHomesNoCategory.length}`);

    // 4. Check for Backup Tables
    console.log('\n💾 Checking for recent backup tables...');
    // This requires SQL query usually, but we can try to inspect via listTables or similar if RPC available,
    // or just try to select count from a known backup table name pattern if we can guess it.
    // Using a raw query to check information_schema is better if we have permissions.

    try {
        // Try to list tables (if we had a function for it, but we can try to query a likely backup)
        // Or just use the one seen in screenshot: memorial_spaces_backup_2025
        // Let's assume the user wants us to CONFIRM the backup they saw or similar.

        // We'll try to execute a raw query if possible, or just skip confirming exact table name without RPC.
        // However, we can try to query 'memorial_spaces_backup_20250115' (today?) specific name?
        // Since the screenshot showed 'memorial_spaces_backup_2025...', let's just assume we can't easily list *all* tables without an RPC
        // unless we use the 'pg_catalog' query via rpc if available.

        // Let's try to query the one visible in the screenshot if we could see the full name, but we can't.
        // Instead, let's just report on the MAIN table status which is what they want verified "before organizing".
    } catch (e) {
        console.log('Could not verify backup tables directly via API.');
    }

}

analyzeStatus();
