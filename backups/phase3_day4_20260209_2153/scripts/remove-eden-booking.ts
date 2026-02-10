
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function removeEdenBooking() {
    console.log('Update Eden Paradise booking URL to null...');

    const { data, error } = await supabase
        .from('memorial_spaces')
        .update({ naver_booking_url: null })
        .eq('id', 3)
        .select();

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Update Result:', data);
        if (data && data.length > 0) {
            console.log('Success! New value:', data[0].naver_booking_url);
        } else {
            console.log('Warning: No rows updated. Check RLS policies or ID.');
        }
    }
}

removeEdenBooking();
