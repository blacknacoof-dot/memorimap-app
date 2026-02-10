import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
);

async function fixPreedlife() {
    console.log('🚑 Fixing Preedlife Category & Images in both tables...');

    // 1. Get latest Sangjo default image
    const { data: files } = await supabase.storage.from('facility-images').list('defaults', {
        search: 'sangjo',
        sortBy: { column: 'created_at', order: 'desc' },
    });

    let sangjoImageUrl = null;
    if (files && files.length > 0) {
        const latestFile = files.find(f => f.name.includes('sangjo') && !f.name.includes('.empty')) || files[0];
        const { data } = supabase.storage
            .from('facility-images')
            .getPublicUrl(`defaults/${latestFile.name}`);
        sangjoImageUrl = data.publicUrl;
        console.log(`✅ Found Sangjo Image: ${latestFile.name}`);
    }

    const targetKeyword = '프리드라이프';

    // 2. Fix memorial_spaces (type column) - 'sangjo' IS allowed here
    console.log('\nUpdating memorial_spaces...');
    const { error: msErr, data: msData } = await supabase
        .from('memorial_spaces')
        .update({
            type: 'sangjo',
            ...(sangjoImageUrl && { image_url: sangjoImageUrl })
        })
        .ilike('name', `%${targetKeyword}%`)
        .select('id, name');

    if (msErr) console.error('❌ memorial_spaces error:', msErr.message);
    else console.log(`✨ Updated memorial_spaces for: ${msData?.map(d => d.name).join(', ')}`);

    // 3. Fix facilities (images array column) - category update might fail, so we focus on images
    console.log('\nUpdating facilities...');
    const { error: facErr, data: facData } = await supabase
        .from('facilities')
        .update({
            // category: 'sangjo', // Skip this to avoid constraint error
            ...(sangjoImageUrl && { images: [sangjoImageUrl] })
        })
        .ilike('name', `%${targetKeyword}%`)
        .select('id, name');

    if (facErr) console.error('❌ facilities error:', facErr.message);
    else console.log(`✨ Updated facilities for: ${facData?.map(d => d.name).join(', ')}`);

    console.log('\n🎉 Preedlife Fix Complete!');
}

fixPreedlife();
