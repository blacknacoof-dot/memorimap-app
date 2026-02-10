
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function uploadAndSetDefaults() {
    console.log('Starting default image assignment for Sangjo...');

    // 1. Upload logic (Simulated here since we reuse the bucket, assuming we need a specific image)
    // We can use the 'funeral' default as a fallback for Sangjo if no specific one exists, 
    // OR use a specific one. Let's look for "상조 대표이미지.jpg" or reuse "장례식장 대표이미지.jpg".
    // The user didn't provide "Sangjo" image list. I'll use "장례식장 대표이미지.jpg" for now but name it 'sangjo.jpg' in storage.

    const localMap: Record<string, string> = {
        'sangjo': '장례식장 대표이미지.jpg',
    };

    const storageMap: Record<string, string> = {};

    for (const [type, fileName] of Object.entries(localMap)) {
        const filePath = path.resolve('data', fileName);
        if (!fs.existsSync(filePath)) {
            console.warn(`File not found: ${filePath}, skipping...`);
            continue;
        }
        const fileBuffer = fs.readFileSync(filePath);
        const storagePath = `defaults/${type}.jpg`;

        console.log(`Uploading ${fileName} to ${storagePath}...`);
        const { error: uploadError } = await supabase.storage
            .from('facility-images')
            .upload(storagePath, fileBuffer, {
                contentType: 'image/jpeg',
                upsert: true
            });

        if (uploadError) {
            console.error(`Failed to upload ${fileName}:`, uploadError);
            continue;
        }

        const { data: { publicUrl } } = supabase.storage
            .from('facility-images')
            .getPublicUrl(storagePath);

        storageMap[type] = publicUrl;
        console.log(`Sorted URL for ${type}: ${publicUrl}`);
    }

    // 2. Update DB
    // Sangjo
    if (storageMap['sangjo']) {
        console.log(`Updating 'sangjo' facilities with null images...`);
        const { data: sangjoData, error: sangjoError } = await supabase
            .from('memorial_spaces')
            .update({ image_url: storageMap['sangjo'] })
            .eq('type', 'sangjo')
            .is('image_url', null)
            .select();

        if (sangjoError) console.error(sangjoError);
        else console.log(`Updated ${sangjoData.length} sangjo facilities.`);
    }
}

uploadAndSetDefaults();
