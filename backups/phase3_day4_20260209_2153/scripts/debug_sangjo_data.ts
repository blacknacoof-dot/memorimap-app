
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugSangjo() {
    console.log('Searching for facilities with names like "Maeil", "Taeyang", "매일", "태양"...');

    const patterns = ['%Maeil%', '%Taeyang%', '%매일%', '%태양%'];

    for (const pattern of patterns) {
        const { data, error } = await supabase
            .from('facilities')
            .select('*')
            .ilike('name', pattern)
            .limit(5);

        if (error) {
            console.error(`Error searching for ${pattern}:`, error);
            continue;
        }

        if (data && data.length > 0) {
            console.log(`\nResults for ${pattern}:`);
            data.forEach(f => {
                console.log(`- ID: ${f.id}`);
                console.log(`  Name: ${f.name}`);
                console.log(`  Category (Raw): ${f.category}`);
                console.log(`  Address: ${f.address}`);
                console.log('---');
            });
        }
    }
}

debugSangjo();
