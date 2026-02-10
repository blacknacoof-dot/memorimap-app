
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
// Or Service Role if available, but Anon should work for select if RLS allows public read (which it does via 'Public can view facilities')

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSangjoData() {
    console.log('Checking facilities table for Sangjo entries...');

    // 1. Check 'facilities' table
    const { data: facilities, error } = await supabase
        .from('facilities')
        .select('id, name, category, gallery_images, images')
        .eq('id', '2289') // Check specific known ID
        .limit(1);

    if (error) {
        console.error('Error fetching facilities:', error);
    } else {
        console.log(`Found ${facilities.length} Sangjo facilities in 'facilities' table:`);
        facilities.forEach(f => {
            console.log(`- [${f.id}] ${f.name} (Cat: ${f.category})`);
            console.log(`  > gallery_images:`, f.gallery_images ? `Array(${f.gallery_images.length})` : 'NULL');
            console.log(`  > images:`, f.images ? `Array(${f.images.length})` : 'NULL');
            if (f.gallery_images && f.gallery_images.length > 0) {
                console.log(`    Sample: ${f.gallery_images[0]}`);
            }
        });
    }

    // 2. Check 'memorial_spaces' table just in case
    console.log('\nChecking memorial_spaces table...');
    const { data: memorialSpaces, error: msError } = await supabase
        .from('memorial_spaces')
        .select('id, name, type, gallery_images')
        .eq('type', 'sangjo')
        .limit(5);

    if (msError) {
        console.error('Error fetching memorial_spaces:', msError);
    } else {
        console.log(`Found ${memorialSpaces.length} Sangjo entries in 'memorial_spaces':`);
        memorialSpaces.forEach(f => {
            console.log(`- [${f.id}] ${f.name}`);
            console.log(`  > gallery_images:`, f.gallery_images ? `Array(${f.gallery_images.length})` : 'NULL');
        });
    }
}

checkSangjoData();
