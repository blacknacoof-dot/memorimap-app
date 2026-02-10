
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSeongnam() {
    console.log('Checking facilities in Seongnam-si...');

    // 1. Keyword search (like the app does)
    const { data: textResults, error: textError } = await supabase.rpc('search_facilities_by_text', {
        p_text: '성남시',
        p_category: 'funeral_home'
    });

    if (textError) console.error('RPC Error:', textError);
    else console.log(`RPC '성남시' Results: ${textResults?.length}`);

    if (textResults && textResults.length > 0) {
        console.log('Sample Result:', textResults[0].name, textResults[0].address, textResults[0].category);
    } else {
        // 2. Direct DB Query if RPC fails
        const { data: dbResults, error: dbError } = await supabase
            .from('facilities')
            .select('id, name, address, category, type')
            .like('address', '%성남시%')
            .limit(5);

        if (dbError) console.error('DB Error:', dbError);
        else console.log(`Direct DB '성남시' Results:`, dbResults);
    }
}

checkSeongnam();
