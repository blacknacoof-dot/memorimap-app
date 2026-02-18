/**
 * 네이버 검증 결과를 바탕으로 데이터 수정 적용
 *
 * 1. 주소 정규화 (축약형 → 정식 명칭)
 * 2. 전화번호 보충 (네이버 검증 결과)
 * 3. 좌표 보정 (lat/lng=0 → 네이버 좌표)
 * 4. 전화번호 형식 오류 수정
 * 5. 완전 중복 제거
 * 6. funeral_companies DB 동기화
 *
 * 사용법: npx tsx scripts/data-cleanup/11_apply_fixes.ts [--dry-run]
 */
import { createClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DRY_RUN = process.argv.includes('--dry-run');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ===== 주소 정규화 매핑 =====
const ADDR_NORMALIZE: [RegExp, string][] = [
  [/^경북\s/, '경상북도 '],
  [/^경남\s/, '경상남도 '],
  [/^충남\s/, '충청남도 '],
  [/^충북\s/, '충청북도 '],
  [/^전남\s/, '전라남도 '],
  [/^전북\s/, '전북특별자치도 '],
  [/^강원도\s/, '강원특별자치도 '],
  [/^전라북도\s/, '전북특별자치도 '],
];

// ===== 전화번호 형식 수정 =====
const PHONE_FIXES: Record<string, string> = {
  '--': '',  // 영신원: 삭제
  '114': '',  // 상조114: 삭제 (이미 sangjo 삭제됨)
  '1544-4471-': '1544-4471',  // 재단법인 로엠: 뒤 하이픈 제거
  '050-71332-3556': '050-7133-23556',  // 대원추모공원: 형식 확인 필요
  '8337737': '',  // 중앙추모공원: 형식 불명 → 삭제
};

async function main() {
  console.log(`=== 데이터 수정 적용 ${DRY_RUN ? '(DRY RUN)' : ''} ===\n`);

  const stats = {
    addr_normalized: 0,
    phone_filled: 0,
    phone_fixed: 0,
    coords_fixed: 0,
    dupes_removed: 0,
    funeral_synced: 0,
  };

  // ===== 1. 주소 정규화 =====
  console.log('--- 1. 주소 정규화 ---');
  let all: any[] = [];
  for (let p = 0; ; p++) {
    const { data } = await supabase
      .from('facilities')
      .select('id,name,address,status')
      .eq('status', 'active')
      .range(p * 1000, (p + 1) * 1000 - 1);
    if (!data || data.length === 0) break;
    all = all.concat(data);
    if (data.length < 1000) break;
  }

  for (const f of all) {
    if (!f.address) continue;
    let newAddr = f.address;
    for (const [re, replacement] of ADDR_NORMALIZE) {
      newAddr = newAddr.replace(re, replacement);
    }
    if (newAddr !== f.address) {
      stats.addr_normalized++;
      if (!DRY_RUN) {
        await supabase.from('facilities').update({ address: newAddr }).eq('id', f.id);
      }
      if (stats.addr_normalized <= 5) {
        console.log(`  "${f.address}" → "${newAddr}" (${f.name})`);
      }
    }
  }
  console.log(`  주소 정규화: ${stats.addr_normalized}건\n`);

  // ===== 2. 전화번호 형식 수정 =====
  console.log('--- 2. 전화번호 형식 수정 ---');
  for (const f of all) {
    if (!f.phone) continue;
    // placeholder phone 처리를 위해 다시 조회 필요
  }
  // 직접 DB에서 문제 전화번호 수정
  const { data: phoneFixes } = await supabase
    .from('facilities')
    .select('id,name,phone')
    .eq('status', 'active')
    .or('phone.eq.--,phone.eq.114,phone.like.%-,phone.eq.8337737');

  if (phoneFixes) {
    for (const f of phoneFixes) {
      const fix = PHONE_FIXES[f.phone] ?? null;
      if (fix !== undefined && fix !== f.phone) {
        stats.phone_fixed++;
        console.log(`  "${f.phone}" → "${fix || '(삭제)'}" (${f.name})`);
        if (!DRY_RUN) {
          await supabase.from('facilities').update({ phone: fix || null }).eq('id', f.id);
        }
      }
    }
  }
  console.log(`  전화 수정: ${stats.phone_fixed}건\n`);

  // ===== 3. 네이버 검증 결과 적용 (전화번호 보충 + 좌표 보정) =====
  const verifyPath = path.resolve(__dirname, '../../data/cleanup/naver_verification.json');
  if (fs.existsSync(verifyPath)) {
    const verify = JSON.parse(fs.readFileSync(verifyPath, 'utf-8'));

    console.log('--- 3. 전화번호 보충 (네이버) ---');
    for (const pf of verify.phone_fills || []) {
      if (!DRY_RUN) {
        await supabase.from('facilities').update({ phone: pf.naver_phone }).eq('id', pf.id);
      }
      stats.phone_filled++;
      if (stats.phone_filled <= 5) {
        console.log(`  ${pf.name}: → "${pf.naver_phone}"`);
      }
    }
    console.log(`  전화 보충: ${stats.phone_filled}건\n`);

    console.log('--- 4. 좌표 보정 ---');
    for (const cf of verify.coord_fixes || []) {
      if (!DRY_RUN) {
        await supabase.from('facilities')
          .update({ latitude: cf.new_lat, longitude: cf.new_lng })
          .eq('id', cf.id);
      }
      stats.coords_fixed++;
      console.log(`  ${cf.name}: (${cf.old_lat},${cf.old_lng}) → (${cf.new_lat},${cf.new_lng})`);
    }
    console.log(`  좌표 보정: ${stats.coords_fixed}건\n`);
  } else {
    console.log('⚠️ naver_verification.json 없음 - 먼저 10_naver_verify.ts 실행 필요\n');
  }

  // ===== 5. 완전 중복 제거 =====
  console.log('--- 5. 중복 제거 ---');
  const dupeMap = new Map<string, any[]>();
  for (const f of all) {
    const key = `${f.name}||${f.address}`;
    if (!dupeMap.has(key)) dupeMap.set(key, []);
    dupeMap.get(key)!.push(f);
  }

  for (const [key, group] of dupeMap) {
    if (group.length <= 1) continue;
    // 첫 번째만 남기고 나머지 삭제
    const keep = group[0];
    const removes = group.slice(1);
    for (const r of removes) {
      console.log(`  중복삭제: "${r.name}" (${r.id}) - 유지: ${keep.id}`);
      if (!DRY_RUN) {
        // FK 참조 NULL 처리
        await supabase.from('user_favorites').update({ facility_id: keep.id }).eq('facility_id', r.id);
        await supabase.from('facility_packages').update({ facility_id: keep.id }).eq('facility_id', r.id);
        await supabase.from('user_journey_events').update({ facility_id: keep.id }).eq('facility_id', r.id);
        await supabase.from('memorial_spaces').update({ facilities_id: keep.id }).eq('facilities_id', r.id);
        await supabase.from('reservations').update({ facility_id: keep.id }).eq('facility_id', r.id);
        await supabase.from('ai_consultations').update({ facility_id: keep.id }).eq('facility_id', r.id);
        // 삭제
        await supabase.from('facilities').delete().eq('id', r.id);
      }
      stats.dupes_removed++;
    }
  }
  console.log(`  중복 제거: ${stats.dupes_removed}건\n`);

  // ===== 6. funeral_companies 동기화 =====
  // DB는 UUID ID 사용, constants는 fc_new_1 등 문자열 ID → 이름으로 매칭
  console.log('--- 6. funeral_companies 동기화 ---');
  const { data: dbCompanies } = await supabase.from('funeral_companies').select('id,name');
  const dbNames = new Set((dbCompanies || []).map(c => c.name.trim()));

  // constants.ts에서 FUNERAL_COMPANIES + PET_FUNERAL_COMPANIES name 추출
  const constPath = path.resolve(__dirname, '../../constants.ts');
  const constContent = fs.readFileSync(constPath, 'utf-8');

  // name 추출 (fc_ 또는 pet_fc_ 블록 내의 name)
  const constNames: string[] = [];
  const blocks = constContent.matchAll(/id:\s*['"](?:fc_|pet_fc_)[^'"]*['"][\s\S]*?name:\s*['"]([^'"]+)['"]/g);
  for (const m of blocks) {
    constNames.push(m[1].trim());
  }

  const missing = constNames.filter(name => !dbNames.has(name));
  console.log(`  DB: ${dbNames.size}건 | Constants: ${constNames.length}건 | 이름 기준 누락: ${missing.length}건`);

  if (missing.length > 0) {
    for (const name of missing) {
      console.log(`  누락: ${name}`);
      if (!DRY_RUN) {
        const { error } = await supabase.from('funeral_companies').insert({
          id: crypto.randomUUID(),
          name,
          rating: 0,
          review_count: 0,
        });
        if (error) {
          console.log(`    ❌ INSERT 실패: ${error.message}`);
        } else {
          stats.funeral_synced++;
        }
      } else {
        stats.funeral_synced++;
      }
    }
  }
  console.log(`  동기화: ${stats.funeral_synced}건\n`);

  // ===== 결과 =====
  console.log('=== 최종 결과 ===');
  console.log(JSON.stringify(stats, null, 2));
  if (DRY_RUN) {
    console.log('\n⚠️ DRY RUN 모드: 실제 변경 없음. --dry-run 제거하고 재실행하세요.');
  } else {
    console.log('\n✅ 모든 수정 적용 완료');
  }
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
