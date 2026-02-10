
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("❌ 필수 설정(Supabase)이 누락되었습니다.");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function verify() {
    console.log("🔍 Checking '고려대안산병원장례식장'...");

    const { data, error } = await supabase
        .from('memorial_spaces')
        .select('*')
        .eq('name', '고려대안산병원장례식장')
        .maybeSingle();

    if (error) {
        console.error('Error fetching:', error);
    } else if (data) {
        console.log('✅ Found record:');
        console.log(data);
    } else {
        console.log('❌ Not found');
    }
}

verify();
