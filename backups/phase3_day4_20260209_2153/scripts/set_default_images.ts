import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const DATA_DIR = 'c:/Users/black/Desktop/memorimap/data';
const BUCKET = 'facility-images';

const imageMap = [
    { file: '장례식장 대표이미지.jpg', type: 'funeral', storagePath: 'defaults/funeral.jpg' },
    { file: '봉안시설 대표이미지.jpg', type: 'charnel', storagePath: 'defaults/charnel.jpg' },
    { file: '자연장 대표이미지.jpg', type: 'natural', storagePath: 'defaults/natural.jpg' },
    { file: '공원묘지 대표이미지.jpg', type: 'park', storagePath: 'defaults/park.jpg' },
    { file: '동물장례 대표이미지.jpg', type: 'pet', storagePath: 'defaults/pet.jpg' },
    { file: '해양장 대표이미지.jpg', type: 'sea', storagePath: 'defaults/sea.jpg' },
    { file: '공원묘지 대표이미지.jpg', type: 'complex', storagePath: 'defaults/complex.jpg' },
];

async function run() {
    console.log('--- Starting Default Image Assignment ---');

    for (const item of imageMap) {
        const localPath = path.join(DATA_DIR, item.file);
        if (!fs.existsSync(localPath)) {
            console.warn(`File not found: ${localPath}`);
            continue;
        }

        console.log(`Uploading ${item.file} to ${item.storagePath}...`);
        const fileBuffer = fs.readFileSync(localPath);
        const { error: uploadError } = await supabase.storage
            .from(BUCKET)
            .upload(item.storagePath, fileBuffer, {
                contentType: 'image/jpeg',
                upsert: true
            });

        if (uploadError) {
            console.error(`Upload error for ${item.file}:`, uploadError);
            continue;
        }

        const { data: { publicUrl } } = supabase.storage
            .from(BUCKET)
            .getPublicUrl(item.storagePath);

        console.log(`Public URL: ${publicUrl}`);

        // Update database
        console.log(`Updating ${item.type} facilities with missing images...`);

        // Find facilities of this type that have no image or placeholder
        const { data: facilities, error: fetchError } = await supabase
            .from('memorial_spaces')
            .select('id, image_url')
            .eq('type', item.type);

        if (fetchError) {
            console.error(`Error fetching ${item.type} facilities:`, fetchError);
            continue;
        }

        const toUpdate = facilities.filter(f =>
            !f.image_url ||
            f.image_url === '' ||
            f.image_url.includes('via.placeholder.com') ||
            f.image_url.includes('placeholder')
        );

        console.log(`Found ${toUpdate.length} facilities to update for type ${item.type}.`);

        if (toUpdate.length > 0) {
            const { error: updateError } = await supabase
                .from('memorial_spaces')
                .update({ image_url: publicUrl })
                .in('id', toUpdate.map(f => f.id));

            if (updateError) {
                console.error(`Error updating facilities for ${item.type}:`, updateError);
            } else {
                console.log(`Successfully updated ${toUpdate.length} facilities.`);
            }
        }
    }

    console.log('--- Finished Default Image Assignment ---');
}

run();
