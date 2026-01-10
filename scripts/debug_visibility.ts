
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// 1. Admin Client (Service Role) - Should see everything
const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!);

// 2. Anon Client (Public) - Simulates Frontend Users
const supabaseAnon = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function run() {
    console.log('--- Debugging Visibility ---');

    // Check Admin View
    const { data: adminData, error: adminError } = await supabaseAdmin
        .from('memorial_spaces')
        .select('id, name, is_verified')
        .eq('type', 'sangjo');

    console.log(`[Admin] Total Sangjo: ${adminData?.length || 0}`);
    if (adminError) console.error('[Admin] Error:', adminError);

    // Check Anon View
    const { data: anonData, error: anonError } = await supabaseAnon
        .from('memorial_spaces')
        .select('id, name, is_verified')
        .eq('type', 'sangjo')
        .eq('is_verified', true);

    console.log(`[Anon] Visible Sangjo (Verified=true): ${anonData?.length || 0}`);
    if (anonData && anonData.length > 0) {
        console.log('Visible Names:', anonData.map(c => c.name).join(', '));
    }
    if (anonError) console.error('[Anon] Error:', anonError);

    // Check valid status
    const verifiedCount = adminData?.filter(c => c.is_verified).length;
    console.log(`[Admin] Verified Count: ${verifiedCount}`);
}

run();
