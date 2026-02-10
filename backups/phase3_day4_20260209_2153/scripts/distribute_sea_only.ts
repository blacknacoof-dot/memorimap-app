
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// Configuration
const CONFIG = {
    label: 'Sea Burial (해양장)',
    localDir: 'C:\\Users\\black\\Desktop\\memorimap\\data\\해양장',
    storagePath: 'optimized-sea',
    // DB types for Sea Burial
    dbTypes: ['sea_burial', 'sea']
};

const STORAGE_BUCKET = 'facility-images';

async function main() {
    console.log(`🚀 Starting ${CONFIG.label} Image Distribution...`);

    // 1. Upload Images
    console.log(`📂 Reading images from: ${CONFIG.localDir}`);
    if (!fs.existsSync(CONFIG.localDir)) {
        console.error(`❌ Directory not found: ${CONFIG.localDir}`);
        return;
    }

    const files = fs.readdirSync(CONFIG.localDir).filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file));
    console.log(`📸 Found ${files.length} images.`);

    if (files.length < 3) {
        console.error(`❌ Not enough images (found ${files.length}, need at least 3). Aborting.`);
        return;
    }

    const uploadedUrls: string[] = [];
    console.log('📤 Uploading images to Supabase...');

    for (const file of files) {
        const filePath = path.join(CONFIG.localDir, file);
        const fileBuffer = fs.readFileSync(filePath);
        const storageKey = `${CONFIG.storagePath}/${file}`;

        const { error } = await supabase.storage
            .from(STORAGE_BUCKET)
            .upload(storageKey, fileBuffer, { contentType: 'image/png', upsert: true });

        if (error) {
            console.error(`  ❌ Upload failed (${file}):`, error.message);
        } else {
            const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(storageKey);
            uploadedUrls.push(data.publicUrl);
        }
    }
    console.log(`✅ Successfully uploaded ${uploadedUrls.length} images.`);

    // 2. Distribute
    console.log('🔍 Fetching target Sea Burial facilities...');
    const { data: facilities, error } = await supabase
        .from('facilities')
        .select('id, name')
        .in('type', CONFIG.dbTypes)
        .is('image_url', null); // Only missing images

    if (error) {
        console.error('❌ DB Fetch Error:', error);
        return;
    }

    if (!facilities || facilities.length === 0) {
        console.log('✅ No facilities found missing images!');
        return;
    }

    console.log(`🎯 Found ${facilities.length} Sea Burial facilities to update.`);
    console.log('🎲 Distributing 3 unique images per facility...');

    let updateCount = 0;
    const shuffle = (array: string[]) => array.sort(() => Math.random() - 0.5);

    for (const facility of facilities) {
        // Randomly pick 3 unique images from the full uploaded list
        const shuffled = shuffle([...uploadedUrls]);
        const selected = shuffled.slice(0, 3);

        // Main image is the first one
        const { error: updateError } = await supabase
            .from('facilities')
            .update({
                image_url: selected[0],
                images: selected
            })
            .eq('id', facility.id);

        if (updateError) {
            console.error(`❌ Update failed (${facility.name}):`, updateError.message);
        } else {
            updateCount++;
            process.stdout.write('.');
        }
    }

    console.log(`\n🎉 Successfully updated ${updateCount} Sea Burial facilities!`);
}

main();
