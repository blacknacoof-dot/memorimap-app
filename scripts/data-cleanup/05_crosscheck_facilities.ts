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

async function crosscheck() {
  console.log('=== 시설 DB 크로스체크 (2185건) ===\n');

  // 전체 데이터 가져오기
  let all: any[] = [];
  for (let p = 0; ; p++) {
    const { data, error } = await supabase
      .from('facilities')
      .select('id,name,type,address,latitude,longitude,image_url,images,phone,price_range,rating,review_count,status,description,created_at')
      .eq('status', 'active')
      .range(p * 1000, (p + 1) * 1000 - 1);
    if (error) { console.error('DB 에러:', error); break; }
    if (!data || data.length === 0) break;
    all = all.concat(data);
    if (data.length < 1000) break;
  }
  console.log(`조회된 활성 시설: ${all.length}건\n`);

  // 1. 타입별 분포
  const typeCounts: Record<string, number> = {};
  all.forEach(f => { typeCounts[f.type || 'null'] = (typeCounts[f.type || 'null'] || 0) + 1; });
  console.log('--- 타입별 분포 ---');
  Object.entries(typeCounts).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${k}: ${v}`));

  // 유효 타입 체크
  const validTypes = ['funeral_home', 'columbarium', 'cemetery', 'natural_burial', 'pet_funeral', 'sea_burial', 'crematorium', 'sangjo'];
  const invalidType = all.filter(f => f.type && !validTypes.includes(f.type));
  console.log(`\n유효하지 않은 타입: ${invalidType.length}건`);
  if (invalidType.length > 0) {
    const itc: Record<string, number> = {};
    invalidType.forEach(f => { itc[f.type] = (itc[f.type] || 0) + 1; });
    Object.entries(itc).forEach(([k, v]) => console.log(`  ${k}: ${v}`));
  }

  // 2. 지역별 분포
  const regionCounts: Record<string, number> = {};
  all.forEach(f => {
    let addr = (f.address || '');
    addr = addr.replace(/^경기\s/, '경기도 ').replace(/^서울\s/, '서울특별시 ')
      .replace(/^부산\s/, '부산광역시 ').replace(/^대구\s/, '대구광역시 ')
      .replace(/^인천\s/, '인천광역시 ').replace(/^광주\s/, '광주광역시 ')
      .replace(/^대전\s/, '대전광역시 ').replace(/^울산\s/, '울산광역시 ');
    const region = addr.split(' ')[0] || 'unknown';
    regionCounts[region] = (regionCounts[region] || 0) + 1;
  });
  console.log('\n--- 지역별 분포 ---');
  Object.entries(regionCounts).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${k}: ${v}`));

  // 3. 데이터 품질 검사
  console.log('\n--- 데이터 품질 ---');
  const noImage = all.filter(f => !f.image_url || f.image_url === '');
  const noGallery = all.filter(f => !f.images || !Array.isArray(f.images) || f.images.length === 0);
  const noPhone = all.filter(f => !f.phone || f.phone === '');
  const noAddr = all.filter(f => !f.address || f.address === '');
  const noName = all.filter(f => !f.name || f.name === '');
  const noPrice = all.filter(f => f.price_range === null || f.price_range === undefined || f.price_range === 0);
  const noRating = all.filter(f => !f.rating || Number(f.rating) === 0);
  const noDesc = all.filter(f => !f.description || f.description === '');

  console.log(`  이미지URL 없음: ${noImage.length}`);
  console.log(`  갤러리 없음: ${noGallery.length}`);
  console.log(`  전화 없음: ${noPhone.length}`);
  console.log(`  주소 없음: ${noAddr.length}`);
  console.log(`  이름 없음: ${noName.length}`);
  console.log(`  가격 없음: ${noPrice.length}`);
  console.log(`  평점 없음: ${noRating.length}`);
  console.log(`  설명 없음: ${noDesc.length}`);

  // 4. 좌표 검증
  console.log('\n--- 좌표 검증 ---');
  let zeroCoords = 0, outOfKorea = 0;
  const badCoords: any[] = [];
  all.forEach(f => {
    const lat = Number(f.latitude), lng = Number(f.longitude);
    if (!lat || !lng || lat === 0 || lng === 0) {
      zeroCoords++;
      badCoords.push({ id: f.id, name: f.name, lat, lng, issue: 'zero_or_null' });
    } else if (lat < 33 || lat > 39 || lng < 124 || lng > 132) {
      outOfKorea++;
      badCoords.push({ id: f.id, name: f.name, lat, lng, address: f.address, issue: 'out_of_korea' });
    }
  });
  console.log(`  좌표 없음/0: ${zeroCoords}`);
  console.log(`  한국 밖: ${outOfKorea}`);
  if (badCoords.length > 0) {
    console.log('  문제 좌표 (최대 20):');
    badCoords.slice(0, 20).forEach(b => console.log(`    ${b.name} (${b.lat}, ${b.lng}) - ${b.issue}`));
  }

  // 5. 중복 체크
  console.log('\n--- 중복 체크 ---');
  // 같은 이름
  const nameCount = new Map<string, any[]>();
  all.forEach(f => {
    if (!nameCount.has(f.name)) nameCount.set(f.name, []);
    nameCount.get(f.name)!.push(f);
  });
  const nameDupes = [...nameCount.entries()].filter(([, v]) => v.length > 1);
  console.log(`같은 이름: ${nameDupes.length}건`);
  nameDupes.slice(0, 15).forEach(([k, v]) => {
    const addrs = v.map((f: any) => (f.address || '').substring(0, 20)).join(' / ');
    console.log(`  "${k}" × ${v.length} → ${addrs}`);
  });

  // 같은 이름 + 같은 주소 (완전 중복)
  const exactDupes = new Map<string, any[]>();
  all.forEach(f => {
    const key = `${f.name}||${f.address}`;
    if (!exactDupes.has(key)) exactDupes.set(key, []);
    exactDupes.get(key)!.push(f);
  });
  const exactDupeList = [...exactDupes.entries()].filter(([, v]) => v.length > 1);
  console.log(`\n완전 중복 (이름+주소): ${exactDupeList.length}건`);
  exactDupeList.slice(0, 10).forEach(([k, v]) => console.log(`  ${k} → ${v.length}건`));

  // 6. 이미지 URL 샘플 유효성 (20개)
  console.log('\n--- 이미지 유효성 (샘플 20개) ---');
  const withImg = all.filter(f => f.image_url && f.image_url.startsWith('http'));
  const sample = withImg.sort(() => Math.random() - 0.5).slice(0, 20);
  let imgOk = 0, imgFail = 0;
  for (const f of sample) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 5000);
      const res = await fetch(f.image_url, { method: 'HEAD', signal: ctrl.signal });
      clearTimeout(timer);
      if (res.ok) imgOk++;
      else { imgFail++; console.log(`  ❌ [${res.status}] ${f.name}: ${f.image_url.substring(0, 60)}...`); }
    } catch {
      imgFail++;
      console.log(`  ❌ [timeout] ${f.name}: ${f.image_url.substring(0, 60)}...`);
    }
  }
  console.log(`  결과: ${imgOk}/20 정상 | ${imgFail}/20 실패`);

  // 7. 전화번호 형식 검증
  console.log('\n--- 전화번호 형식 ---');
  const phoneRe = /^(0[2-6]\d{0,2}[-\s]?\d{3,4}[-\s]?\d{4}|1[56]\d{2}[-\s]?\d{4}|0\d{1,2}[-\s]?\d{3,4}[-\s]?\d{4})$/;
  const withPhone = all.filter(f => f.phone && f.phone !== '');
  const validPhone = withPhone.filter(f => phoneRe.test(f.phone.replace(/\s/g, '')));
  const invalidPhone = withPhone.filter(f => !phoneRe.test(f.phone.replace(/\s/g, '')));
  console.log(`  유효: ${validPhone.length} | 무효: ${invalidPhone.length}`);
  invalidPhone.slice(0, 10).forEach(f => console.log(`  무효: "${f.phone}" (${f.name})`));

  // Save report
  const report = {
    timestamp: new Date().toISOString(),
    total: all.length,
    types: typeCounts,
    regions: regionCounts,
    quality: {
      no_image: noImage.length,
      no_gallery: noGallery.length,
      no_phone: noPhone.length,
      no_address: noAddr.length,
      no_price: noPrice.length,
      no_rating: noRating.length,
      no_desc: noDesc.length,
    },
    coordinates: { zero: zeroCoords, out_of_korea: outOfKorea, bad_list: badCoords },
    duplicates: { name_only: nameDupes.length, exact: exactDupeList.length },
    invalid_types: invalidType.map(f => ({ id: f.id, name: f.name, type: f.type })),
    image_sample: { ok: imgOk, fail: imgFail },
    phone: { valid: validPhone.length, invalid: invalidPhone.length, invalid_samples: invalidPhone.slice(0, 20).map(f => ({ name: f.name, phone: f.phone })) },
  };

  const outPath = path.resolve(__dirname, '../../data/cleanup/facility_crosscheck.json');
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(`\n✅ 저장: data/cleanup/facility_crosscheck.json`);
}

crosscheck().catch(e => { console.error('FATAL:', e); process.exit(1); });
