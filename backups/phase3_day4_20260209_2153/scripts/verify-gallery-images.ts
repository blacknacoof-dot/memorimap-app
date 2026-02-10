import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyGalleryImages() {
    console.log('🔍 Verifying gallery images in database...\n');

    // Fetch a few companies to check their gallery_images
    const { data: companies, error } = await supabase
        .from('funeral_companies')
        .select('id, name, image_url, gallery_images')
        .limit(5);

    if (error) {
        console.error('❌ Error:', error.message);
        return;
    }

    console.log(`Found ${companies?.length} companies:\n`);

    companies?.forEach((company, index) => {
        console.log(`${index + 1}. ${company.name}`);
        console.log(`   Main image: ${company.image_url || 'None'}`);
        console.log(`   Gallery images: ${company.gallery_images?.length || 0} images`);
        if (company.gallery_images && company.gallery_images.length > 0) {
            company.gallery_images.forEach((img: string, i: number) => {
                console.log(`      ${i + 1}. ${img}`);
            });
        }
        console.log('');
    });
}

verifyGalleryImages();
