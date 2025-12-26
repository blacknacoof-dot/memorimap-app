
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
);

async function debugFacility() {
    console.log("🔍 Searching for address: 낙동대로 1056");
    const { data, error } = await supabase
        .from('memorial_spaces')
        .select('*')
        .ilike('address', '%낙동대로 1056%');

    if (error) {
        console.error("❌ Error:", error);
    } else {
        console.log("✅ Results:", JSON.stringify(data, null, 2));
    }
    process.exit(0);
}

debugFacility();
