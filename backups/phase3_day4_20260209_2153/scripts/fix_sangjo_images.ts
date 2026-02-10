
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase URL or Service Role Key in .env.local');
    process.exit(1);
}

// Use Service Role to bypass RLS for administrative fixes
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const LOCAL_IMAGE_DIR = String.raw`C:\Users\black\Desktop\memorimap\data\상조서비스 이미지_최적화\상조회사 대표이미지`;

const TARGET_MAP: Record<string, string> = {
    '새부산상조': '새부산상조.JPG', // File check needed
    '예다함': '예다함상조.JPG', // "The-K 예다함상조" -> "예다함상조.JPG"
    '보람상조': '보람상조.JPG',
    '상조114': '상조114.JPG'
};

async function main() {
    console.log(`🔍 Checking directory: ${LOCAL_IMAGE_DIR}`);
    if (!fs.existsSync(LOCAL_IMAGE_DIR)) return;

    const files = fs.readdirSync(LOCAL_IMAGE_DIR);
    // console.log(`📂 Found ${files.length} files.`);

    // 1. Fetch current Sangjo facilities
    const { data: facilities, error } = await supabase
        .from('facilities')
        .select('id, name, image_url')
        .or('type.eq.sangjo,type.eq.상조');

    if (error) { console.error(error); return; }

    // 2. Process specific targets
    const targets = [
        { key: '예다함', namePart: '예다함' }, // Matches "The-K 예다함상조"
        { key: '보람상조', namePart: '보람상조 (Boram' }, // Strict match for Main Boram
        { key: '상조114', namePart: '상조114' },
        { key: '새부산', namePart: '새부산' }
    ];

    for (const t of targets) {
        // Find facility
        const facilitiesToUpdate = facilities.filter(f => f.name.includes(t.namePart));

        if (facilitiesToUpdate.length === 0) {
            console.log(`⚠️ Database entry not found for: ${t.key} (checked '${t.namePart}')`);
            continue;
        }

        for (const facility of facilitiesToUpdate) {
            // Find file
            // Logic: "예다함" -> "예다함상조.JPG" (Found via includes)
            // "보람상조" -> "보람상조.JPG"
            let matchedFile = files.find(f => f.includes(t.key));

            if (!matchedFile) {
                // Try removing "상조" from Key? 
                // "새부산" -> "새부산상조.JPG" ?
                matchedFile = files.find(f => f.includes(t.key.replace('상조', '')));
            }

            if (matchedFile) {
                console.log(`✅ MATCH: "${facility.name}" -> File: "${matchedFile}"`);
                await uploadAndUpdate(facility, matchedFile);
            } else {
                console.warn(`❌ FILE MISSING for: "${facility.name}". Expected file containing "${t.key}" in ${LOCAL_IMAGE_DIR}`);
                // Check if fuzzy match possible?
            }
        }
    }
}

async function uploadAndUpdate(facility: any, filename: string) {
    const filePath = path.join(LOCAL_IMAGE_DIR, filename);
    const fileBuffer = fs.readFileSync(filePath);

    // [FIX] Use UUID to safely store Korean filenames
    const fileExtension = path.extname(filename);
    const safeFilename = `${facility.id}${fileExtension}`;
    const storagePath = `sangjo/${safeFilename}`;

    // console.log(`   Uploading ${filename}...`);

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
        console.log(`   ✨ Updated DB: ${facility.name}`);
    }
}

main().catch(console.error);
