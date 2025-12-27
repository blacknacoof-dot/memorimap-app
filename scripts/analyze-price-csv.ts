import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import iconv from 'iconv-lite';

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseKey = envConfig.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Read CSV file with EUC-KR encoding
const csvPath = path.resolve(process.cwd(), 'data', '2023년 6월', '2.장례식장가격정보_20230601.csv');
const buffer = fs.readFileSync(csvPath);
const content = iconv.decode(buffer, 'euc-kr');

const lines = content.split('\n').filter(line => line.trim());
console.log('=== CSV 파일 분석 ===');
console.log(`총 라인 수: ${lines.length}`);
console.log('\n헤더:', lines[0]);
console.log('\n처음 20줄 샘플:');
lines.slice(1, 21).forEach((line, i) => {
    console.log(`${i + 1}. ${line}`);
});

// 카테고리 분석
const categories = new Map<string, number>();
const items = new Map<string, number>();

for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    if (cols.length >= 5) {
        const category = cols[3]?.trim(); // 그룹 컬럼
        const item = cols[4]?.trim(); // 품목 컬럼

        if (category) {
            categories.set(category, (categories.get(category) || 0) + 1);
        }
        if (item) {
            items.set(item, (items.get(item) || 0) + 1);
        }
    }
}

console.log('\n=== 카테고리(그룹) 분석 ===');
const sortedCategories = [...categories.entries()].sort((a, b) => b[1] - a[1]);
sortedCategories.forEach(([cat, count]) => {
    console.log(`${cat}: ${count}건`);
});

console.log('\n=== 품목 분석 (상위 30개) ===');
const sortedItems = [...items.entries()].sort((a, b) => b[1] - a[1]).slice(0, 30);
sortedItems.forEach(([item, count]) => {
    console.log(`${item}: ${count}건`);
});
