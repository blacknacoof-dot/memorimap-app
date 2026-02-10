
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
// [ADJUSTED] Using the existing folder "자연장" since "자연장 최적화" was not found
const LOCAL_IMAGE_DIR = 'C:\\Users\\black\\Desktop\\memorimap\\data\\자연장';
const STORAGE_BUCKET = 'facility-images';
const STORAGE_PATH = 'optimized-natural'; // Folder in bucket

async function uploadImages() {
    console.log('📂 Reading local images from:', LOCAL_IMAGE_DIR);
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

        // Upsert upload
        const { error: uploadError } = await supabase.storage
            .from(STORAGE_BUCKET)
            .upload(storageKey, fileBuffer, {
                contentType: 'image/jpeg',
                upsert: true
            });

        if (uploadError) {
            console.error(`❌ Failed to upload ${file}:`, uploadError.message);
        } else {
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

    console.log('🔍 Fetching Natural Burial facilities missing images...');

    // Fetch target facilities: Natural Burial (natural, tree_burial, etc.)
    const { data: facilities, error } = await supabase
        .from('facilities')
        .select('id, name')
        .in('type', ['natural', 'natural_burial', 'tree_burial'])
        .is('image_url', null);

    if (error) {
        console.error('❌ DB Fetch Error:', error);
        return;
    }

    if (!facilities || facilities.length === 0) {
        console.log('✅ No facilities found missing images!');
        return;
    }

    console.log(`🎯 Found ${facilities.length} facilities to update.`);
    console.log('🎲 Distributing images (3 unique per facility)...');

    let updateCount = 0;
    const shuffle = (array: string[]) => array.sort(() => Math.random() - 0.5);

    for (const facility of facilities) {
        // Random selection
        const shuffled = shuffle([...imageUrls]);
        const selected = shuffled.slice(0, 3);
        const mainImage = selected[0];

        const { error: updateError } = await supabase
            .from('facilities')
            .update({
                image_url: mainImage,
                images: selected
            })
            .eq('id', facility.id);

        if (updateError) {
            console.error(`❌ Failed to update ${facility.name}:`, updateError.message);
        } else {
            updateCount++;
            if (updateCount % 10 === 0) process.stdout.write('.');
        }
    }

    console.log(`\n🎉 Successfully updated ${updateCount} facilities!`);
}

async function main() {
    console.log('🚀 Starting Natural Burial Image Distribution...');
    const imageUrls = await uploadImages();

    if (imageUrls.length === 0) {
        console.error('❌ No images available. Aborting.');
        return;
    }
    await distributeImages(imageUrls);
}

main();
