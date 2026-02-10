
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars from the parent directory
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const tables = [
    'partner_conversations',
    'partner_inquiries',
    'subscription_payments',
    'user_notifications',
    'subscriptions',
    'facilities',
    'favorites',
    'sangjo_favorites',
    'consultations'
];

async function inspectTables() {
    for (const table of tables) {
        console.log(`\n--- Inspecting ${table} ---`);
        const { data, error } = await supabase
            .from(table)
            .select('*')
            .limit(1);

        if (error) {
            console.error(`Error fetching ${table}:`, error.message);
        } else if (data && data.length > 0) {
            console.log('Columns:', Object.keys(data[0]).join(', '));
        } else {
            console.log('Table is empty, cannot infer columns from data.');
            // Fallback: try to insert a dummy row to get a schema error? No, too risky.
        }
    }
}

inspectTables();
