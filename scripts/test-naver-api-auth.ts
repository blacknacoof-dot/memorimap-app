/**
 * Test Naver Geocoding API Authentication
 */

import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const NAVER_CLIENT_ID = process.env.VITE_NAVER_CLIENT_ID;
const NAVER_CLIENT_SECRET = process.env.VITE_NAVER_CLIENT_SECRET;

async function testNaverAuth() {
    console.log('🔍 Testing Naver API Authentication...\n');

    console.log('Credentials from .env.local:');
    console.log(`  Client ID: ${NAVER_CLIENT_ID}`);
    console.log(`  Client Secret: ${NAVER_CLIENT_SECRET ? '***' + NAVER_CLIENT_SECRET.slice(-3) : 'NOT FOUND'}\n`);

    if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
        console.error('❌ Credentials not found in .env.local file');
        return;
    }

    const testAddress = '부산광역시 해운대구 달맞이길 62';

    console.log('Testing with address:', testAddress);
    console.log('\n--- Attempt 1: Naver Cloud Platform (NCP) API ---');

    try {
        const ncpResponse = await axios.get(
            'https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode',
            {
                params: { query: testAddress },
                headers: {
                    'X-NCP-APIGW-API-KEY-ID': NAVER_CLIENT_ID,
                    'X-NCP-APIGW-API-KEY': NAVER_CLIENT_SECRET
                }
            }
        );

        console.log('✅ NCP API Success!');
        console.log('Response:', JSON.stringify(ncpResponse.data, null, 2));
    } catch (error: any) {
        console.log('❌ NCP API Failed');
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Error:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.log('Error:', error.message);
        }
    }

    console.log('\n--- Attempt 2: Naver Developers API (Legacy) ---');

    try {
        const devResponse = await axios.get(
            'https://openapi.naver.com/v1/map/geocode',
            {
                params: { query: testAddress },
                headers: {
                    'X-Naver-Client-Id': NAVER_CLIENT_ID,
                    'X-Naver-Client-Secret': NAVER_CLIENT_SECRET
                }
            }
        );

        console.log('✅ Developers API Success!');
        console.log('Response:', JSON.stringify(devResponse.data, null, 2));
    } catch (error: any) {
        console.log('❌ Developers API Failed');
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Error:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.log('Error:', error.message);
        }
    }

    console.log('\n--- Attempt 3: Kakao API (Alternative) ---');

    const KAKAO_KEY = process.env.VITE_KAKAO_REST_API_KEY;
    console.log(`Kakao Key: ${KAKAO_KEY ? '***' + KAKAO_KEY.slice(-3) : 'NOT FOUND'}`);

    if (KAKAO_KEY) {
        try {
            const kakaoResponse = await axios.get(
                'https://dapi.kakao.com/v2/local/search/address.json',
                {
                    params: { query: testAddress },
                    headers: {
                        'Authorization': `KakaoAK ${KAKAO_KEY}`
                    }
                }
            );

            console.log('✅ Kakao API Success!');
            if (kakaoResponse.data.documents && kakaoResponse.data.documents.length > 0) {
                const result = kakaoResponse.data.documents[0];
                console.log('Address:', result.address_name);
                console.log('Coordinates:', {
                    lat: result.y,
                    lng: result.x
                });
            } else {
                console.log('No results found');
            }
        } catch (error: any) {
            console.log('❌ Kakao API Failed');
            if (error.response) {
                console.log('Status:', error.response.status);
                console.log('Error:', JSON.stringify(error.response.data, null, 2));
            } else {
                console.log('Error:', error.message);
            }
        }
    }
}

testNaverAuth()
    .then(() => {
        console.log('\n✅ Test complete');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
