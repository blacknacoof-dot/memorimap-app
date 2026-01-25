
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: '.env' });
// Try local env as well
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRpc() {
    console.log('Testing search_facilities RPC...');

    // Test params
    const lat = 37.5665;
    const lng = 126.9780;
    const radius = 5000;

    const { data, error } = await supabase.rpc('search_facilities', {
        user_lat: lat,
        user_lng: lng,
        radius_meters: radius,
        filter_category: null
    });

    if (error) {
        console.error('❌ RPC Failed:', error);
        console.error('Error Details:', JSON.stringify(error, null, 2));
    } else {
        console.log('✅ RPC Success! Records found:', data?.length);
    }
}

testRpc();
