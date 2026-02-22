
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

const TARGETS = [
    { id: 'fc8', name: '더리본 상조' }, // More specific
    { id: 'fc10', name: '한강라이프' }
];

async function searchImage(query: string) {
    try {
        const response = await axios.get('https://openapi.naver.com/v1/search/image', {
            params: { query: query + ' 로고', display: 5, sort: 'sim', filter: 'small' },
            headers: { 'X-Naver-Client-Id': NAVER_CLIENT_ID, 'X-Naver-Client-Secret': NAVER_CLIENT_SECRET }
        });
        // Try to find one that is NOT saramin if possible? Or just try all.
        // But we just return the first one for now or filter.
        return response.data.items[0]?.link;
    } catch (e) { return null; }
}

async function downloadImage(url: string, filepath: string) {
    try {
        const response = await axios.get(url, {
            responseType: 'stream',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Referer': 'https://www.google.com'
            }
        });
        await streamPipeline(response.data, fs.createWriteStream(filepath));
        return true;
    } catch (e) {
        console.error(`Generic download failed for ${url}: ${(e as any).message}`);
        return false;
    }
}

async function main() {
    console.log("🛠️ 실패한 로고 재시도 (User-Agent 추가)...");
    const dir = path.resolve(process.cwd(), 'public/images/logos');

    for (const company of TARGETS) {
        console.log(`Retrying ${company.name}...`);
        const url = await searchImage(company.name);
        if (url) {
            console.log(`Found URL: ${url}`);
            const ext = path.extname(url).split('?')[0] || '.jpg';
            const filename = `${company.id}${ext}`;
            const filepath = path.join(dir, filename);
            const success = await downloadImage(url, filepath);
            if (success) console.log(`  ✅ Saved: ${filename}`);
            else console.log(`  ❌ Still failed.`);
        }
    }
}

main();
