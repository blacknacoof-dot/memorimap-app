/**
 * 상조 서비스 데이터 품질 전수 점검
 * - funeral_companies DB vs constants.ts 비교
 * - 전화번호, 가격, 서비스구성, 사진, 리뷰, 상품 확인
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
  // 1. DB funeral_companies
  const { data: dbFC } = await sb.from('funeral_companies').select('*').order('name');
  console.log(`=== funeral_companies DB: ${(dbFC || []).length}건 ===\n`);

  // 2. DB 리뷰
  const fcIds = (dbFC || []).map(c => c.id);
  const { data: reviews } = await sb.from('facility_reviews').select('facility_id,rating,content').in('facility_id', fcIds);
  const reviewMap = new Map<string, number>();
  for (const r of reviews || []) {
    reviewMap.set(r.facility_id, (reviewMap.get(r.facility_id) || 0) + 1);
  }

  // 3. DB 상품 (sangjo_products)
  const { data: products } = await sb.from('sangjo_products').select('company_id,name,price');
  const prodMap = new Map<string, any[]>();
  for (const p of products || []) {
    if (!prodMap.has(p.company_id)) prodMap.set(p.company_id, []);
    prodMap.get(p.company_id)!.push({ name: p.name, price: p.price });
  }

  // 4. Constants 파싱
  const constContent = fs.readFileSync(path.resolve(__dirname, '../../constants.ts'), 'utf-8');
  const constMap = new Map<string, any>();

  // FUNERAL_COMPANIES 파싱
  const fcSection = constContent.substring(
    constContent.indexOf('export const FUNERAL_COMPANIES'),
    constContent.indexOf('export const PET_FUNERAL_COMPANIES') > -1
      ? constContent.indexOf('export const PET_FUNERAL_COMPANIES')
      : constContent.indexOf('export const FACILITIES')
  );
  for (const m of fcSection.matchAll(/\{\s*id:\s*'([^']+)'[\s\S]*?name:\s*'([^']+)'[\s\S]*?phone:\s*'([^']*)'[\s\S]*?priceRange:\s*'([^']*)'[\s\S]*?imageUrl:\s*'([^']*)'[\s\S]*?description:\s*'([^']*)'/g)) {
    constMap.set(m[2].trim(), {
      id: m[1], name: m[2], phone: m[3], priceRange: m[4], imageUrl: m[5], description: m[6]
    });
  }

  // PET_FUNERAL_COMPANIES 파싱
  const petStart = constContent.indexOf('export const PET_FUNERAL_COMPANIES');
  if (petStart > -1) {
    const petSection = constContent.substring(petStart, constContent.indexOf('];', petStart) + 2);
    for (const m of petSection.matchAll(/\{\s*id:\s*'([^']+)'[\s\S]*?name:\s*'([^']+)'[\s\S]*?phone:\s*'([^']*)'[\s\S]*?priceRange:\s*'([^']*)'[\s\S]*?imageUrl:\s*'([^']*)'[\s\S]*?description:\s*'([^']*)'/g)) {
      constMap.set(m[2].trim(), {
        id: m[1], name: m[2], phone: m[3], priceRange: m[4], imageUrl: m[5], description: m[6]
      });
    }
  }

  console.log(`Constants 파싱: ${constMap.size}건\n`);

  // 5. 점검
  const summary = {
    total_db: (dbFC || []).length,
    total_const: constMap.size,
    issues: [] as any[],
    db_only: [] as string[],
    const_only: [] as string[],
    dummy_phone: 0,
    dummy_desc: 0,
    no_price: 0,
    no_image_db: 0,
    no_reviews_db: 0,
    no_products_db: 0,
    has_reviews: 0,
    has_products: 0,
  };

  // DB에 있지만 constants에 없는
  for (const c of dbFC || []) {
    if (!constMap.has(c.name)) {
      summary.db_only.push(c.name);
    }
  }

  // Constants에 있지만 DB에 없는
  const dbNameSet = new Set((dbFC || []).map(c => c.name));
  for (const [name] of constMap) {
    if (!dbNameSet.has(name)) {
      summary.const_only.push(name);
    }
  }

  console.log('=== 상조회사별 상세 점검 ===\n');
  console.log('이름 | 전화(const) | 가격(const) | 사진(const) | 설명 | DB리뷰 | DB상품 | 이슈');
  console.log('-'.repeat(120));

  for (const [name, c] of constMap) {
    const issues: string[] = [];

    // 전화번호
    if (c.phone === '1588-0000') {
      issues.push('더미전화');
      summary.dummy_phone++;
    } else if (!c.phone) {
      issues.push('전화없음');
    }

    // 가격
    if (c.priceRange === '문의' || !c.priceRange) {
      issues.push('가격없음');
      summary.no_price++;
    }

    // 설명
    if (c.description === '믿을 수 있는 상조 서비스') {
      issues.push('더미설명');
      summary.dummy_desc++;
    }

    // 사진 (constants)
    const hasRealImg = c.imageUrl && !c.imageUrl.includes('unsplash') && c.imageUrl !== '';
    // DB 사진
    const dbEntry = (dbFC || []).find(d => d.name === name);
    const hasDbImg = dbEntry && dbEntry.image_url;

    if (!hasRealImg && !hasDbImg) {
      issues.push('사진없음');
      summary.no_image_db++;
    }

    // DB 리뷰
    const revCount = dbEntry ? (reviewMap.get(dbEntry.id) || 0) : 0;
    if (revCount === 0) {
      summary.no_reviews_db++;
    } else {
      summary.has_reviews++;
    }

    // DB 상품
    const prods = dbEntry ? (prodMap.get(dbEntry.id) || []) : [];
    if (prods.length === 0) {
      summary.no_products_db++;
    } else {
      summary.has_products++;
    }

    const imgStatus = hasRealImg ? (c.imageUrl.startsWith('/images') ? 'local' : 'url') : (hasDbImg ? 'DB만' : 'X');

    console.log(
      `${name.padEnd(16)} | ${(c.phone || '-').padEnd(12)} | ${(c.priceRange || '-').padEnd(8)} | ${imgStatus.padEnd(6)} | ${(c.description || '-').substring(0, 15).padEnd(15)} | 리뷰:${String(revCount).padStart(3)} | 상품:${String(prods.length).padStart(2)} | ${issues.join(',') || 'OK'}`
    );

    if (issues.length > 0) {
      summary.issues.push({ name, issues, phone: c.phone, price: c.priceRange });
    }
  }

  // 6. 요약
  console.log('\n=== 요약 ===');
  console.log(`총 상조: DB ${summary.total_db}건 / Constants ${summary.total_const}건`);
  console.log(`DB에만: ${summary.db_only.length}건 (${summary.db_only.join(', ')})`);
  console.log(`Constants에만: ${summary.const_only.length}건 (${summary.const_only.join(', ')})`);
  console.log(`더미 전화(1588-0000): ${summary.dummy_phone}건`);
  console.log(`더미 설명: ${summary.dummy_desc}건`);
  console.log(`가격 없음(문의): ${summary.no_price}건`);
  console.log(`사진 없음: ${summary.no_image_db}건`);
  console.log(`DB 리뷰 있음: ${summary.has_reviews}건 / 없음: ${summary.no_reviews_db}건`);
  console.log(`DB 상품 있음: ${summary.has_products}건 / 없음: ${summary.no_products_db}건`);
  console.log(`\n이슈 있는 상조: ${summary.issues.length}건/${summary.total_const}건`);

  // 저장
  const outPath = path.resolve(__dirname, '../../data/cleanup/sangjo_quality_report.json');
  fs.writeFileSync(outPath, JSON.stringify(summary, null, 2));
  console.log(`\n✅ 저장: data/cleanup/sangjo_quality_report.json`);
}

run().catch(e => { console.error('FATAL:', e); process.exit(1); });
