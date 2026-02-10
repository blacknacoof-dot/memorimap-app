
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

// Hardcoded fallback from client
const fallbackUrl = 'https://xvmpvzldezpoxxsarizm.supabase.co';
const fallbackKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2bXB2emxkZXpwb3h4c2FyaXptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NTEwMTksImV4cCI6MjA4MTQyNzAxOX0.TC-SJKzTRANjoLiRi2yg_EHu6xLer2wr-RaJ4AWIv04';

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);
const fallbackSupabase = createClient(fallbackUrl, fallbackKey);

async function checkClient(client: any, name: string) {
    console.log(`\n🔍 Checking ${name}...`);
    const { data: facilities, error: fError } = await client
        .from('memorial_spaces')
        .select('id, name')
        .like('name', '%오포장례식장%');

    if (fError) {
        console.error(`${name} Connect Error:`, fError.message);
        return;
    }
    console.log(`${name} Connected. Facility found:`, facilities?.[0]?.name);

    // Check Favorites Table
    const { data: favs, error: favError } = await client
        .from('favorites')
        .select('*')
        .limit(1);

    if (favError) {
        console.error(`${name} Favorites Error:`, favError.message);
    } else {
        console.log(`${name} Favorites Table Exists! Row count: ${favs?.length}`);
    }
}

async function debugFavorites() {
    await checkClient(supabase, 'Env Client');
    await checkClient(fallbackSupabase, 'Fallback Client');
}

debugFavorites();
