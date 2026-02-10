import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log('--- 1. Checking Preed Life (프리드라이프) ---');
    const { data: preed } = await supabase
        .from('memorial_spaces')
        .select('id, name, type, image_url')
        .eq('name', '프리드라이프');
    console.log(JSON.stringify(preed, null, 2));

    console.log('\n--- 2. Checking Current Image URLs for Samples ---');
    const { data: samples } = await supabase
        .from('memorial_spaces')
        .select('id, name, type, image_url')
        .limit(20);

    samples?.forEach(s => {
        console.log(`${s.name} (${s.type}): ${s.image_url}`);
    });

    console.log('\n--- 3. Checking Specific IDs (24, 886284015, 1014) ---');
    const { data: specificCheck } = await supabase
        .from('memorial_spaces')
        .select('*')
        .in('id', [24, 886284015, 1014]);
    console.log(JSON.stringify(specificCheck, null, 2));

    console.log('\n--- 5. Checking for Placeholder/Guitar strings ---');
    const { data: guitarCheck, error: guitarErr } = await supabase
        .from('memorial_spaces')
        .select('id, name, type, image_url')
        .or('image_url.ilike.%guitar%,image_url.ilike.%placeholder%,image_url.ilike.%uploaded%,image_url.ilike.%brain%,image_url.ilike.%gemini%');

    if (guitarErr) console.error(guitarErr);
    else console.log(`Found ${guitarCheck?.length || 0} items with placeholder/guitar in URL.`);

    if (guitarCheck && guitarCheck.length > 0) {
        console.log('Guitar matches:', JSON.stringify(guitarCheck, null, 2));
    }
}

run();
