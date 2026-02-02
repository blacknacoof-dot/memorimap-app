
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

// Load env variables
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });
const envLocalPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envLocalPath });


const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase URL or Service Role Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    const localDir = 'C:\\Users\\black\\Desktop\\memorimap\\data\\상조서비스 이미지_최적화\\상조회사 대표이미지';
    const fileName = '착한상조.JPG';
    const filePath = path.join(localDir, fileName);

    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        return;
    }

    const fileContent = fs.readFileSync(filePath);
    const targetFileName = `good_sangjo_${Date.now()}.jpg`; // Unique name
    const storagePath = `sangjo/${targetFileName}`;

    console.log(`Uploading ${fileName} to ${storagePath}...`);

    const { data, error } = await supabase.storage
        .from('facility-images')
        .upload(storagePath, fileContent, {
            contentType: 'image/jpeg',
            upsert: true
        });

    if (error) {
        console.error('Upload failed:', error);
        return;
    }

    const { data: { publicUrl } } = supabase.storage
        .from('facility-images')
        .getPublicUrl(storagePath);

    console.log(`Upload successful! Public URL: ${publicUrl}`);
}

main();
