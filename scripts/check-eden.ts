
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEden() {
    const { data, error } = await supabase
        .from('memorial_spaces')
        .select('id, name, naver_booking_url')
        .like('name', '%에덴낙원%');

    if (error) {
        console.error(error);
        return;
    }

    console.log('검색 결과:', data);
}

checkEden();
