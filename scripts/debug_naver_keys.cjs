const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

console.log("--- Env Var Check ---");
const keys = [
    'NAVER_CLIENT_ID', 'NAVER_CLIENT_SECRET',
    'VITE_NAVER_CLIENT_ID', 'VITE_NAVER_CLIENT_SECRET',
    'VITE_NAVER_MAP_CLIENT_ID', 'VITE_NAVER_MAP_CLIENT_SECRET'
];

keys.forEach(key => {
    const val = process.env[key];
    if (val) {
        console.log(`${key}: Found (Length: ${val.length}, Starts: ${val.substring(0, 3)}...)`);
    } else {
        console.log(`${key}: Missing`);
    }
});
