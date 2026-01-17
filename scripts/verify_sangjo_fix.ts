
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase URL or Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifySangjoFix() {
    console.log('--- 🧹 Sangjo Fix Verification ---');

    // Check for remaining misclassified items
    const { data, error } = await supabase
        .from('facilities')
        .select('id, name, category')
        .eq('category', 'funeral_home')
        .or('name.ilike.%상조%,name.ilike.%더리본%,name.ilike.%라이프%,name.ilike.%프리드%,name.ilike.%보람%,name.ilike.%공무원%');

    if (error) {
        console.error('❌ Query Error:', error.message);
    } else {
        const remainingCount = data?.length || 0;

        if (remainingCount === 0) {
            console.log('✅ SUCCESS: No Sangjo-like names found in funeral_home category.');
        } else {
            console.log(`⚠️ WARNING: Found ${remainingCount} potential Sangjo items still in funeral_home:`);
            data?.forEach(item => {
                console.log(` - [${item.category}] ${item.name}`);
            });
            console.log('👉 Please run the migration SQL again or check for different naming patterns.');
        }
    }

    // Optional: Check if we have items in 'sangjo' category now
    const { count, error: countError } = await supabase
        .from('facilities')
        .select('*', { count: 'exact', head: true })
        .eq('category', 'sangjo');

    if (!countError) {
        console.log(`ℹ️ Current total 'sangjo' items: ${count}`);
    }
}

verifySangjoFix();
