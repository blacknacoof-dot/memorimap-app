import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!);

async function checkDefaults() {
    console.log("🔍 Checking for default coordinates (37.5, 127.0)...");

    // Find facilities with EXACTLY 37.5 and 127.0
    // Note: Floating point comparison might be tricky, but if inserted as literal 37.5, it should match.
    // If not, we might need a range. But let's try exact first as my script used literals.
    const { data, error } = await supabase
        .from('memorial_spaces')
        .select('id, name, address, type')
        .eq('lat', 37.5)
        .eq('lng', 127.0);

    if (error) {
        console.error(error);
        return;
    }

    console.log(`총 ${data.length}개 시설이 기본 좌표(37.5, 127.0)를 가지고 있습니다.`);
    if (data.length > 0) {
        console.log("--- 목록 (상위 20개) ---");
        data.slice(0, 20).forEach(f => {
            console.log(`[${f.type}] ${f.name} (${f.address})`);
        });
    }
}

checkDefaults();
