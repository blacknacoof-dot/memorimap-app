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
    { file: '장례식장 대표이미지.jpg', type: 'funeral', storagePath: `defaults/funeral_final_${TIMESTAMP}.jpg` },
    { file: '봉안시설 대표이미지.jpg', type: 'charnel', storagePath: `defaults/charnel_final_${TIMESTAMP}.jpg` },
    { file: '자연장 대표이미지.jpg', type: 'natural', storagePath: `defaults/natural_final_${TIMESTAMP}.jpg` },
    { file: '공원묘지 대표이미지.jpg', type: 'park', storagePath: `defaults/park_final_${TIMESTAMP}.jpg` },
    { file: '동물장례 대표이미지.jpg', type: 'pet', storagePath: `defaults/pet_final_${TIMESTAMP}.jpg` },
    { file: '해양장 대표이미지.jpg', type: 'sea', storagePath: `defaults/sea_final_${TIMESTAMP}.jpg` },
];

function chunkArray<T>(array: T[], size: number): T[][] {
    const chunked: T[][] = [];
    for (let i = 0; i < array.length; i += size) chunked.push(array.slice(i, i + size));
    return chunked;
}

async function run() {
    console.log('--- Starting Universal Image Fix (v4 - FINAL) ---');

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

    // 2. Fix memorial_spaces (image_url column)
    console.log('\nProcessing memorial_spaces...');
    const { data: ms } = await supabase.from('memorial_spaces').select('id, type, image_url');
    const msGroups: Record<string, string[]> = {};
    for (const f of ms || []) {
        if (isBadUrl(f.image_url) || f.image_url.includes('defaults/')) {
            const targetUrl = urls[f.type] || urls.funeral;
            if (!msGroups[targetUrl]) msGroups[targetUrl] = [];
            msGroups[targetUrl].push(f.id);
        }
    }
    for (const [url, ids] of Object.entries(msGroups)) {
        for (const chunk of chunkArray(ids, 500)) {
            await supabase.from('memorial_spaces').update({ image_url: url }).in('id', chunk);
            console.log(`   Updated ${chunk.length} memorial_spaces -> ${url.split('/').pop()}`);
        }
    }

    // 3. Fix facilities (images array column)
    console.log('\nProcessing facilities...');
    const { data: facs } = await supabase.from('facilities').select('id, category, images');
    const facGroups: Record<string, string[]> = {};
    for (const f of facs || []) {
        const mainImage = f.images?.[0] || '';
        if (isBadUrl(mainImage) || mainImage.includes('defaults/')) {
            let type = 'charnel';
            if (f.category === 'funeral_hall') type = 'funeral';
            else if (f.category === 'charnel_house') type = 'charnel';
            else if (f.category === 'natural_burial') type = 'natural';
            else if (f.category === 'park_cemetery') type = 'park';
            else if (f.category === 'pet_funeral') type = 'pet';
            else if (f.category === 'sea_burial') type = 'sea';
            else if (f.category?.includes('sangjo')) type = 'funeral';

            const targetUrl = urls[type] || urls.funeral;
            if (!facGroups[targetUrl]) facGroups[targetUrl] = [];
            facGroups[targetUrl].push(f.id);
        }
    }
    for (const [url, ids] of Object.entries(facGroups)) {
        for (const chunk of chunkArray(ids, 500)) {
            await supabase.from('facilities').update({ images: [url] }).in('id', chunk);
            console.log(`   Updated ${chunk.length} facilities -> ${url.split('/').pop()}`);
        }
    }

    // 4. Clean up facility_images table
    console.log('\nCleaning up facility_images...');
    const { data: badImgs } = await supabase.from('facility_images').select('id, image_url');
    const idsToDelete = badImgs?.filter(i => isBadUrl(i.image_url)).map(i => i.id) || [];
    if (idsToDelete.length > 0) {
        for (const chunk of chunkArray(idsToDelete, 500)) {
            await supabase.from('facility_images').delete().in('id', chunk);
            console.log(`   Deleted ${chunk.length} bad entries from facility_images`);
        }
    }

    console.log('\n--- Universal Fix Complete ---');
}

run();
