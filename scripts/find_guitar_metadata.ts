import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function findGuitar() {
    // Search in name, description, address, type
    const { data: facilities, error } = await supabase
        .from('memorial_spaces')
        .select('*')
        .or('name.ilike.%기타%,description.ilike.%기타%,address.ilike.%기타%,type.ilike.%기타%');

    if (error) {
        console.error(error);
        return;
    }

    console.log(`Found ${facilities?.length || 0} items with '기타' in metadata.`);
    facilities?.slice(0, 10).forEach(f => console.log(`${f.name} | ${f.type} | Image: ${f.image_url}`));
}

findGuitar();
