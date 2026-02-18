import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Company {
  id: string;
  name: string;
  url: string;
}

const COMPANIES: Company[] = [
  { id: 'fc_new_1', name: '프리드라이프', url: 'https://www.freedlife.com' },
  { id: 'fc_new_2', name: '교원라이프', url: 'https://www.kyowonlife.co.kr' },
  { id: 'fc_new_3', name: '대명스테이션', url: 'https://www.daemyungstation.co.kr' },
  { id: 'fc_new_4', name: '더케이예다함', url: 'https://www.yedaham.co.kr' },
  { id: 'fc_new_5', name: '보람상조개발', url: 'https://www.boram.com' },
  { id: 'fc_new_6', name: '보람상조라이프', url: 'https://www.boram.com' },
  { id: 'fc_new_7', name: '부모사랑', url: 'https://www.bumosarang.co.kr' },
  { id: 'fc_new_8', name: '보람상조리더스', url: 'https://www.boram.com' },
  { id: 'fc_new_9', name: '더피플라이프', url: 'https://www.thepeoplelife.co.kr' },
  { id: 'fc_new_10', name: '더리본', url: 'https://www.the-reborn.co.kr' },
  { id: 'fc_new_11', name: '보람상조피플', url: 'https://www.boram.com' },
  { id: 'fc_new_12', name: '효원상조', url: 'https://www.hwsj.co.kr' },
  { id: 'fc_new_13', name: '늘곁애라이프온', url: 'https://www.lifeon.co.kr' },
  { id: 'fc_new_14', name: '평화누리', url: 'https://www.phnuri.co.kr' },
  { id: 'fc_new_15', name: 'SJ산림조합상조', url: 'https://www.sjsangjo.com' },
  { id: 'fc_new_16', name: '보람상조애니콜', url: 'https://www.boram.com' },
  { id: 'fc_new_17', name: '에이치디투어존', url: 'https://www.htourzone.kr' },
  { id: 'fc_new_18', name: '휴먼라이프', url: 'https://www.humanlifesj.com' },
  { id: 'fc_new_19', name: '제이케이', url: 'https://www.jk-life.co.kr' },
  { id: 'fc_new_20', name: '대노복지사업단', url: 'https://www.koreapeople.net' },
  { id: 'fc_new_21', name: '경우라이프', url: 'https://www.kwlife.co.kr' },
  { id: 'fc_new_22', name: '다온플랜', url: 'https://www.daonplan.com' },
  { id: 'fc_new_23', name: '에이플러스라이프', url: 'https://www.apluslife.co.kr' },
  { id: 'fc_new_24', name: '현대에스라이프', url: 'https://www.hyundaislife.com' },
  { id: 'fc_new_25', name: '한라상조', url: 'https://www.hallasangjo.co.kr' },
  { id: 'fc_new_26', name: '보람상조실로암', url: 'https://www.boram.com' },
  { id: 'fc_new_27', name: '디에스라이프', url: 'https://www.sangjo.com' },
  { id: 'fc_new_28', name: '엘비라이프', url: 'https://www.elbeelife.com' },
  { id: 'fc_new_29', name: '금호라이프', url: 'https://www.kumholife.co.kr' },
  { id: 'fc_new_30', name: '크리스찬상조', url: 'https://www.4christian.co.kr' },
  { id: 'fc_new_31', name: '우정라이프', url: 'https://www.ujeonglife.com' },
  { id: 'fc_new_32', name: '보훈상조', url: 'https://www.bohoon.co.kr' },
  { id: 'fc_new_33', name: '용인공원라이프', url: 'https://www.yonginparklife.com' },
  { id: 'fc_new_34', name: '불국토', url: 'https://www.bulgukto.co.kr' },
  { id: 'fc_new_35', name: '대한라이프보증', url: '' },
  { id: 'fc_new_36', name: '우리제주상조', url: 'https://www.woorijeju-sangjo.co.kr' },
  { id: 'fc_new_37', name: '유토피아퓨처', url: 'https://www.utopiafuture.co.kr' },
  { id: 'fc_new_38', name: '다나상조', url: 'https://www.danasj.co.kr' },
  { id: 'fc_new_39', name: '아가페라이프', url: 'https://www.agapelife.co.kr' },
  { id: 'fc_new_40', name: '웰리빙라이프', url: 'https://www.yeadream.com' },
  { id: 'fc_new_41', name: '삼육리더스라이프', url: 'https://www.sda36sj.co.kr' },
  { id: 'fc_new_42', name: '우리관광', url: '' },
  { id: 'fc_new_43', name: '세종라이프', url: 'https://www.sjlife.co.kr' },
  { id: 'fc_new_44', name: '삼우라이프', url: '' },
  { id: 'fc_new_45', name: '태양라이프', url: '' },
  { id: 'fc_new_46', name: '새부산상조', url: '' },
  { id: 'fc_post_1', name: '바른라이프', url: 'https://www.barunlife.co.kr' },
  { id: 'fc_post_2', name: '3일의약속', url: 'https://www.3dayspromise.co.kr' },
  { id: 'fc_post_3', name: '착한상조', url: 'https://www.chakhansangjo.co.kr' },
];

const PHONE_RE = /(?:1[56]\d{2}[-\s]?\d{4}|0[2-6]\d{0,2}[-\s]?\d{3,4}[-\s]?\d{4})/g;
const PRICE_RE = /(\d{1,3}[,.]?\d{0,3})\s*만\s*원/g;

async function fetchPage(url: string): Promise<{ html: string; ok: boolean; status: number }> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      redirect: 'follow',
    });
    clearTimeout(timer);
    const html = await res.text();
    return { html, ok: res.ok, status: res.status };
  } catch (e: any) {
    return { html: '', ok: false, status: 0 };
  }
}

function extractPhones(html: string): string[] {
  const matches = html.match(PHONE_RE) || [];
  return [...new Set(matches.map(m => m.replace(/\s/g, '')))];
}

function extractPrices(html: string): string[] {
  const matches = html.match(PRICE_RE) || [];
  return [...new Set(matches)].slice(0, 10);
}

function extractTitle(html: string): string {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return m ? m[1].trim() : '';
}

function extractMetaDesc(html: string): string {
  const m = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i)
    || html.match(/<meta\s+content=["']([^"']+)["']\s+name=["']description["']/i);
  return m ? m[1].trim() : '';
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function main() {
  console.log(`=== 상조 회사 크롤링 (${COMPANIES.length}개) ===\n`);
  const results: any[] = [];

  for (const co of COMPANIES) {
    if (!co.url) {
      console.log(`[SKIP] ${co.name} - URL 없음`);
      results.push({ ...co, status: 'no_url', phones: [], prices: [], title: '', desc: '' });
      continue;
    }

    console.log(`[CRAWL] ${co.name} → ${co.url}`);
    const { html, ok, status } = await fetchPage(co.url);

    if (!ok) {
      console.log(`  ❌ 접속 실패 (${status})`);
      results.push({ ...co, status: `fail_${status}`, phones: [], prices: [], title: '', desc: '' });
      await sleep(1000);
      continue;
    }

    const phones = extractPhones(html);
    const prices = extractPrices(html);
    const title = extractTitle(html);
    const desc = extractMetaDesc(html);

    console.log(`  ✅ ${title || '(제목없음)'} | 전화: ${phones.join(', ') || '없음'} | 가격: ${prices.length}개`);

    // 서브페이지 크롤링 (product/service)
    let subPhones: string[] = [];
    let subPrices: string[] = [];
    const subPaths = ['/product', '/service', '/price', '/introduction', '/company'];
    for (const sp of subPaths) {
      try {
        const subUrl = new URL(sp, co.url).href;
        const sub = await fetchPage(subUrl);
        if (sub.ok && sub.html.length > 500) {
          subPhones = subPhones.concat(extractPhones(sub.html));
          subPrices = subPrices.concat(extractPrices(sub.html));
        }
      } catch (_) {}
      await sleep(500);
    }

    const allPhones = [...new Set([...phones, ...subPhones])];
    const allPrices = [...new Set([...prices, ...subPrices])].slice(0, 15);

    results.push({
      ...co,
      status: 'ok',
      title,
      desc,
      phones: allPhones,
      prices: allPrices,
      html_length: html.length,
    });

    await sleep(1500);
  }

  // 요약
  const ok = results.filter(r => r.status === 'ok').length;
  const fail = results.filter(r => r.status.startsWith('fail')).length;
  const noUrl = results.filter(r => r.status === 'no_url').length;
  const withPhone = results.filter(r => r.phones.length > 0).length;
  const withPrice = results.filter(r => r.prices.length > 0).length;

  console.log(`\n=== 크롤링 완료 ===`);
  console.log(`성공: ${ok} | 실패: ${fail} | URL없음: ${noUrl}`);
  console.log(`전화번호 확보: ${withPhone} | 가격정보 확보: ${withPrice}`);

  const outPath = path.resolve(__dirname, '../../data/cleanup/sangjo_crawl_results.json');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
  console.log(`\n✅ 저장: data/cleanup/sangjo_crawl_results.json`);
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
