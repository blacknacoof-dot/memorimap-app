
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) { process.exit(1); }

const supabase = createClient(supabaseUrl, supabaseKey);

async function audit() {
    console.log("🔍 Starting Comprehensive Review Audit...\n");

    // 1. Get all Sangjo companies
    const { data: companies, error: cError } = await supabase
        .from('memorial_spaces')
        .select('id, name')
        .eq('type', 'sangjo');

    if (cError) { console.error("Error fetching companies:", cError); return; }

    console.log(`Found ${companies?.length} Sangjo companies in DB.`);

    // 2. Iterate and check reviews
    for (const company of companies || []) {
        const { data: reviews, error: rError } = await supabase
            .from('reviews')
            .select('id, user_name, space_id, memorial_space_id')
            .or(`space_id.eq.${company.id},memorial_space_id.eq.${company.id}`);

        if (rError) {
            console.error(`Error fetching reviews for ${company.name}:`, rError);
            continue;
        }

        const stats = {
            total: reviews?.length || 0,
            anonymous: 0, // Explicitly "익명"
            nullOrEmpty: 0, // NULL or ""
            masked: 0 // Contains "*"
        };

        reviews?.forEach(r => {
            if (!r.user_name || r.user_name.trim() === '') stats.nullOrEmpty++;
            else if (r.user_name === '익명') stats.anonymous++;
            else if (r.user_name.includes('*')) stats.masked++;
        });

        if (stats.total === 0) {
            console.log(`⚠️  [NO REVIEWS] ${company.name} (ID: ${company.id})`);
        } else if (stats.nullOrEmpty > 0 || stats.anonymous > 0) {
            console.log(`❌ [PROBLEM] ${company.name}: Total ${stats.total}, Null/Empty: ${stats.nullOrEmpty}, '익명': ${stats.anonymous}, Masked: ${stats.masked}`);
        } else {
            // console.log(`✅ [OK] ${company.name}: ${stats.total} reviews (All masked)`);
        }
    }

    console.log("\nAudit Complete.");
}

audit();
