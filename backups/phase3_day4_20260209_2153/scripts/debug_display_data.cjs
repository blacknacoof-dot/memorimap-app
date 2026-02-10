const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const dotenv = require('dotenv');

const envPath = path.resolve(__dirname, '../.env.local');
dotenv.config({ path: envPath });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function inspectData() {
    console.log('--- Checking Sangjo Counts ---');
    // Check exact string match
    const { count: countSangjo, error: countError } = await supabase
        .from('memorial_spaces')
        .select('*', { count: 'exact', head: true })
        .eq('category', '상조');

    console.log(`Count of category='상조': ${countSangjo}`);

    // Check loose match in case of space
    const { count: countLike, error: likeError } = await supabase
        .from('memorial_spaces')
        .select('*', { count: 'exact', head: true })
        .ilike('category', '%상조%');

    console.log(`Count of category like '%상조%': ${countLike}`);


    console.log('\n--- Inspecting Sangjo Data Details ---');
    if (countLike > 0) {
        const { data: sangjoData, error: sangjoError } = await supabase
            .from('memorial_spaces')
            .select('id, name, category, image_url, description, review_count, rating')
            .ilike('category', '%상조%')
            .limit(3);

        if (sangjoError) console.error('Sangjo Error:', sangjoError);
        else console.table(sangjoData);
    }

    console.log('\n--- Inspecting Funeral Home Data ---');
    // Removed 'images' column as it apparently doesn't exist
    const { data: funeralData, error: funeralError } = await supabase
        .from('memorial_spaces')
        .select('id, name, category, image_url, gallery_images')
        .eq('category', '장례식장')
        .limit(3);

    if (funeralError) console.error('Funeral Error:', funeralError);
    else {
        funeralData.forEach(f => {
            console.log(`\nName: ${f.name}`);
            console.log(`Image URL: ${f.image_url}`);
            console.log(`Gallery Images:`, f.gallery_images ? JSON.stringify(f.gallery_images).substring(0, 100) + '...' : 'NULL');
        });
    }
}

inspectData();
