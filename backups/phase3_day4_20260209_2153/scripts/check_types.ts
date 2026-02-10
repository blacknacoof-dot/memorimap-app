
import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Setup Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    // List keys just in case
    console.log('Available keys:', Object.keys(process.env).filter(k => k.startsWith('VITE_')));
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTypes() {
    console.log('Checking facility types...');

    // Check types in memorial_spaces
    const { data, error } = await supabase
        .from('memorial_spaces')
        .select('type');

    if (error) {
        console.error('Error fetching types:', error);
        return;
    }

    if (!data) {
        console.log("No data found");
        return;
    }

    const uniqueTypes = new Set(data.filter((i: any) => i.type).map((item: any) => item.type));
    console.log('Unique types in memorial_spaces:', Array.from(uniqueTypes).sort());

    // Count per type
    const counts: Record<string, number> = {};
    data.forEach((item: any) => {
        const t = item.type || 'NULL';
        counts[t] = (counts[t] || 0) + 1;
    });
    console.log('Counts per type:', counts);

    // Check if there are any that look like funeral but aren't 'funeral_home'
    const suspicious = Array.from(uniqueTypes).filter(t =>
        typeof t === 'string' && (t.includes('funeral') || t.includes('장례'))
    );

    console.log('Suspicious types containing "funeral" or "장례":', suspicious);

    // Check category column if exists
    const { data: catData, error: catError } = await supabase
        .from('memorial_spaces')
        .select('category');

    if (!catError && catData) {
        const uniqueCats = new Set(catData.filter((i: any) => i.category).map((item: any) => item.category));
        console.log('Unique categories in memorial_spaces:', Array.from(uniqueCats).sort());
    }
}

checkTypes();
