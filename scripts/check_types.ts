import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTypes() {
    const { data: facilities, error } = await supabase
        .from('memorial_spaces')
        .select('type, image_url');

    if (error) {
        console.error(error);
        return;
    }

    const typeStats: any = {};
    facilities.forEach(f => {
        const type = f.type || 'unknown';
        if (!typeStats[type]) {
            typeStats[type] = { total: 0, hasImage: 0, publicUrl: 0, placeholder: 0 };
        }
        typeStats[type].total++;
        if (f.image_url) {
            typeStats[type].hasImage++;
            if (f.image_url.includes('supabase.co')) typeStats[type].publicUrl++;
            if (f.image_url.includes('placeholder') || f.image_url.includes('unsplash')) typeStats[type].placeholder++;
        }
    });

    console.log('--- Type Stats ---');
    console.table(typeStats);
}

checkTypes();
