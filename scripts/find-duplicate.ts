
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
);

async function findDuplicates() {
    const { data, error } = await supabase
        .from('memorial_spaces')
        .select('*')
        .or('name.ilike.%안양샘병원%,name.ilike.%샘안양병원%');

    if (error) {
        console.error(error);
        return;
    }

    console.log("🔍 Search Results:");
    data.forEach(f => {
        console.log(`- [${f.id}] ${f.name}`);
        console.log(`  Addr: ${f.address}`);
        console.log(`  Img: ${f.image_url}`);
        console.log("---");
    });
}

findDuplicates();
