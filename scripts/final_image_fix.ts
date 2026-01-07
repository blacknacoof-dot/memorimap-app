import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const DEFAULT_IMAGES: Record<string, string> = {
    funeral: 'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/defaults/funeral.jpg',
    charnel: 'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/defaults/charnel.jpg',
    natural: 'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/defaults/natural.jpg',
    park: 'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/defaults/park.jpg',
    complex: 'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/defaults/complex.jpg',
    pet: 'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/defaults/pet.jpg',
    sea: 'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/defaults/sea.jpg',
    sangjo: 'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/defaults/funeral.jpg' // Use funeral as fallback for sangjo
};

async function fixAll() {
    console.log('--- Starting Final Image Fix ---');

    const { data: facilities, error } = await supabase
        .from('memorial_spaces')
        .select('id, name, type, image_url');

    if (error) {
        console.error(error);
        return;
    }

    const toUpdate = facilities.filter(f =>
        !f.image_url ||
        f.image_url === '' ||
        f.image_url.includes('placeholder') ||
        f.image_url.includes('placehold.it') ||
        f.image_url.includes('placehold.co') ||
        f.image_url.includes('unsplash')
    );

    console.log(`Found ${toUpdate.length} facilities needing updates.`);

    for (const f of toUpdate) {
        const defaultUrl = DEFAULT_IMAGES[f.type] || DEFAULT_IMAGES.funeral;
        console.log(`Updating ${f.name} (${f.type}) -> ${defaultUrl}`);

        const { error: updateError } = await supabase
            .from('memorial_spaces')
            .update({ image_url: defaultUrl })
            .eq('id', f.id);

        if (updateError) {
            console.error(`Error updating ${f.name}:`, updateError);
        }
    }

    console.log('--- Final Image Fix Complete ---');
}

fixAll();
