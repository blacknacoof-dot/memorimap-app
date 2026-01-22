
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

// Config
const TASKS = [
    {
        label: 'Park Cemetery (공원묘지)',
        localDir: 'C:\\Users\\black\\Desktop\\memorimap\\data\\공원묘지',
        storagePath: 'optimized-park',
        dbTypes: ['park_cemetery', 'park', 'complex', 'cemetery']
    },
    {
        label: 'Pet Funeral (동물장례)',
        localDir: 'C:\\Users\\black\\Desktop\\memorimap\\data\\반려동물장례', // Corrected path from earlier listing
        storagePath: 'optimized-pet',
        dbTypes: ['pet_funeral', 'pet', 'pet_memorial']
    },
    {
        label: 'Sea Burial (해양장)',
        localDir: 'C:\\Users\\black\\Desktop\\memorimap\\data\\해양장',
        storagePath: 'optimized-sea',
        dbTypes: ['sea_burial', 'sea']
    }
];

const STORAGE_BUCKET = 'facility-images';

async function processCategory(task: any) {
    console.log(`\n🚀 Starting ${task.label}...`);

    // 1. Upload Images
    console.log(`📂 Reading images from: ${task.localDir}`);
    if (!fs.existsSync(task.localDir)) {
        console.error(`❌ Directory not found: ${task.localDir}`);
        return;
    }

    const files = fs.readdirSync(task.localDir).filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file));
    console.log(`📸 Found ${files.length} images.`);

    if (files.length < 3) {
        console.error(`❌ Not enough images (found ${files.length}, need 3+). Skipping.`);
        return;
    }

    const uploadedUrls: string[] = [];

    for (const file of files) {
        const filePath = path.join(task.localDir, file);
        const fileBuffer = fs.readFileSync(filePath);
        const storageKey = `${task.storagePath}/${file}`;

        const { error } = await supabase.storage
            .from(STORAGE_BUCKET)
            .upload(storageKey, fileBuffer, { contentType: 'image/jpeg', upsert: true });

        if (error) {
            console.error(`  ❌ Upload failed (${file}):`, error.message);
        } else {
            const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(storageKey);
            uploadedUrls.push(data.publicUrl);
        }
    }
    console.log(`✅ Uploaded ${uploadedUrls.length} images.`);

    // 2. Distribute
    console.log('🔍 Fetching target facilities...');
    const { data: facilities, error } = await supabase
        .from('facilities')
        .select('id, name')
        .in('type', task.dbTypes)
        .is('image_url', null);

    if (error) {
        console.error('❌ DB Fetch Error:', error);
        return;
    }

    if (!facilities || facilities.length === 0) {
        console.log('✅ No facilities missing images.');
        return;
    }

    console.log(`🎯 Updating ${facilities.length} facilities...`);

    let updateCount = 0;
    const shuffle = (array: string[]) => array.sort(() => Math.random() - 0.5);

    for (const facility of facilities) {
        const shuffled = shuffle([...uploadedUrls]);
        const selected = shuffled.slice(0, 3);

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
            if (updateCount % 10 === 0) process.stdout.write('.');
        }
    }
    console.log(`\n🎉 Updated ${updateCount} facilities for ${task.label}.`);
}

async function main() {
    for (const task of TASKS) {
        await processCategory(task);
    }
    console.log('\n✨ All tasks completed! ✨');
}

main();
