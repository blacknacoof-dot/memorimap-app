import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const naverClientId = process.env.VITE_NAVER_CLIENT_ID!;
const naverClientSecret = process.env.VITE_NAVER_CLIENT_SECRET!;

async function searchNaver(query: string) {
    const url = `https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(query)}&display=5`;
    const response = await axios.get(url, {
        headers: {
            'X-Naver-Client-Id': naverClientId,
            'X-Naver-Client-Secret': naverClientSecret
        }
    });

    console.log(`검색어: ${query}`);
    console.log('='.repeat(50));

    response.data.items.forEach((item: any, i: number) => {
        console.log(`[${i + 1}] ${item.title.replace(/<[^>]*>/g, '')}`);
        console.log(`   주소: ${item.roadAddress || item.address}`);
        console.log(`   전화: ${item.telephone}`);
        console.log(`   좌표: mapx=${item.mapx}, mapy=${item.mapy}`);
        console.log('');
    });
}

searchNaver('경기 광주시 시안 가족추모공원');
