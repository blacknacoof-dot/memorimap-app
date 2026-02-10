
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

async function findFacilitiesToDelete() {
    const { data: facilities, error } = await supabase
        .from('memorial_spaces')
        .select('id, name')
        .eq('type', 'pet')
        .or('name.ilike.%협회%,name.ilike.%서비스%');

    if (error) {
        console.error('Error fetching facilities:', error);
        return;
    }

    console.log('Found the following facilities that match exclusion criteria (Association/Service):');
    facilities.forEach(f => {
        console.log(`- [${f.id}] ${f.name}`);
    });

    console.log(`\nTotal count: ${facilities.length}`);
}

findFacilitiesToDelete();
