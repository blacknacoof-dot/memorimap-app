
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

async function findData() {
  console.log('--- Searching for 시안 ---');
  const { data: sian } = await supabase.from('memorial_spaces').select('id, name, address').ilike('name', '%시안%');
  console.log(JSON.stringify(sian, null, 2));

  console.log('\n--- Searching for 평온 ---');
  const { data: pyeongon } = await supabase.from('memorial_spaces').select('id, name, address').ilike('name', '%평온%');
  console.log(JSON.stringify(pyeongon, null, 2));

  console.log('\n--- Searching for 재단법인 ---');
  const { data: jaedan } = await supabase.from('memorial_spaces').select('id, name, address').ilike('name', '%재단법인%');
  
  if (jaedan) {
    const list = [];
    for (const f of jaedan) {
      const cleanName = f.name.replace('재단법인 ', '').replace('(재)', '').trim();
      const { data: matches } = await supabase.from('memorial_spaces').select('id, name').ilike('name', `%${cleanName}%`).neq('id', f.id);
      list.push({
        ...f,
        duplicates: matches || []
      });
    }
    console.log(JSON.stringify(list, null, 2));
  }
}
findData();
