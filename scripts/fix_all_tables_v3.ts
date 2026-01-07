import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const DATA_DIR = 'C:/Users/black/Desktop/memorimap/data';
const BUCKET = 'facility-images';
const TIMESTAMP = Date.now();

const imageMap = [
    { file: '장례식장 대표이미지.jpg', type: 'funeral', storagePath: `defaults/funeral_v3_${TIMESTAMP}.jpg` },
    { file: '봉안시설 대표이미지.jpg', type: 'charnel', storagePath: `defaults/charnel_v3_${TIMESTAMP}.jpg` },
    { file: '자연장 대표이미지.jpg', type: 'natural', storagePath: `defaults/natural_v3_${TIMESTAMP}.jpg` },
    { file: '공원묘지 대표이미지.jpg', type: 'park', storagePath: `defaults/park_v3_${TIMESTAMP}.jpg` },
    { file: '동물장례 대표이미지.jpg', type: 'pet', storagePath: `defaults/pet_v3_${TIMESTAMP}.jpg` },
    { file: '해양장 대표이미지.jpg', type: 'sea', storagePath: `defaults/sea_v3_${TIMESTAMP}.jpg` },
];

async function run() {
    console.log('--- Starting Universal Image Fix (v3) ---');

    // 1. Upload defaults
    const urls: Record<string, string> = {};
    for (const item of imageMap) {
        const localPath = path.join(DATA_DIR, item.file);
        if (!fs.existsSync(localPath)) continue;
        const fileBuffer = fs.readFileSync(localPath);
        await supabase.storage.from(BUCKET).upload(item.storagePath, fileBuffer, { contentType: 'image/jpeg', upsert: true });
        const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(item.storagePath);
        urls[item.type] = publicUrl;
        console.log(`Uploaded ${item.type} -> ${publicUrl}`);
    }

    const isBadUrl = (url: string) => {
        if (!url) return true;
        const badPatterns = ['placeholder', 'placehold.it', 'placehold.co', 'unsplash', 'mediahub', 'noimage', 'guitar'];
        return badPatterns.some(p => url.toLowerCase().includes(p));
    };

    // 2. Fix memorial_spaces
    console.log('\nFixing memorial_spaces...');
    const { data: ms } = await supabase.from('memorial_spaces').select('id, name, type, image_url');
    for (const f of ms || []) {
        if (isBadUrl(f.image_url) || f.image_url.includes('defaults/')) {
            const newUrl = urls[f.type] || urls.funeral;
            await supabase.from('memorial_spaces').update({ image_url: newUrl }).eq('id', f.id);
            console.log(`   Updated [${f.id}] ${f.name}`);
        }
    }

    // 3. Fix facilities
    console.log('\nFixing facilities...');
    const { data: fac } = await supabase.from('facilities').select('id, name, category, image_url');
    for (const f of fac || []) {
        if (isBadUrl(f.image_url) || (f.image_url && f.image_url.includes('defaults/'))) {
            // Map category to type
            let type = 'charnel';
            if (f.category === 'funeral_hall') type = 'funeral';
            else if (f.category === 'charnel_house') type = 'charnel';
            else if (f.category === 'natural_burial') type = 'natural';
            else if (f.category === 'park_cemetery') type = 'park';
            else if (f.category === 'pet_funeral') type = 'pet';
            else if (f.category === 'sea_burial') type = 'sea';
            else if (f.category?.includes('sangjo')) type = 'funeral'; // Use funeral default for sangjo

            const newUrl = urls[type] || urls.funeral;
            await supabase.from('facilities').update({ image_url: newUrl }).eq('id', f.id);
            console.log(`   Updated [${f.id}] ${f.name}`);
        }
    }

    // 4. Clean up facility_images
    console.log('\nCleaning up facility_images...');
    const { data: images } = await supabase.from('facility_images').select('id, image_url');
    for (const img of images || []) {
        if (isBadUrl(img.image_url)) {
            console.log(`   Deleting bad image entry: ${img.image_url}`);
            await supabase.from('facility_images').delete().eq('id', img.id);
        }
    }

    console.log('\n--- Universal Fix Complete ---');
}

run();
