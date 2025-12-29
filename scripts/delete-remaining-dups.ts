
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

// Duplicates found: 제일장례식장 (160), 내리공설묘지 (444)
const DUPLICATES_TO_DELETE = [160, 444];

async function deleteDuplicates() {
    console.log('Deleting remaining duplicates...');

    for (const id of DUPLICATES_TO_DELETE) {
        const { error } = await supabase.from('memorial_spaces').delete().eq('id', id);
        if (error) console.error(`Failed to delete ID ${id}:`, error.message);
        else console.log(`Deleted ID ${id}`);
    }

    console.log('Done!');
}

deleteDuplicates();
