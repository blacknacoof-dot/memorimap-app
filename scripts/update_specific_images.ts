
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!);

const IMAGE_DIR = 'C:\\Users\\black\\Desktop\\memorimap\\data\\상조서비스 이미지_최적화\\상조회사 대표이미지';

async function uploadImage(localFilename: string, storageFilename: string) {
    const filePath = path.join(IMAGE_DIR, localFilename);
    if (!fs.existsSync(filePath)) {
        console.error(`❌ File not found: ${filePath}`);
        return null;
    }

    const fileBuffer = fs.readFileSync(filePath);
    const { data, error } = await supabase.storage
        .from('facility-images')
        .upload(`sangjo/${storageFilename}`, fileBuffer, {
            contentType: 'image/jpeg',
            upsert: true
        });

    if (error) {
        console.error(`❌ Upload failed for ${localFilename}:`, error);
        return null;
    }

    const { data: { publicUrl } } = supabase.storage
        .from('facility-images')
        .getPublicUrl(`sangjo/${storageFilename}`);

    // Add timestamp to force cache bust if needed in UI, though getPublicUrl doesn't inherently add it
    const publicUrlWithAuth = `${publicUrl}?t=${Date.now()}`;
    console.log(`✅ Uploaded ${localFilename} -> ${publicUrlWithAuth}`);
    return publicUrlWithAuth;
}

async function main() {
    console.log('🚀 Starting specific image updates...');

    // 3. Promise of 3 Days
    await uploadImage('3일의 약속.JPG', 'promise_3days.JPG');
}

main();
