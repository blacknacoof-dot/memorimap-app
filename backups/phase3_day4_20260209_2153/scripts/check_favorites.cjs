const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function checkFavorites() {
    console.log('--- Favorites Check Start ---');

    const { data: favSample, error: favError } = await supabase
        .from('user_likes_clerk')
        .select('*')
        .limit(1);

    if (favError) {
        console.error('Error fetching favorite sample:', favError);
    } else {
        if (favSample && favSample.length > 0) {
            console.log('❤️ user_likes_clerk columns:', Object.keys(favSample[0]));
            const { data: legacyFavs } = await supabase
                .from('user_likes_clerk')
                .select('facility_id')
                .ilike('facility_id', 'fc%')
                .limit(5);
            console.log('❤️ legacy facility_id samples in favorites:', legacyFavs);
        }
    }

    console.log('--- Favorites Check End ---');
}

checkFavorites();
