import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function findPlaceholders() {
    const { data: facilities, error } = await supabase
        .from('memorial_spaces')
        .select('id, name, type, image_url');

    if (error) {
        console.error(error);
        return;
    }

    const targets = facilities.filter(f =>
        !f.image_url ||
        f.image_url.includes('placeholder') ||
        f.image_url.includes('placehold.it') ||
        f.image_url.includes('placehold.co') ||
        f.image_url.includes('noimage') ||
        f.image_url.includes('기타') ||
        f.image_url.includes('unsplash')
    );

    console.log(`Found ${targets.length} targets.`);
    targets.slice(0, 20).forEach(t => console.log(`${t.name} (${t.type}): ${t.image_url}`));
}

findPlaceholders();
