
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
    console.log('--- Checking Missing Sangjo Product Data ---');

    // 1. Get all Sangjo companies
    const { data: sangjoList, error } = await supabase
        .from('memorial_spaces')
        .select('id, name, price_info')
        .eq('type', 'sangjo');

    if (error) {
        console.error('Error fetching data:', error);
        return;
    }

    const missingDataCompanies: string[] = [];
    const validCompanies: string[] = [];

    sangjoList.forEach(company => {
        const hasProducts = company.price_info &&
            company.price_info.products &&
            Array.isArray(company.price_info.products) &&
            company.price_info.products.length > 0;

        if (!hasProducts) {
            missingDataCompanies.push(company.name);
        } else {
            validCompanies.push(`${company.name} (${company.price_info.products.length} products)`);
        }
    });

    console.log(`\nTotal Sangjo Companies Found: ${sangjoList.length}`);

    console.log(`\n✅ Companies with Data (${validCompanies.length}):`);
    validCompanies.forEach(c => console.log(` - ${c}`));

    console.log(`\n❌ Companies Missing Data (${missingDataCompanies.length}):`);
    if (missingDataCompanies.length > 0) {
        missingDataCompanies.forEach(c => console.log(` - ${c}`));
    } else {
        console.log(' - None (All clear!)');
    }
}

run();
