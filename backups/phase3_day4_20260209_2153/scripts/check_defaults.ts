import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDefaults() {
    const { data: facilities, error } = await supabase
        .from('memorial_spaces')
        .select('image_url');

    if (error) {
        console.error(error);
        return;
    }

    const defaultCount = facilities.filter(f => f.image_url && f.image_url.includes('defaults/')).length;
    console.log(`Facilities using default images: ${defaultCount} / ${facilities.length}`);
}

checkDefaults();
