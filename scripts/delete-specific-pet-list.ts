
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

async function deleteSpecificFacilities() {
    const targets = [
        '씨디에스에스이',
        '한국장례복지협회',
        '강남반려동물서비스',
        '영남반려동물힐링센터',
        '반려동물 강아지상조',
        '강아지친구'
    ];

    console.log('Searching for facilities to delete:', targets);

    // 1. Check which ones exist
    const { data: found, error: findError } = await supabase
        .from('memorial_spaces')
        .select('id, name')
        .in('name', targets);

    if (findError) {
        console.error('Error finding facilities:', findError);
        return;
    }

    if (!found || found.length === 0) {
        console.log('✅ None of the specified facilities were found (they might have been already deleted).');
        return;
    }

    console.log(`Found ${found.length} facilities to delete:`);
    found.forEach(f => console.log(`- ${f.name} (ID: ${f.id})`));

    // 2. Delete them
    const idsToDelete = found.map(f => f.id);
    const { error: deleteError } = await supabase
        .from('memorial_spaces')
        .delete()
        .in('id', idsToDelete);

    if (deleteError) {
        console.error('Error deleting facilities:', deleteError);
    } else {
        console.log(`\n✅ Successfully deleted ${idsToDelete.length} facilities.`);
    }
}

deleteSpecificFacilities();
