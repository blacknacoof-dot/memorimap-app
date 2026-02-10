
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!);

async function search() {
    const keywords = process.argv.slice(2);
    if (keywords.length === 0) {
        console.log("Usage: npx tsx inspect-one.ts <keyword1> <keyword2> ...");
        return;
    }

    for (const kw of keywords) {
        console.log(`\n🔎 Searching for: ${kw}`);
        const { data } = await supabase
            .from('memorial_spaces')
            .select('id, name, address, type, lat, lng, review_count')
            .ilike('name', `%${kw}%`);

        if (data) {
            data.forEach(f => {
                console.log(`- [${f.id}] ${f.name} (${f.type}) | ${f.address} | Rev: ${f.review_count}`);
            });
        }
    }
}

search();
