
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

console.log('Checking Naver API Keys...');
console.log('NAVER_CLIENT_ID:', process.env.NAVER_CLIENT_ID ? 'Exists' : 'Missing');
console.log('NAVER_CLIENT_SECRET:', process.env.NAVER_CLIENT_SECRET ? 'Exists' : 'Missing');
console.log('VITE_KAKAO_REST_API_KEY:', process.env.VITE_KAKAO_REST_API_KEY ? 'Exists' : 'Missing');
