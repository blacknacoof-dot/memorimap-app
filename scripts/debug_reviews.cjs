const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const dotenv = require('dotenv');

const envPath = path.resolve(__dirname, '../.env.local');
dotenv.config({ path: envPath });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function inspectReviews() {
    console.log('--- Inspecting Reviews ---');
    // Check reviews with images
    const { data, error } = await supabase
        .from('reviews')
        .select('id, content, images')
        .not('images', 'is', null)
        .limit(5);

    if (error) {
        console.error('Review Error:', error);
    } else {
        if (data.length === 0) {
            console.log('No reviews found with images.');
            return;
        }
        data.forEach(r => {
            console.log(`Review ID: ${r.id}`);
            console.log(`Content: ${r.content}`);
            console.log(`Images:`, r.images);
            if (Array.isArray(r.images)) {
                console.log(`Images is Array, length: ${r.images.length}`);
            } else {
                console.log(`Images type: ${typeof r.images}`);
            }
        });
    }
}

inspectReviews();
