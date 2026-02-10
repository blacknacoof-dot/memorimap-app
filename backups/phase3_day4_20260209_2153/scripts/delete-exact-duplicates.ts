
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Exact duplicates (same name, same address, SAME type)
const EXACT_DUPLICATES_TO_DELETE = [983, 982]; // Keep 36, 653

async function cleanDuplicates() {
    console.log('Deleting exact duplicates...');

    for (const id of EXACT_DUPLICATES_TO_DELETE) {
        const { error } = await supabase.from('memorial_spaces').delete().eq('id', id);
        if (error) {
            console.error(`Failed to delete ID ${id}:`, error);
        } else {
            console.log(`Deleted ID ${id}`);
        }
    }

    console.log('\nDone!');
}

cleanDuplicates();
