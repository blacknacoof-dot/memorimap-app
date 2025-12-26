
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseKey = envConfig.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function deletePetServices() {
    console.log('Deleting Pet "Service" and "Association" entries...');

    const { data, error } = await supabase
        .from('memorial_spaces')
        .delete()
        .eq('type', 'pet')
        .or('name.ilike.%협회%,name.ilike.%서비스%')
        .select('name');

    if (error) {
        console.error('Error deleting facilities:', error);
    } else {
        console.log(`✅ Successfully deleted ${data.length} entries:`);
        data.forEach(f => console.log(`   - ${f.name}`));
    }
}

deletePetServices();
