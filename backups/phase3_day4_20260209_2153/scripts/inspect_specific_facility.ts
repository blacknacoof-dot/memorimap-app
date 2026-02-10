
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFacility() {
    const searchTerm = '일산백장례';
    console.log(`Searching for facilities containing: ${searchTerm}`);

    const { data, error } = await supabase
        .from('facilities')
        .select('*')
        .ilike('name', `%${searchTerm}%`);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`Found ${data.length} facilities:`);
    data.forEach(f => {
        console.log('------------------------------------------------');
        console.log(`ID: ${f.id}`);
        console.log(`Name: ${f.name}`);
        console.log(`Type: [${f.type}]`);
        console.log(`Category: [${f.category}]`);
        console.log(`Raw Object Keys:`, Object.keys(f));
    });
}

checkFacility();
