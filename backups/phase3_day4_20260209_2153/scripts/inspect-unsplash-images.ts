
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    console.log('Available Env Keys:', Object.keys(process.env).filter(k => k.includes('SUPABASE')));
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkImages() {
    const facilityId = 18488641; // 양천효병원 장례식장 ID
    console.log(`Checking images for Facility ID: ${facilityId}`);

    // 1. Check specific facility
    const { data: images, error } = await supabase
        .from('facility_images')
        .select('*')
        .eq('facility_id', facilityId);

    if (error) {
        console.error('Error fetching images:', error);
    } else if (images && images.length > 0) {
        console.log(`Found ${images.length} images for facility ${facilityId}:`);
        images.forEach((img: any) => {
            console.log(`[ID: ${img.id}] URL: ${img.image_url}`);
        });
    } else {
        console.log('No images found in facility_images table for this facility.');
    }

    // 2. Check global Unsplash usage
    const { count, error: countError } = await supabase
        .from('facility_images')
        .select('*', { count: 'exact', head: true })
        .ilike('image_url', '%unsplash%');

    if (countError) {
        console.error('Error counting unsplash images:', countError);
    } else {
        console.log(`\nTotal Unsplash images in DB: ${count}`);
    }
}

checkImages();
