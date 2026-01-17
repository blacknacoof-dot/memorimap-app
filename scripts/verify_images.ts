
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase URL or Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyImageReturn() {
    console.log('--- 📸 Image Return Verify ---');

    // Call RPC
    const { data, error } = await supabase.rpc('search_facilities', {
        user_lat: 37.5,
        user_lng: 127.0,
        radius_meters: 500000,
        filter_category: null
    });

    if (error) {
        console.error('❌ RPC Error:', error.message);
    } else if (data && data.length > 0) {
        const firstItem = data[0];
        console.log(`✅ Fetched ${data.length} items.`);
        console.log('Sample Item Name:', firstItem.name);
        console.log('Sample Image URL:', firstItem.image_url);

        if (firstItem.image_url) {
            console.log('🎉 SUCCESS: Image URL is present!');
        } else {
            console.log('⚠️ Image URL is null/empty. (Might be expected if data is missing images, but column should exist)');
            // Check if key exists at least
            if ('image_url' in firstItem) {
                console.log('   (Field "image_url" exists in response object)');
            } else {
                console.log('❌ Field "image_url" is MISSING in response object!');
            }
        }
    } else {
        console.log('⚠️ No data returned from RPC.');
    }
}

verifyImageReturn();
