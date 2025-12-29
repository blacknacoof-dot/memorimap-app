
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function findDuplicates() {
    console.log('🔍 Searching for "스카이캐슬" facilities...\n');

    const { data, error } = await supabase
        .from('memorial_spaces')
        .select('id, name, address, type')
        .ilike('name', '%스카이캐슬%')
        .order('name');

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`Found ${data?.length || 0} facilities:\n`);
    data?.forEach((f, idx) => {
        console.log(`[${idx + 1}] ID: ${f.id}`);
        console.log(`    Name: ${f.name}`);
        console.log(`    Address: ${f.address}`);
        console.log(`    Type: ${f.type}`);
        console.log('');
    });

    // Find exact duplicates (same name and similar address)
    const duplicates: any[] = [];
    const seen = new Map<string, any>();

    data?.forEach(f => {
        const key = f.name.replace(/\s/g, ''); // Remove spaces for comparison
        if (seen.has(key)) {
            duplicates.push({ original: seen.get(key), duplicate: f });
        } else {
            seen.set(key, f);
        }
    });

    if (duplicates.length > 0) {
        console.log('\n⚠️ Potential duplicates found:\n');
        duplicates.forEach((d, idx) => {
            console.log(`Duplicate ${idx + 1}:`);
            console.log(`  Original: [${d.original.id}] ${d.original.name} - ${d.original.address}`);
            console.log(`  Duplicate: [${d.duplicate.id}] ${d.duplicate.name} - ${d.duplicate.address}`);
        });
    }
}

findDuplicates();
