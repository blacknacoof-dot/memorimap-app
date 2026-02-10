
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// ✅ [Security Fix] .env.local 명시적 로드
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

// ✅ [Security Fix] 하드코딩된 키 제거, 환경변수 필수
if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteDuplicate() {
    const badId = 12216118;
    console.log(`Attempting to delete facility ID: ${badId}`);

    // OPTIONAL: Check for dependent records (reviews, reservations)
    // But strictly per user request, we proceed to delete.

    const { error } = await supabase
        .from('memorial_spaces')
        .delete()
        .eq('id', badId);

    if (error) {
        console.error('Error deleting facility:', error);
    } else {
        console.log('Successfully deleted facility.');
    }
}

deleteDuplicate();
