
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
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function removeUnsplashImages() {
    console.log('🔍 Scanning for Unsplash images...');

    // 1. Count before deletion
    const { count: beforeCount, error: countError } = await supabase
        .from('facility_images')
        .select('*', { count: 'exact', head: true })
        .ilike('image_url', '%unsplash%');

    if (countError) {
        console.error('Error counting images:', countError);
        return;
    }

    console.log(`Found ${beforeCount} Unsplash images to delete.`);

    if (beforeCount === 0) {
        console.log('No images to delete.');
        return;
    }

    // 2. Delete
    const { error: deleteError } = await supabase
        .from('facility_images')
        .delete()
        .ilike('image_url', '%unsplash%');

    if (deleteError) {
        console.error('Error deleting images:', deleteError);
        return;
    }

    // 3. Verify
    const { count: afterCount } = await supabase
        .from('facility_images')
        .select('*', { count: 'exact', head: true })
        .ilike('image_url', '%unsplash%');

    console.log(`Deletion complete. Remaining Unsplash images: ${afterCount}`);
    console.log(`Successfully deleted ${beforeCount - (afterCount || 0)} images.`);
}

removeUnsplashImages();
