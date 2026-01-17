
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// ES Module dirname workaround
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
} else {
    console.warn("⚠️ .env.local not found at", envPath);
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase URL or Key in environment variables.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkStatus() {
    console.log('--- 🔍 Database Status Check ---');

    // 1. Check RPC 'search_facilities'
    console.log('\n[1] Checking search_facilities RPC...');
    try {
        // Attempt with NEW signature (user_lat, user_lng)
        const { data: newData, error: newError } = await supabase.rpc('search_facilities', {
            user_lat: 37.5,
            user_lng: 127.0,
            radius_meters: 1000,
            filter_category: null
        });

        if (!newError) {
            console.log('✅ search_facilities accepts (user_lat, user_lng).');
        } else {
            console.log('❌ search_facilities failed with (user_lat, user_lng):', newError.message);
            if (newError.message.includes('function') && newError.message.includes('does not exist')) {
                console.log('   -> This confirms the function signature is OLD or missing.');
            }
        }
    } catch (e) {
        console.error('Error checking RPC:', e);
    }

    // 2. Check 'target_audience' column
    console.log('\n[2] Checking target_audience column...');
    // We cannot query information_schema easily with anon key usually, so we just try to select the column
    const { data: colData, error: colError } = await supabase
        .from('facilities')
        .select('target_audience')
        .limit(1);

    if (colError) {
        console.log('❌ target_audience column issue:', colError.message);
    } else {
        console.log('✅ target_audience column is accessible.');
    }

    // 3. Check for 'pet_funeral' category
    console.log('\n[3] Checking pet_funeral category...');
    const { count: petCount, error: petError } = await supabase
        .from('facilities')
        .select('*', { count: 'exact', head: true })
        .eq('category', 'pet_funeral');

    if (petError) {
        console.log('Error checking pet_funeral:', petError.message);
    } else {
        console.log(`ℹ️ Facilities with category='pet_funeral': ${petCount}`);
        if (petCount === 0) console.log('⚠️ No pet_funeral facilities found. Migration strongly recommended.');
    }

    // 4. Check for 'funeral_home' with 'pet' in name
    console.log('\n[4] Checking unmigrated pet facilities...');
    const { data: unmigrated, error: unmigratedError } = await supabase
        .from('facilities')
        .select('name, category')
        .eq('category', 'funeral_home')
        .ilike('name', '%펫%')
        .limit(3);

    if (unmigratedError) {
        console.log('Error checking unmigrated:', unmigratedError.message);
    } else {
        if (unmigrated && unmigrated.length > 0) {
            console.log(`⚠️ Found unmigrated facilities (e.g. ${unmigrated[0].name}). Migration needed.`);
        } else {
            console.log('ℹ️ No obvious unmigrated facilities found (or restricted).');
        }
    }

    console.log('\n--- End Check ---');
}

checkStatus();
