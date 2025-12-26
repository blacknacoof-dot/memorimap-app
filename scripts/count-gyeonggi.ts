
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
);

async function countGyeonggi() {
    // Count facilities with address containing '경기' and type 'funeral'
    const { count, error } = await supabase
        .from('memorial_spaces')
        .select('*', { count: 'exact', head: true })
        .like('address', '%경기%')
        .eq('type', 'funeral');

    if (error) {
        console.error(error);
    } else {
        console.log(`경기도 장례식장 총 개수: ${count}`);
    }
}

countGyeonggi();
