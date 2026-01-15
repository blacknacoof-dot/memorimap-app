
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugFacilityImage() {
    const searchTerm = '통일로추모공원';
    console.log(`Searching for: ${searchTerm}...`);

    const { data, error } = await supabase
        .from('facilities')
        .select('id, name, category, images')
        .ilike('name', `%${searchTerm}%`);

    if (error) {
        console.error('Error fetching data:', error);
        return;
    }

    if (!data || data.length === 0) {
        console.log('No facility found.');
        return;
    }

    console.log('Found Facilities:', data.length);
    data.forEach((f: any) => {
        console.log('---------------------------------------------------');
        console.log(`Name: ${f.name}`);
        console.log(`Category: ${f.category}`);
        console.log(`Images (Array):`, f.images);
        console.log(`Legacy Image URL (x_image_url):`, f.x_image_url);
        // Also check if 'image_url' exists (it might have been dropped or renamed?)
        // We will try to select * to be sure
    });
}

// Also fetch one random record to see general structure
async function checkRandomRecord() {
    console.log('\n--- Checking one random record for schema confirmation ---');
    const { data } = await supabase.from('facilities').select('*').limit(1);
    if (data && data.length > 0) {
        const f = data[0];
        console.log('Keys available:', Object.keys(f));
        console.log('Images:', f.images);
    }
}

async function run() {
    await debugFacilityImage();
    await checkRandomRecord();
}

run();
