const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function checkMappingFC6() {
    const { data: facData, error: facError } = await supabase
        .from('facilities')
        .select('id, name')
        .eq('type', '상조')
        .ilike('name', '%부모사랑%');

    console.log('Matches for 부모사랑 in facilities:', facData);
}

checkMappingFC6();
