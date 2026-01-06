const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);  // Use service role if available for reliable count, or anon

async function check() {
    const { count, error } = await supabase
        .from('memorial_spaces')
        .select('*', { count: 'exact', head: true })
        .not('lat', 'is', null);

    if (error) console.error(error);
    else console.log(`Facilities with Coordinates: ${count}`);

    const { count: total } = await supabase
        .from('memorial_spaces')
        .select('*', { count: 'exact', head: true });

    console.log(`Total Facilities: ${total}`);
    console.log(`Progress: ${((count / total) * 100).toFixed(1)}%`);
}

check();
