
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const UPDATES = [
    {
        searchName: '시안',
        urls: ['/images/facilities/sian/sian_1.jpg', '/images/facilities/sian/sian_2.jpg', '/images/facilities/sian/sian_3.jpg']
    },
    {
        searchName: '평온',
        urls: ['/images/facilities/yongin-pyeonon/yongin-pyeonon_1.jpg']
    },
    {
        searchName: '에덴낙원',
        urls: ['/images/facilities/eden/eden_1.jpg', '/images/facilities/eden/eden_2.jpg']
    }
];

async function updatePhotos() {
    console.log('Updating photos...\n');

    // Delete 재단법인 에덴낙원 first
    await supabase.from('memorial_spaces').delete().eq('id', 656);
    console.log('Deleted 재단법인 에덴낙원 (656)');

    for (const u of UPDATES) {
        const { data } = await supabase
            .from('memorial_spaces')
            .select('id, name')
            .ilike('name', `%${u.searchName}%`)
            .limit(1);

        if (data && data.length > 0) {
            const f = data[0];
            await supabase.from('memorial_spaces')
                .update({ image_url: u.urls[0], gallery_images: u.urls })
                .eq('id', f.id);
            console.log(`✅ ${f.name} (${f.id}): ${u.urls.length} photos`);
        } else {
            console.log(`❌ ${u.searchName}: not found`);
        }
    }
    console.log('\nDone!');
}

updatePhotos();
