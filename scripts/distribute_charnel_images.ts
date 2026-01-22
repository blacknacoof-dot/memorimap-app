
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// Configuration
const LOCAL_IMAGE_DIR = 'C:\\Users\\black\\Desktop\\memorimap\\data\\봉안시설 대표이미지_최적화';
const STORAGE_BUCKET = 'facility-images';
const STORAGE_PATH = 'optimized-charnel'; // Folder in bucket

async function uploadImages() {
    console.log('📂 Reading local images...');
    if (!fs.existsSync(LOCAL_IMAGE_DIR)) {
        console.error(`❌ Directory not found: ${LOCAL_IMAGE_DIR}`);
        return [];
    }

    const files = fs.readdirSync(LOCAL_IMAGE_DIR).filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file));
    console.log(`📸 Found ${files.length} images.`);

    const uploadedUrls: string[] = [];

    for (const file of files) {
        const filePath = path.join(LOCAL_IMAGE_DIR, file);
        const fileBuffer = fs.readFileSync(filePath);
        const storageKey = `${STORAGE_PATH}/${file}`;

        // Check if exists (optional, or just upsert)
        const { error: uploadError } = await supabase.storage
            .from(STORAGE_BUCKET)
            .upload(storageKey, fileBuffer, {
                contentType: 'image/jpeg', // Assuming mostly jpg based on file list
                upsert: true
            });

        if (uploadError) {
            console.error(`❌ Failed to upload ${file}:`, uploadError.message);
        } else {
            // Get Public URL
            const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(storageKey);
            uploadedUrls.push(data.publicUrl);
            console.log(`✅ Uploaded: ${file}`);
        }
    }

    return uploadedUrls;
}

async function distributeImages(imageUrls: string[]) {
    if (imageUrls.length < 3) {
        console.error('❌ Not enough images to distribute (need at least 3).');
        return;
    }

    console.log('🔍 Fetching target facilities (charnel without images)...');

    // Fetch target facilities
    const { data: facilities, error } = await supabase
        .from('facilities')
        .select('id, name')
        .in('type', ['charnel', 'charnel_house', 'columbarium', 'memorial'])
        .is('image_url', null); // Fetch those missing image_url

    if (error) {
        console.error('❌ DB Fetch Error:', error);
        return;
    }

    if (!facilities || facilities.length === 0) {
        console.log('✅ No facilities found missing images!');
        return;
    }

    console.log(`🎯 Found ${facilities.length} facilities to update.`);
    console.log('🎲 Distributing images (3 unique per facility, minimized overlap)...');

    let updateCount = 0;

    // Shuffling helper
    const shuffle = (array: string[]) => array.sort(() => Math.random() - 0.5);

    for (const facility of facilities) {
        // 1. Create a biased random selection to ensure variety
        // We shuffle a fresh copy of the full image list every time to ensure randomness
        // Then pick top 3
        const shuffled = shuffle([...imageUrls]);
        const selected = shuffled.slice(0, 3);

        // Main image is the first one
        const mainImage = selected[0];

        // Update DB
        const { error: updateError } = await supabase
            .from('facilities')
            .update({
                image_url: mainImage,
                images: selected // Store all 3 as array
            })
            .eq('id', facility.id);

        if (updateError) {
            console.error(`❌ Failed to update ${facility.name}:`, updateError.message);
        } else {
            // console.log(`✨ Updated ${facility.name}`);
            updateCount++;
            if (updateCount % 10 === 0) process.stdout.write('.');
        }
    }

    console.log(`\n🎉 Successfully updated ${updateCount} facilities!`);
}

async function main() {
    console.log('🚀 Starting Charnel Image Distribution...');

    // 1. Upload
    const imageUrls = await uploadImages();

    if (imageUrls.length === 0) {
        console.error('❌ No images available. Aborting.');
        return;
    }

    // 2. Distribute
    await distributeImages(imageUrls);
}

main();
