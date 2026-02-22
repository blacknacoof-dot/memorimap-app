
import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import axios from 'axios';
import { pipeline } from 'stream';
import { promisify } from 'util';

const streamPipeline = promisify(pipeline);
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID || '';
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET || '';

const RAW_DATA = `1,프리드라이프,https://www.freedlife.com,https://logo.clearbit.com/freedlife.com
2,교원라이프,https://www.kyowonlife.co.kr,https://logo.clearbit.com/kyowonlife.co.kr
3,대명스테이션,https://www.daemyungstation.co.kr,https://logo.clearbit.com/daemyungstation.co.kr
4,더케이예다함,https://www.yedaham.co.kr,https://logo.clearbit.com/yedaham.co.kr
5,보람상조개발,https://www.boram.com,https://logo.clearbit.com/boram.com
6,보람상조라이프,https://www.boram.com,https://logo.clearbit.com/boram.com
7,부모사랑,https://www.bumosarang.co.kr,https://logo.clearbit.com/bumosarang.co.kr
8,보람상조리더스,https://www.boram.com,https://logo.clearbit.com/boram.com
9,더피플라이프,https://www.thepeoplelife.co.kr,https://logo.clearbit.com/thepeoplelife.co.kr
10,더리본,https://www.the-reborn.co.kr,https://logo.clearbit.com/the-reborn.co.kr
11,보람상조피플,https://www.boram.com,https://logo.clearbit.com/boram.com
12,효원상조,https://www.hwsj.co.kr,https://logo.clearbit.com/hwsj.co.kr
13,늘곁애라이프온,https://www.lifeon.co.kr,https://logo.clearbit.com/lifeon.co.kr
14,평화누리,https://www.phnuri.co.kr,https://logo.clearbit.com/phnuri.co.kr
15,SJ산림조합상조,https://www.sjsangjo.com,https://logo.clearbit.com/sjsangjo.com
16,보람상조애니콜,https://www.boram.com,https://logo.clearbit.com/boram.com
17,에이치디투어존,https://www.htourzone.kr,https://logo.clearbit.com/htourzone.kr
18,휴먼라이프,https://www.humanlifesj.com,https://logo.clearbit.com/humanlifesj.com
19,제이케이,https://www.jk-life.co.kr,https://logo.clearbit.com/jk-life.co.kr
20,대노복지사업단,https://www.koreapeople.net,https://logo.clearbit.com/koreapeople.net
21,경우라이프,https://www.kwlife.co.kr,https://logo.clearbit.com/kwlife.co.kr
22,다온플랜,https://www.daonplan.com,https://logo.clearbit.com/daonplan.com
23,에이플러스라이프,https://www.apluslife.co.kr,https://logo.clearbit.com/apluslife.co.kr
24,현대에스라이프,https://www.hyundaislife.com,https://logo.clearbit.com/hyundaislife.com
25,한라상조,https://www.hallasangjo.co.kr,https://logo.clearbit.com/hallasangjo.co.kr
26,보람상조실로암,https://www.boram.com,https://logo.clearbit.com/boram.com
27,디에스라이프,https://www.sangjo.com,https://logo.clearbit.com/sangjo.com
28,엘비라이프,https://www.elbeelife.com,https://logo.clearbit.com/elbeelife.com
29,금호라이프,https://www.kumholife.co.kr,https://logo.clearbit.com/kumholife.co.kr
30,크리스찬상조,https://www.4christian.co.kr,https://logo.clearbit.com/4christian.co.kr
31,우정라이프,https://www.ujeonglife.com,https://logo.clearbit.com/ujeonglife.com
32,보훈상조,https://www.bohoon.co.kr,https://logo.clearbit.com/bohoon.co.kr
33,용인공원라이프,https://www.yonginparklife.com,https://logo.clearbit.com/yonginparklife.com
34,불국토,https://www.bulgukto.co.kr,https://logo.clearbit.com/bulgukto.co.kr
35,대한라이프보증,,
36,우리제주상조,https://www.woorijeju-sangjo.co.kr,https://logo.clearbit.com/woorijeju-sangjo.co.kr
37,유토피아퓨처,https://www.utopiafuture.co.kr,https://logo.clearbit.com/utopiafuture.co.kr
38,다나상조,https://www.danasj.co.kr,https://logo.clearbit.com/danasj.co.kr
39,아가페라이프,https://www.agapelife.co.kr,https://logo.clearbit.com/agapelife.co.kr
40,웰리빙라이프,https://www.yeadream.com,https://logo.clearbit.com/yeadream.com
41,삼육리더스라이프,https://www.sda36sj.co.kr,https://logo.clearbit.com/sda36sj.co.kr
42,우리관광,,
43,세종라이프,https://www.sjlife.co.kr,https://logo.clearbit.com/sjlife.co.kr
44,삼우라이프,,
45,태양라이프,,
46,새부산상조,,`;

async function searchNaverLocal(query: string) {
    if (!NAVER_CLIENT_ID) return null;
    try {
        const response = await axios.get('https://openapi.naver.com/v1/search/local.json', {
            params: { query: query, display: 1, sort: 'comment' }, // comment sort prefers popular places
            headers: { 'X-Naver-Client-Id': NAVER_CLIENT_ID, 'X-Naver-Client-Secret': NAVER_CLIENT_SECRET }
        });
        return response.data.items[0]; // { title, link, category, telephone, address, roadAddress, mapx, mapy }
    } catch (e) { return null; }
}

async function searchNaverImage(query: string) {
    if (!NAVER_CLIENT_ID) return null;
    try {
        const response = await axios.get('https://openapi.naver.com/v1/search/image', {
            params: { query: query + ' 로고', display: 1, sort: 'sim', filter: 'small' },
            headers: { 'X-Naver-Client-Id': NAVER_CLIENT_ID, 'X-Naver-Client-Secret': NAVER_CLIENT_SECRET }
        });
        return response.data.items[0]?.link;
    } catch (e) { return null; }
}

async function downloadImage(url: string, filepath: string) {
    try {
        const response = await axios.get(url, { responseType: 'stream', timeout: 5000 });
        await streamPipeline(response.data, fs.createWriteStream(filepath));
        return true;
    } catch (e) {
        // console.error(`Failed to download ${url}`);
        return false;
    }
}

async function main() {
    console.log("🚀 상조 회사 데이터 보강 시작...");

    const lines = RAW_DATA.split('\n').filter(l => l.trim());
    const enrichedData: any[] = [];
    const logoDir = path.resolve(process.cwd(), 'public/images/logos');
    if (!fs.existsSync(logoDir)) fs.mkdirSync(logoDir, { recursive: true });

    let stats = { total: lines.length, phoneFound: 0, logoDownloaded: 0 };

    for (const line of lines) {
        const [rank, name, homepage, logoUrl] = line.split(',').map(s => s.trim());
        const id = `fc_new_${rank}`;

        console.log(`Processing [${rank}] ${name}...`);

        let phone = '';
        let description = '믿을 수 있는 상조 서비스';

        // 1. Search Local for Phone
        const local = await searchNaverLocal(name);
        if (local && local.telephone) {
            phone = local.telephone;
            stats.phoneFound++;
        }

        // 2. Logo Handling
        let finalLogoPath = `/images/logos/${id}.png`; // Default
        const localLogoPath = path.join(logoDir, `${id}.png`);

        let logoSuccess = false;

        // Try Clearbit first
        if (logoUrl) {
            logoSuccess = await downloadImage(logoUrl, localLogoPath);
        }

        // Fallback to Naver Image
        if (!logoSuccess) {
            const naverImgUrl = await searchNaverImage(name);
            if (naverImgUrl) {
                logoSuccess = await downloadImage(naverImgUrl, localLogoPath);
            }
        }

        if (logoSuccess) stats.logoDownloaded++;
        else finalLogoPath = ''; // Or handling logic

        enrichedData.push({
            id: id,
            rank: parseInt(rank),
            name: name,
            homepage: homepage || '',
            phone: phone || '1588-0000', // Default placeholder if missing
            imageUrl: finalLogoPath || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=800', // Unsplash fallback
            description: description,
            rating: (5.0 - (parseInt(rank) * 0.02)).toFixed(1), // Fake rating based on rank for demo
            reviewCount: 1000 - (parseInt(rank) * 10), // Fake reviews
            features: ['전국 의전망', '24시간 상담'], // Default features
            priceRange: '문의',
            benefits: ['회원 전용 혜택']
        });

        // Rate limit
        await new Promise(r => setTimeout(r, 200));
    }

    // Save Result
    const outputPath = path.resolve(process.cwd(), 'data/sangjo_enriched.json');
    if (!fs.existsSync(path.dirname(outputPath))) fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(enrichedData, null, 2));

    console.log("\n✅ 완료!");
    console.log(`- 전체: ${stats.total}`);
    console.log(`- 전화번호 발견: ${stats.phoneFound}`);
    console.log(`- 로고 다운로드: ${stats.logoDownloaded}`);
    console.log(`- 저장됨: ${outputPath}`);
}

main();
