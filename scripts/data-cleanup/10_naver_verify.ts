/**
 * 네이버 로컬 검색 API로 facilities 데이터 교차검증
 *
 * 검증 항목:
 * 1. 주소 일치 여부 (DB vs 네이버)
 * 2. 전화번호 누락 보충
 * 3. 좌표 0인 건 보정
 *
 * 사용법: npx tsx scripts/data-cleanup/10_naver_verify.ts
 */
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const NAVER_CLIENT_ID = process.env.VITE_NAVER_CLIENT_ID;
const NAVER_CLIENT_SECRET = process.env.VITE_NAVER_CLIENT_SECRET;

if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
  console.error('❌ VITE_NAVER_CLIENT_ID / VITE_NAVER_CLIENT_SECRET 없음 (.env.local)');
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ===== 네이버 로컬 검색 =====
interface NaverLocalItem {
  title: string;
  link: string;
  category: string;
  description: string;
  telephone: string;
  address: string;
  roadAddress: string;
  mapx: string;
  mapy: string;
}

async function searchNaver(query: string): Promise<NaverLocalItem[]> {
  const url = `https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(query)}&display=5&sort=random`;
  const res = await fetch(url, {
    headers: {
      'X-Naver-Client-Id': NAVER_CLIENT_ID!,
      'X-Naver-Client-Secret': NAVER_CLIENT_SECRET!,
    },
  });
  if (!res.ok) {
    console.error(`네이버 API 오류: ${res.status} ${res.statusText}`);
    return [];
  }
  const json = await res.json();
  return json.items || [];
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, '');
}

// 네이버 좌표 변환 (카텍 → WGS84 근사)
// 네이버 mapx/mapy는 KATEC 좌표계 (단위: 1/10,000,000)
function katecToWgs84(mapx: string, mapy: string): { lat: number; lng: number } {
  // 네이버 API의 mapx, mapy는 실제로는 경도/위도의 10^7배
  const lng = Number(mapx) / 10000000;
  const lat = Number(mapy) / 10000000;
  return { lat, lng };
}

// 주소 유사도 비교
function normalizeAddr(addr: string): string {
  return addr
    .replace(/\s+/g, ' ')
    .replace(/^경기\s/, '경기도 ')
    .replace(/^서울\s/, '서울특별시 ')
    .replace(/^부산\s/, '부산광역시 ')
    .replace(/^대구\s/, '대구광역시 ')
    .replace(/^인천\s/, '인천광역시 ')
    .replace(/^광주\s/, '광주광역시 ')
    .replace(/^대전\s/, '대전광역시 ')
    .replace(/^울산\s/, '울산광역시 ')
    .replace(/^경북\s/, '경상북도 ')
    .replace(/^경남\s/, '경상남도 ')
    .replace(/^충남\s/, '충청남도 ')
    .replace(/^충북\s/, '충청북도 ')
    .replace(/^전남\s/, '전라남도 ')
    .replace(/^전북\s/, '전북특별자치도 ')
    .replace(/^강원\s/, '강원특별자치도 ')
    .trim();
}

function addrMatch(db: string, naver: string): 'exact' | 'partial' | 'mismatch' {
  const a = normalizeAddr(db);
  const b = normalizeAddr(naver);
  if (a === b) return 'exact';
  // 도로명 vs 지번 차이 등: 시/구/동 단위까지 일치하면 partial
  const aParts = a.split(' ').slice(0, 3).join(' ');
  const bParts = b.split(' ').slice(0, 3).join(' ');
  if (aParts === bParts) return 'partial';
  return 'mismatch';
}

// ===== 메인 =====
async function main() {
  console.log('=== 네이버 로컬 검색 교차검증 ===\n');

  // DB에서 전체 활성 시설 가져오기
  let all: any[] = [];
  for (let p = 0; ; p++) {
    const { data, error } = await supabase
      .from('facilities')
      .select('id,name,type,address,latitude,longitude,phone,image_url,status')
      .eq('status', 'active')
      .range(p * 1000, (p + 1) * 1000 - 1);
    if (error) { console.error('DB 에러:', error); break; }
    if (!data || data.length === 0) break;
    all = all.concat(data);
    if (data.length < 1000) break;
  }
  console.log(`활성 시설: ${all.length}건\n`);

  const results = {
    timestamp: new Date().toISOString(),
    total: all.length,
    verified: 0,
    not_found: 0,
    address_exact: 0,
    address_partial: 0,
    address_mismatch: 0,
    phone_added: 0,
    coords_fixed: 0,
    details: [] as any[],
    mismatches: [] as any[],
    phone_fills: [] as any[],
    coord_fixes: [] as any[],
    not_found_list: [] as any[],
  };

  // 배치 처리 (rate limit: 25,000/일, 초당 ~5건 안전)
  const BATCH_DELAY = 220; // ms between requests (~4.5 req/sec)
  let processed = 0;

  for (const facility of all) {
    processed++;
    if (processed % 100 === 0) {
      console.log(`진행: ${processed}/${all.length} (${Math.round(processed / all.length * 100)}%)`);
    }

    // 검색어: 시설명 (지역 추가하면 정확도 향상)
    const region = (facility.address || '').split(' ')[0] || '';
    const query = `${facility.name} ${region}`.trim();

    const items = await searchNaver(query);
    await new Promise(r => setTimeout(r, BATCH_DELAY));

    if (items.length === 0) {
      results.not_found++;
      results.not_found_list.push({
        id: facility.id,
        name: facility.name,
        type: facility.type,
        address: facility.address,
      });
      continue;
    }

    // 가장 일치하는 항목 찾기 (이름 유사도)
    const best = items.find(item => {
      const title = stripHtml(item.title);
      return title.includes(facility.name) || facility.name.includes(title);
    }) || items[0];

    const naverTitle = stripHtml(best.title);
    const naverAddr = best.roadAddress || best.address || '';
    const naverPhone = best.telephone || '';

    // 주소 비교
    const match = addrMatch(facility.address || '', naverAddr);
    if (match === 'exact') results.address_exact++;
    else if (match === 'partial') results.address_partial++;
    else {
      results.address_mismatch++;
      results.mismatches.push({
        id: facility.id,
        name: facility.name,
        type: facility.type,
        db_address: facility.address,
        naver_address: naverAddr,
        naver_title: naverTitle,
      });
    }

    // 전화번호 보충
    if (!facility.phone && naverPhone) {
      results.phone_added++;
      results.phone_fills.push({
        id: facility.id,
        name: facility.name,
        naver_phone: naverPhone,
      });
    }

    // 좌표 보정
    const lat = Number(facility.latitude);
    const lng = Number(facility.longitude);
    if ((!lat || !lng) && best.mapx && best.mapy) {
      const coords = katecToWgs84(best.mapx, best.mapy);
      if (coords.lat >= 33 && coords.lat <= 39 && coords.lng >= 124 && coords.lng <= 132) {
        results.coords_fixed++;
        results.coord_fixes.push({
          id: facility.id,
          name: facility.name,
          old_lat: lat,
          old_lng: lng,
          new_lat: coords.lat,
          new_lng: coords.lng,
        });
      }
    }

    results.verified++;
  }

  // 요약
  console.log('\n=== 결과 요약 ===');
  console.log(`검증 완료: ${results.verified}/${results.total}`);
  console.log(`미발견: ${results.not_found}`);
  console.log(`주소 일치: exact=${results.address_exact}, partial=${results.address_partial}, mismatch=${results.address_mismatch}`);
  console.log(`전화번호 보충 가능: ${results.phone_added}건`);
  console.log(`좌표 보정 가능: ${results.coords_fixed}건`);
  console.log(`주소 불일치 상위 10건:`);
  results.mismatches.slice(0, 10).forEach(m => {
    console.log(`  ${m.name}: "${m.db_address}" → "${m.naver_address}"`);
  });

  // 저장
  const outPath = path.resolve(__dirname, '../../data/cleanup/naver_verification.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
  console.log(`\n✅ 저장: data/cleanup/naver_verification.json`);
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
