import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// Load environment variables explicitly
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function findAndRemove() {
    const address = '경기 구리시 건원대로34번길 27';
    console.log(`Searching for facility at: ${address}`);

    // Fuzzy search because address might slightly differ
    const { data: facilities, error } = await supabase
        .from('memorial_spaces')
        .select('*')
        .ilike('address', `%건원대로34번길 27%`);

    if (error) {
        console.error('Error searching:', error);
        return;
    }

    if (facilities && facilities.length > 0) {
        for (const f of facilities) {
            console.log(`Found: [${f.id}] ${f.name} (${f.address}) - Type: ${f.type}`);

            // Delete it
            const { error: deleteError } = await supabase
                .from('memorial_spaces')
                .delete()
                .eq('id', f.id);

            if (deleteError) {
                console.error(`Failed to delete ${f.name}:`, deleteError);
            } else {
                console.log(`Successfully deleted: ${f.name}`);
            }
        }
    } else {
        console.log('No facility found with that address.');
    }
}

findAndRemove();
