
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkData() {
    console.log('--- Checking Facilities Data ---');

    // 1. Check raw table data (limited columns)
    const { data: tableData, error: tableError } = await supabase
        .from('facilities')
        .select('id, name, images')
        .limit(5);

    if (tableError) {
        console.error('Error fetching table data:', tableError);
    } else {
        console.log('--- Table Data (Top 5) ---');
        tableData.forEach(row => {
            console.log(`[${row.name}]`);
            // console.log(`  image_url: ${row.image_url}`);
            console.log(`  images: ${JSON.stringify(row.images)}`);
        });
    }

    // 2. Check RPC data (what the frontend uses)
    // Need to mimic the RPC params roughly
    const { data: rpcData, error: rpcError } = await supabase
        .rpc('search_facilities', {
            lat: 37.5665,
            lng: 126.9780,
            radius_meters: 500000,
            filter_category: null
        });

    if (rpcError) {
        console.error('Error fetching RPC data:', rpcError);
    } else {
        // Just show first 3
        console.log('\n--- RPC Data (Top 3) ---');
        if (rpcData && rpcData.length > 0) {
            rpcData.slice(0, 3).forEach((item: any) => {
                console.log(`[ID: ${item.id}] Name: ${item.name}`);
                console.log(`  image_url (from RPC): ${item.image_url}`);
                // Check if 'images' field exists in RPC return (depends on VIEW definition)
                console.log(`  images (from RPC): ${JSON.stringify(item.images)}`);
            });
        } else {
            console.log('RPC returned no data.');
        }
    }
    // 3. Check facility_images table
    console.log('\n--- Facility Images Table (Top 5) ---');
    try {
        const { data: imagesData, error: imagesError } = await supabase
            .from('facility_images')
            .select('*')
            .limit(5);

        if (imagesError) {
            console.log('Error fetching facility_images:', imagesError.message);
        } else {
            console.log('Count:', imagesData?.length);
            console.log(imagesData);
        }
    } catch (e) { console.error(e); }
}

checkData();
