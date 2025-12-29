
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const IDS = [10, 786, 863, 916, 1688174120, 1239833181];

async function update() {
    // 1. Fix address for ID 1239833181
    console.log('1. Fixing address for 호국봉안담...');
    await supabase.from('memorial_spaces')
        .update({ address: '인천광역시 부평구 평온로 61' })
        .eq('id', 1239833181);
    console.log('   Done');

    // 2. Update phone for all
    console.log('2. Updating phone to 1577-4129...');
    for (const id of IDS) {
        await supabase.from('memorial_spaces').update({ phone: '1577-4129' }).eq('id', id);
    }
    console.log('   Done');

    console.log('\nAll updates complete!');
}
update();
