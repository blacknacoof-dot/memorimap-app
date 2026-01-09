
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function analyze() {
    console.log('Fetching addresses...');
    const { data, error } = await supabase
        .from('memorial_spaces')
        .select('address');

    if (error) {
        console.error('Error:', error);
        return;
    }

    const prefixes = {};
    const fullAddresses = [];

    data.forEach(item => {
        if (!item.address) return;
        fullAddresses.push(item.address);
        const parts = item.address.split(' ');
        const prefix = parts[0];
        prefixes[prefix] = (prefixes[prefix] || 0) + 1;
    });

    console.log('\n=== Address Prefix Distribution ===');
    const sortedPrefixes = Object.entries(prefixes).sort((a, b) => b[1] - a[1]);
    sortedPrefixes.forEach(([prefix, count]) => {
        console.log(`${prefix}: ${count}`);
    });

    console.log('\n=== Simulating Search Coverage ===');
    // Test cases: Short input vs Actual DB format
    // We want to verify if "City District" input matches "City... District..." via our % logic
    const testCases = [
        { input: '부산 금정구', dbMatchPrefix: '부산광역시 금정구' },
        { input: '서울 강남구', dbMatchPrefix: '서울특별시 강남구' },
        { input: '경기 수원', dbMatchPrefix: '경기도 수원' },
        { input: '경남 창원', dbMatchPrefix: '경상남도 창원' },
        { input: '전남 여수', dbMatchPrefix: '전라남도 여수' },
        { input: '충남 천안', dbMatchPrefix: '충청남도 천안' },
    ];

    // Check if valid DB entries exist for these standard formats
    for (const test of testCases) {
        const pattern = '%' + test.input.split(' ').join('%') + '%';
        // Simulation only: checking if DB has entries starting with expected full name
        const matchCount = fullAddresses.filter(addr => addr.startsWith(test.dbMatchPrefix)).length;

        console.log(`[Test] Input: "${test.input}" (Pattern: "${pattern}")`);
        console.log(`       Target DB Format: "${test.dbMatchPrefix}" -> Valid Rows Found: ${matchCount}`);

        if (matchCount === 0) {
            console.warn(`       ⚠️ WARNING: No facilities found for standard format "${test.dbMatchPrefix}". Check DB data.`);
        } else {
            console.log(`       ✅ Verified.`);
        }
    }
}

analyze();
