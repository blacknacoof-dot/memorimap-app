
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
);

async function deleteDuplicate() {
    const idToDelete = '21323858';
    console.log(`Deleting duplicate facility ID: ${idToDelete}...`);

    const { error } = await supabase
        .from('memorial_spaces')
        .delete()
        .eq('id', idToDelete);

    if (error) {
        console.error('Error deleting:', error);
    } else {
        console.log('Successfully deleted duplicate facility.');
    }
}

deleteDuplicate();
