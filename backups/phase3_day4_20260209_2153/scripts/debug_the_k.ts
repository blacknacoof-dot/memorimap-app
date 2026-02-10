
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
    console.log('--- Checking The-K Ye-Daham ---');
    // 1. Check by Name
    const { data: byName, error: nameError } = await supabase
        .from('memorial_spaces')
        .select('id, name, price_info')
        .ilike('name', '%The-K%');

    if (byName) {
        console.log('Found by name:', byName.length);
        byName.forEach(b => {
            console.log(`ID: ${b.id} (Type: ${typeof b.id}), Name: ${b.name}`);
            console.log(`Has price_info? ${!!b.price_info}`);
            if (b.price_info) console.log('Products count:', b.price_info.products?.length);
        });
    } else {
        console.log('Error searching by name:', nameError);
    }

    // 2. Check the UUID from the log
    const uuid = 'fe21de9f-49d9-4eb3-b1af-5b885a8111dd';
    console.log(`\n--- Checking UUID: ${uuid} ---`);
    const { data: byUUID, error: uuidError } = await supabase
        .from('memorial_spaces')
        .select('id, name')
        .eq('id', uuid)
        .maybeSingle();

    if (uuidError) console.log('Error (expected if ID is int):', uuidError.message);
    else console.log('Found by UUID:', byUUID);
}

run();
