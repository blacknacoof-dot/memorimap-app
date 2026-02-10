import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFacilityImages() {
    const { data: images, error } = await supabase
        .from('facility_images')
        .select('image_url')
        .or('image_url.ilike.%guitar%,image_url.ilike.%기타%');

    if (error) {
        console.error(error);
        return;
    }

    console.log(`Found ${images?.length || 0} images with '기타' or 'guitar' in URL in facility_images table.`);
    images?.forEach(img => console.log(img.image_url));
}

checkFacilityImages();
