import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!);

async function update() {
    const { error } = await supabase
        .from('memorial_spaces')
        .update({ image_url: 'https://placehold.co/600x400/ededed/1a1a1a/png?text=Samsung+Development' })
        .eq('id', 2311);

    if (error) console.error('Error:', error);
    else console.log('✅ Updated Samsung Development Image!');
}

update();
