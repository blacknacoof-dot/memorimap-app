
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function run() {
    const { data } = await supabase
        .from('facilities')
        .select('name, image_url')
        .or('name.ilike.%예다함%,name.ilike.%보람상조%,name.ilike.%상조114%');
    console.log(JSON.stringify(data, null, 2));
}

run();
