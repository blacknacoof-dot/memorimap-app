
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPetFacilities() {
    console.log('Checking for pet facilities in memorial_spaces...');

    // Check keywords in name
    const { data, error } = await supabase
        .from('memorial_spaces')
        .select('id, name, category, address') // checking 'category' column
        .or('name.ilike.%펫%,name.ilike.%동물%,name.ilike.%강아지%,name.ilike.%21그램%')
        .limit(20);

    if (error) {
        console.error('Error fetching:', error);
        return;
    }

    console.log(`Found ${data.length} potential pet facilities.`);
    data.forEach(f => {
        console.log(`[${f.id}] ${f.name} | Category: ${f.category}`);
    });

    // Also check unique categories currently in use
    const { data: categories, error: catError } = await supabase
        .from('memorial_spaces')
        .select('category');

    if (!catError && categories) {
        const uniqueCats = [...new Set(categories.map(c => c.category))];
        console.log('\nExisting Categories:', uniqueCats);
    }
}

checkPetFacilities();
