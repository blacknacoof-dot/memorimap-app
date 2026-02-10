
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const GALLERY_POOL = [
    '/sangjo-gallery/sangjo_1.jpg',
    '/sangjo-gallery/sangjo_2.jpg',
    '/sangjo-gallery/sangjo_3.jpg',
    '/sangjo-gallery/sangjo_4.jpg',
    '/sangjo-gallery/sangjo_5.jpg',
    '/sangjo-gallery/sangjo_6.jpg',
    '/sangjo-gallery/sangjo_7.jpg',
];

function getRandomImages(count: number) {
    const shuffled = [...GALLERY_POOL].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

async function updateGalleryRandom() {
    console.log('Fetching Sangjo facilities...');

    // Fetch all Sangjo IDs
    const { data: facilities, error } = await supabase
        .from('memorial_spaces')
        .select('id, name')
        .eq('type', 'sangjo');

    if (error) {
        console.error('Error fetching facilities:', error);
        return;
    }

    console.log(`Found ${facilities.length} Sangjo facilities. Updating gallery images...`);

    let successCount = 0;
    let failCount = 0;

    for (const facility of facilities) {
        const randomImages = getRandomImages(3);

        const { error: updateError } = await supabase
            .from('memorial_spaces')
            .update({ gallery_images: randomImages })
            .eq('id', facility.id);

        if (updateError) {
            console.error(`Failed to update ${facility.name} (${facility.id}):`, updateError.message);
            failCount++;
        } else {
            // console.log(`Updated ${facility.name} (${facility.id})`);
            successCount++;
        }
    }

    console.log(`Update complete. Success: ${successCount}, Failed: ${failCount}`);
}

updateGalleryRandom();
