
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const LOCAL_IMAGE_DIR = String.raw`C:\Users\black\Desktop\memorimap\data\상조서비스 이미지_최적화\상조회사 대표이미지`;

async function main() {
    // 1. DELETE Section
    const deleteTargets = ['새부산상조', '에이치디투어존'];
    console.log(`🗑️  Starting deletion for: ${deleteTargets.join(', ')}`);

    for (const name of deleteTargets) {
        const { error } = await supabase
            .from('facilities')
            .delete()
            .ilike('name', `%${name}%`);

        if (error) console.error(`   ❌ Failed to delete ${name}:`, error.message);
        else console.log(`   ✅ Deleted (lines matching) ${name}`);
    }

    // 2. UPDATE IMAGES Section
    console.log(`\n🔄 Starting image updates for remaining targets...`);

    // Explicit targets for image update
    const updateTargets = [
        { key: '예다함', namePart: '예다함' },      // Matches "The-K 예다함상조"
        { key: '보람상조', namePart: '보람상조 (Boram' }, // Matches "보람상조 (Boram Sangjo)"
        { key: '상조114', namePart: '상조114' }
    ];

    if (!fs.existsSync(LOCAL_IMAGE_DIR)) {
        console.error(`❌ Image directory not found: ${LOCAL_IMAGE_DIR}`);
        return;
    }
    const files = fs.readdirSync(LOCAL_IMAGE_DIR);

    // Fetch all Sangjo
    const { data: facilities, error } = await supabase
        .from('facilities')
        .select('id, name, image_url')
        .or('type.eq.sangjo,type.eq.상조');

    if (error) {
        console.error('Error fetching facilities:', error);
        return;
    }

    for (const t of updateTargets) {
        const matches = facilities.filter(f => f.name.includes(t.namePart));

        if (matches.length === 0) {
            console.log(`   ⚠️ No DB record for target: ${t.key}`);
            continue;
        }

        for (const facility of matches) {
            // Find matched file
            let matchedFile = files.find(f => f.includes(t.key));

            if (matchedFile) {
                await uploadAndUpdate(facility, matchedFile);
            } else {
                console.warn(`   ❌ Missing file for ${facility.name} (Expected key: ${t.key})`);
            }
        }
    }
}

async function uploadAndUpdate(facility: any, filename: string) {
    const filePath = path.join(LOCAL_IMAGE_DIR, filename);
    const fileBuffer = fs.readFileSync(filePath);

    // Use UUID filename
    const fileExtension = path.extname(filename);
    const safeFilename = `${facility.id}${fileExtension}`;
    const storagePath = `sangjo/${safeFilename}`;

    // console.log(`   Uploading ${filename} -> ${storagePath}...`);

    const { error: uploadError } = await supabase
        .storage
        .from('facility-images')
        .upload(storagePath, fileBuffer, { contentType: 'image/jpeg', upsert: true });

    if (uploadError) {
        console.error(`   ❌ Upload failed:`, uploadError.message);
        return;
    }

    const { data: { publicUrl } } = supabase.storage.from('facility-images').getPublicUrl(storagePath);
    const finalUrl = `${publicUrl}?t=${Date.now()}`;

    const { error: updateError } = await supabase
        .from('facilities')
        .update({ image_url: finalUrl })
        .eq('id', facility.id);

    if (!updateError) {
        console.log(`   ✨ Updated image for: ${facility.name}`);
    } else {
        console.error(`   ❌ DB Update failed for ${facility.name}:`, updateError.message);
    }
}

main().catch(console.error);
