
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://xvmpvzldezpoxxsarizm.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2bXB2emxkZXpwb3h4c2FyaXptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NTEwMTksImV4cCI6MjA4MTQyNzAxOX0.TC-SJKzTRANjoLiRi2yg_EHu6xLer2wr-RaJ4AWIv04';

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteDuplicate() {
    const badId = 12216118;
    console.log(`Attempting to delete facility ID: ${badId}`);

    // OPTIONAL: Check for dependent records (reviews, reservations)
    // But strictly per user request, we proceed to delete.

    const { error } = await supabase
        .from('memorial_spaces')
        .delete()
        .eq('id', badId);

    if (error) {
        console.error('Error deleting facility:', error);
    } else {
        console.log('Successfully deleted facility.');
    }
}

deleteDuplicate();
