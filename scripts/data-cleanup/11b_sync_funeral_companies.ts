import { createClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';
import * as fs from 'fs';

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
  const { data: db } = await sb.from('funeral_companies').select('id,name');
  const dbNames = new Set((db || []).map(c => c.name.trim()));

  const cc = fs.readFileSync('constants.ts', 'utf-8');
  const names: string[] = [];
  for (const m of cc.matchAll(/id:\s*['"](?:fc_|pet_fc_)[^'"]*['"][\s\S]*?name:\s*['"]([^'"]+)['"]/g)) {
    names.push(m[1].trim());
  }

  const missing = names.filter(n => !dbNames.has(n));
  console.log(`DB: ${dbNames.size} | Constants: ${names.length} | Missing: ${missing.length}`);

  let ok = 0;
  for (const name of missing) {
    const { error } = await sb.from('funeral_companies').insert({
      id: crypto.randomUUID(),
      name,
      rating: 0,
      review_count: 0,
    });
    if (error) {
      console.log(`FAIL: ${name} - ${error.message}`);
    } else {
      ok++;
      console.log(`OK: ${name}`);
    }
  }
  console.log(`\n완료: ${ok}/${missing.length} 성공`);
}

run();
