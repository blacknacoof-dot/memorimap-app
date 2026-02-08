
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const TARGET_ID = '666dc22b-24af-4114-8610-4c2b4ebf05c4';
const TARGET_NAME = '일산백장례서비스';
const NEW_TYPE = 'funeral_home';

async function updateCategory() {
    console.log(`Updating "${TARGET_NAME}" (${TARGET_ID})...`);

    // 1. Check before
    const { data: before, error: errBefore } = await supabase
        .from('facilities')
        .select('id, name, type')
        .eq('id', TARGET_ID)
        .single();

    if (errBefore) {
        console.error('Error fetching before state:', errBefore);
        return;
    }
    console.log('Current state:', before);

    // 2. Update
    const { data: updated, error: errUpdate } = await supabase
        .from('facilities')
        .update({ type: NEW_TYPE })
        .eq('id', TARGET_ID)
        .select()
        .single();

    if (errUpdate) {
        console.error('Error updating facility:', errUpdate);
        return;
    }

    console.log('Updated state:', updated);
    console.log('Successfully updated category to', NEW_TYPE);
}

updateCategory();
