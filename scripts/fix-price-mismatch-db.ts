
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try loading .env.local from project root using process.cwd()
const envPath = path.resolve(process.cwd(), '.env.local');
console.log('Loading .env from:', envPath);
dotenv.config({ path: envPath });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    console.log('Available Env Keys:', Object.keys(process.env).filter(k => k.includes('SUPABASE')));
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixPriceMismatch() {
    try {
        // 1. Read the mismatch data
        const mismatchDataPath = path.resolve(__dirname, 'price_info_mismatch_data.json');
        if (!fs.existsSync(mismatchDataPath)) {
            console.error('Mismatch data file not found:', mismatchDataPath);
            return;
        }

        const mismatchData = JSON.parse(fs.readFileSync(mismatchDataPath, 'utf8'));
        const idsToFix = mismatchData.map((item: any) => item.id);

        console.log(`Found ${idsToFix.length} facilities to fix.`);

        if (idsToFix.length === 0) {
            console.log('No facilities to fix.');
            return;
        }

        // 2. Update Supabase
        const { data, error } = await supabase
            .from('memorial_spaces') // Correct table name
            .update({ price_info: null }) // Set price_info to null
            .in('id', idsToFix)
            .select();

        if (error) {
            console.error('Error updating facilities:', error);
        } else {
            console.log(`Successfully updated facilities. price_info set to NULL.`);
            // data might be null if no rows returned or updated
        }

    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

fixPriceMismatch();
