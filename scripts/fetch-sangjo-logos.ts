
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

const NAVER_CLIENT_ID = process.env.VITE_NAVER_CLIENT_ID || '';
const NAVER_CLIENT_SECRET = process.env.VITE_NAVER_CLIENT_SECRET || '';

const COMPANIES = [
    { id: 'fc1', name: '프리드라이프' },
    { id: 'fc2', name: '마음 상조' }, // Might be fictional?
    { id: 'fc3', name: '희망 상조' }, // Might be fictional?
    { id: 'fc4', name: '예다함상조' },
    { id: 'fc5', name: '보람상조' },
    { id: 'fc6', name: '부모사랑상조' }, // Added 상조 for better search
    { id: 'fc7', name: '더피플라이프' },
    { id: 'fc8', name: '더리본' },
    { id: 'fc9', name: '상조114' },
    { id: 'fc10', name: '한강라이프' }
];

async function searchImage(query: string) {
    try {
        const response = await axios.get('https://openapi.naver.com/v1/search/image', {
            params: { query: query + ' 로고', display: 1, sort: 'sim', filter: 'small' }, // Small for icons? Or medium.
            headers: { 'X-Naver-Client-Id': NAVER_CLIENT_ID, 'X-Naver-Client-Secret': NAVER_CLIENT_SECRET }
        });
        return response.data.items[0]?.link;
    } catch (e) {
        console.error(`Search failed for ${query}`);
        return null;
    }
}

async function downloadImage(url: string, filepath: string) {
    try {
        const response = await axios.get(url, { responseType: 'stream' });
        await streamPipeline(response.data, fs.createWriteStream(filepath));
        return true;
    } catch (e) {
        console.error(`Download failed for ${url}`);
        return false;
    }
}

async function main() {
    console.log("🔍 상조 회사 로고 검색 및 다운로드 시작...");

    // Ensure dir exists
    const dir = path.resolve(process.cwd(), 'public/images/logos');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    for (const company of COMPANIES) {
        console.log(`Processing ${company.name}...`);

        let imageUrl = await searchImage(company.name);
        if (!imageUrl) {
            // Retry without '로고' if fictional? Or generic
            console.log(`  - Logo not found, searching generic...`);
            // imageUrl = await searchImage(company.name); 
        }

        if (imageUrl) {
            const ext = path.extname(imageUrl).split('?')[0] || '.png';
            // Safety check for extension
            const safeExt = ['.png', '.jpg', '.jpeg', '.gif'].includes(ext.toLowerCase()) ? ext : '.png';

            const filename = `${company.id}${safeExt}`;
            const filepath = path.join(dir, filename);

            const success = await downloadImage(imageUrl, filepath);
            if (success) {
                console.log(`  ✅ Saved to public/images/logos/${filename}`);
            } else {
                console.log(`  ❌ Download failed`);
            }
        } else {
            console.log(`  ❌ Image not found`);
        }

        // Sleep to avoid rate limit
        await new Promise(r => setTimeout(r, 200));
    }
}

main();
