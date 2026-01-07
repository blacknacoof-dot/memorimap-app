import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkImages() {
    console.log('--- Checking Image Status ---');

    const { data: facilities, error } = await supabase
        .from('memorial_spaces')
        .select('id, name, type, image_url');

    if (error) {
        console.error('Error:', error);
        return;
    }

    const missing = facilities.filter(f => !f.image_url || f.image_url === '');
    const placeholders = facilities.filter(f => f.image_url && (f.image_url.includes('placeholder') || f.image_url.includes('unsplash')));
    const otherInUrl = facilities.filter(f => f.image_url && f.image_url.includes('기타'));

    console.log(`Total facilities: ${facilities.length}`);
    console.log(`Missing images: ${missing.length}`);
    console.log(`Placeholder/Unsplash images: ${placeholders.length}`);
    console.log(`'기타' in image URL: ${otherInUrl.length}`);

    if (placeholders.length > 0) {
        console.log('\nTop 5 placeholders:');
        placeholders.slice(0, 5).forEach(f => console.log(`- ${f.name} (${f.type}): ${f.image_url}`));
    }

    if (otherInUrl.length > 0) {
        console.log("\nFacilities with '기타' in image URL:");
        otherInUrl.forEach(f => console.log(`- ${f.name}: ${f.image_url}`));
    }
}

checkImages();
