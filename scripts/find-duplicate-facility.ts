
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

async function findDuplicate() {
    const name = '한림대학교한강성심병원 장례식장';
    console.log(`Searching for: ${name}`);

    const { data, error } = await supabase
        .from('memorial_spaces')
        .select('*')
        .eq('name', name);

    if (error) {
        console.error('Error fetching facilities:', error);
        return;
    }

    console.log(`Found ${data.length} records:`);
    data.forEach(f => {
        console.log(`ID: ${f.id}, Name: ${f.name}, ImageUrl: ${f.image_url}, Address: ${f.address}`);
    });
}

findDuplicate();
