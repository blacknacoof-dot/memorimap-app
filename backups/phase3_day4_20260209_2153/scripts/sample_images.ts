import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function sampleImages() {
    const { data: facilities, error } = await supabase
        .from('memorial_spaces')
        .select('name, type, image_url')
        .limit(20);

    if (error) {
        console.error(error);
        return;
    }

    facilities.forEach(f => console.log(`${f.name} | ${f.type} | ${f.image_url}`));
}

sampleImages();
