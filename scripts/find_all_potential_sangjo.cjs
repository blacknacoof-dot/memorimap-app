const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const dotenv = require('dotenv');

const envPath = path.resolve(__dirname, '../.env.local');
dotenv.config({ path: envPath });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function findAllSangjo() {
    console.log('Searching for ALL potential Sangjo companies...');

    // Common keywords for Sangjo companies
    const keywords = [
        '상조', '라이프', '스테이션', '예다함', '프리드', '보람', '교원',
        '대명', '더케이', '부모사랑', '더리본', '효원', '한라', '재향군인',
        '평화', '늘곁애', '한효', '국방', '좋은'
    ];

    let allFound = [];

    for (const keyword of keywords) {
        const { data, error } = await supabase
            .from('memorial_spaces')
            .select('id, name, category')
            .ilike('name', `%${keyword}%`);

        if (data) allFound.push(...data);
    }

    // Dedup by ID
    const unique = Array.from(new Map(allFound.map(item => [item.id, item])).values());

    // Filter out obviously non-sangjo (e.g., if it's clearly a funeral hall but has "Good" in name, though "좋은" is vague)
    // Let's rely on manual review of the list or name patterns.
    // Actually, user says 39. Let's see how many we have that match "Sangjo" patterns.

    console.log(`Total unique potential matches: ${unique.length}`);

    // Sort by category to see distribution
    unique.sort((a, b) => a.category.localeCompare(b.category));

    console.table(unique.map(u => ({ id: u.id, name: u.name, category: u.category })));
}

findAllSangjo();
