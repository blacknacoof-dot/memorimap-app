import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSpecifics() {
    const names = ['쓰담별', '납골당', '프리드라이프'];
    console.log('--- Checking Specific Facilities ---');

    for (const name of names) {
        const { data, error } = await supabase
            .from('memorial_spaces')
            .select('id, name, type, image_url')
            .ilike('name', `%${name}%`);

        if (data) {
            data.forEach(f => console.log(`[${f.id}] ${f.name} (${f.type}): ${f.image_url}`));
        }
    }

    console.log('\n--- Searching for ANY "guitar" or "기타" in image_url ---');
    const { data: guitarData } = await supabase
        .from('memorial_spaces')
        .select('id, name, image_url')
        .or('image_url.ilike.%guitar%,image_url.ilike.%기타%');

    guitarData?.forEach(f => console.log(`MATCH: [${f.id}] ${f.name}: ${f.image_url}`));
}

checkSpecifics();
