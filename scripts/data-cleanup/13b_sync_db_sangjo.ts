/**
 * funeral_companies DB를 업데이트된 constants.ts와 동기화
 * - phone, price_range, description, features 업데이트
 */
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
  const { data: dbFC } = await sb.from('funeral_companies').select('id,name,phone,price_range,description,features');
  console.log(`DB funeral_companies: ${(dbFC || []).length}건\n`);

  // constants.ts에서 데이터 추출
  const constContent = fs.readFileSync(path.resolve(__dirname, '../../constants.ts'), 'utf-8');

  const constData = new Map<string, any>();
  // 각 상조회사 블록 파싱
  for (const m of constContent.matchAll(
    /\{\s*id:\s*'(?:fc_|pet_fc_)[^']*'[\s\S]*?name:\s*'([^']+)'[\s\S]*?phone:\s*'([^']*)'[\s\S]*?priceRange:\s*'([^']*)'[\s\S]*?description:\s*'([^']*)'[\s\S]*?features:\s*\[([^\]]*)\]/g
  )) {
    const features = m[5].match(/'([^']+)'/g)?.map(s => s.replace(/'/g, '')) || [];
    constData.set(m[1].trim(), {
      phone: m[2],
      price_range: m[3],
      description: m[4],
      features,
    });
  }

  console.log(`Constants 파싱: ${constData.size}건\n`);

  let updated = 0;
  for (const db of dbFC || []) {
    const c = constData.get(db.name);
    if (!c) continue;

    const updates: any = {};
    if (c.phone && c.phone !== '1588-0000' && c.phone !== db.phone) {
      updates.phone = c.phone;
    }
    if (c.price_range && c.price_range !== '문의' && c.price_range !== db.price_range) {
      updates.price_range = c.price_range;
    }
    if (c.description && c.description !== '믿을 수 있는 상조 서비스' && c.description !== db.description) {
      updates.description = c.description;
    }
    if (c.features && c.features.length > 0) {
      updates.features = c.features;
    }

    if (Object.keys(updates).length > 0) {
      const { error } = await sb.from('funeral_companies').update(updates).eq('id', db.id);
      if (error) {
        console.log(`❌ ${db.name}: ${error.message}`);
      } else {
        updated++;
        const fields = Object.keys(updates).join(',');
        console.log(`✅ ${db.name}: ${fields}`);
      }
    }
  }

  console.log(`\n완료: ${updated}건 업데이트`);
}

run().catch(e => { console.error('FATAL:', e); process.exit(1); });
