
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Fix for .env.local loading
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFacility(nameQuery: string) {
    console.log(`Searching for facility: ${nameQuery}`);

    const { data, error } = await supabase
        .from('memorial_spaces')
        .select('*')
        .ilike('name', `%${nameQuery}%`);

    if (error) {
        console.error('Error fetching facility:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log(`Found ${data.length} matches:`);
        data.forEach(f => {
            console.log('---');
            console.log(`ID: ${f.id}`);
            console.log(`Name: ${f.name}`);
            console.log(`Address: ${f.address}`);
            console.log(`Updated At: ${f.updated_at || 'N/A'}`);
            console.log(`Created At: ${f.created_at || 'N/A'}`);
        });
    } else {
        console.log('No facility found matching that name.');
    }
}

checkFacility('고려대안산');
