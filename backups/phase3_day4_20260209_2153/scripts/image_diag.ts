
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkImages() {
    console.log('--- Checking Facilities Table for Images ---');
    // Check first 5 facilities
    const { data: facilities, error: fError } = await supabase
        .from('facilities')
        .select('id, name, images, image_url')
        .limit(5);

    if (fError) {
        console.error('Error fetching facilities:', fError);
    } else {
        console.log(`Found ${facilities.length} facilities.`);
        facilities.forEach(f => {
            console.log(`[Facility] ${f.name} (${f.id}):`);
            console.log(`  - image_url: ${f.image_url || 'NULL'}`);
            console.log(`  - images: ${f.images ? (Array.isArray(f.images) ? `Array(${f.images.length})` : typeof f.images) : 'NULL/Empty'}`);
        });
    }

    console.log('\n--- Checking Facility Images Table ---');
    const { count, error: cError } = await supabase
        .from('facility_images')
        .select('*', { count: 'exact', head: true });

    if (cError) {
        console.error('Error counting facility_images:', cError);
    } else {
        console.log(`Total rows in facility_images: ${count}`);
    }
}

checkImages();
