import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function audit() {
  console.log('=== MEMORIMAP DATA AUDIT ===\n');
  const c = fs.readFileSync(path.resolve(__dirname, '../../constants.ts'), 'utf-8');

  const dummyPhone = (c.match(/phone: '1588-0000'/g) || []).length;
  const genericDesc = (c.match(/description: '믿을 수 있는 상조 서비스'/g) || []).length;
  const priceInquiry = (c.match(/priceRange: '문의'/g) || []).length;
  const fcCount = (c.match(/id: 'fc_/g) || []).length;
  const petCount = (c.match(/id: 'pet_/g) || []).length;
  const unsplash = (c.match(/unsplash\.com/g) || []).length;

  const facilitiesSection = c.substring(c.indexOf('export const FACILITIES'));
  const constFacNames = [...facilitiesSection.matchAll(/name: '([^']+)'/g)].map(m => m[1]);

  console.log('--- CONSTANTS.TS ---');
  console.log(`상조: ${fcCount} | 동물: ${petCount} | 시설: ${constFacNames.length}`);
  console.log(`더미전화: ${dummyPhone} | 더미설명: ${genericDesc} | 가격문의: ${priceInquiry} | unsplash: ${unsplash}`);

  console.log('\n--- DB FACILITIES ---');
  const { count: total } = await supabase.from('facilities').select('*', { count: 'exact', head: true });
  const { count: active } = await supabase.from('facilities').select('*', { count: 'exact', head: true }).eq('status', 'active');
  console.log(`전체: ${total} | 활성: ${active}`);

  let all: any[] = [];
  for (let p = 0; ; p++) {
    const { data } = await supabase.from('facilities').select('id,name,type,address,lat,lng,image_url,images,phone,price_min,rating,status').range(p * 1000, (p + 1) * 1000 - 1);
    if (!data || data.length === 0) break;
    all = all.concat(data);
    if (data.length < 1000) break;
  }

  const act = all.filter(f => f.status === 'active');
  const tc: Record<string, number> = {};
  act.forEach(f => { tc[f.type || 'null'] = (tc[f.type || 'null'] || 0) + 1; });
  console.log('\n타입별:');
  Object.entries(tc).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${k}: ${v}`));

  const rc: Record<string, number> = {};
  act.forEach(f => {
    const a = (f.address || '').replace(/^경기\s/, '경기도 ').replace(/^서울\s/, '서울특별시 ');
    rc[a.split(' ')[0] || '?'] = (rc[a.split(' ')[0] || '?'] || 0) + 1;
  });
  console.log('\n지역별 (상위15):');
  Object.entries(rc).sort((a, b) => b[1] - a[1]).slice(0, 15).forEach(([k, v]) => console.log(`  ${k}: ${v}`));

  const noImg = act.filter(f => !f.image_url).length;
  const noGal = act.filter(f => !f.images || !Array.isArray(f.images) || f.images.length === 0).length;
  const noPh = act.filter(f => !f.phone).length;
  const noPr = act.filter(f => !f.price_min).length;
  const noRt = act.filter(f => !f.rating || Number(f.rating) === 0).length;
  let zeroC = 0, outK = 0;
  const bad: any[] = [];
  act.forEach(f => {
    const la = Number(f.lat), ln = Number(f.lng);
    if (!la || !ln) { zeroC++; bad.push({ id: f.id, name: f.name, lat: la, lng: ln }); }
    else if (la < 33 || la > 39 || ln < 124 || ln > 132) { outK++; bad.push({ id: f.id, name: f.name, lat: la, lng: ln, issue: 'out' }); }
  });

  console.log('\n누락 (활성):');
  console.log(`  이미지: ${noImg} | 갤러리: ${noGal} | 전화: ${noPh} | 가격: ${noPr} | 평점: ${noRt}`);
  console.log(`  좌표없음: ${zeroC} | 한국밖: ${outK}`);

  const seen = new Map<string, number>();
  let dupes = 0;
  act.forEach(f => { const k = `${f.name}||${f.address}`; seen.set(k, (seen.get(k) || 0) + 1); });
  [...seen.entries()].filter(([, v]) => v > 1).forEach(([k, v]) => { dupes++; if (dupes <= 10) console.log(`  중복: ${k} (${v}건)`); });
  console.log(`중복 총: ${dupes}쌍`);

  console.log('\n--- 크로스체크 ---');
  const dbN = new Set(all.map(f => f.name));
  const notIn = constFacNames.filter(n => !dbN.has(n));
  console.log(`Constants→DB: ${constFacNames.length - notIn.length}/${constFacNames.length} 존재`);
  notIn.forEach(n => console.log(`  미존재: ${n}`));

  const { count: coCount } = await supabase.from('funeral_companies').select('*', { count: 'exact', head: true });
  const { count: partCount } = await supabase.from('partners').select('*', { count: 'exact', head: true });
  const { count: aiC } = await supabase.from('ai_consultations').select('*', { count: 'exact', head: true });
  const { count: conC } = await supabase.from('consultations').select('*', { count: 'exact', head: true });
  console.log(`\nDB 상조: ${coCount} | 파트너: ${partCount} | AI상담: ${aiC} | 일반상담: ${conC}`);

  const report = {
    timestamp: new Date().toISOString(),
    constants: { sangjo: fcCount, pet: petCount, facilities: constFacNames.length, dummy_phone: dummyPhone, generic_desc: genericDesc, price_inquiry: priceInquiry, unsplash },
    db_facilities: { total, active, types: tc, regions: rc, no_image: noImg, no_gallery: noGal, no_phone: noPh, no_price: noPr, no_rating: noRt, zero_coords: zeroC, out_of_korea: outK, duplicates: dupes, bad_coords: bad.slice(0, 50) },
    db_other: { funeral_companies: coCount, partners: partCount, ai_consultations: aiC, consultations: conC },
    crosscheck: { matched: constFacNames.length - notIn.length, not_in_db: notIn }
  };
  const out = path.resolve(__dirname, '../../data/cleanup/audit_report.json');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(report, null, 2));
  console.log('\n✅ 저장완료: data/cleanup/audit_report.json');
}
audit().catch(e => { console.error('FATAL:', e); process.exit(1); });
