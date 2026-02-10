
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables
const envPath = path.resolve(__dirname, '../.env.local');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function analyzeMissingPrices() {
    console.log('Analyzing facilities with missing prices...');

    const { data: facilities, error } = await supabase
        .from('memorial_spaces')
        .select('id, name, type, address, price_range, prices');

    if (error) {
        console.error('Error fetching facilities:', error);
        return;
    }

    let missingCount = 0;
    const missingList = [];

    for (const facility of facilities) {
        const hasPriceRange = facility.price_range && facility.price_range !== '가격 정보 없음' && facility.price_range !== '';
        // Check if prices JSON is empty or invalid
        let hasPricesJson = false;
        if (facility.prices && Array.isArray(facility.prices) && facility.prices.length > 0) {
            hasPricesJson = true;
        }

        if (!hasPriceRange && !hasPricesJson) {
            missingCount++;
            missingList.push({
                id: facility.id,
                name: facility.name,
                type: facility.type,
                address: facility.address
            });
        }
    }

    console.log(`Total facilities: ${facilities.length}`);
    console.log(`Facilities with missing prices: ${missingCount}`);

    // Save list to file
    const outputPath = path.resolve(__dirname, '../missing_prices_report.json');
    fs.writeFileSync(outputPath, JSON.stringify(missingList, null, 2));
    console.log(`Report saved to ${outputPath}`);

    // Preview first 5
    console.log('Preview of missing facilities:');
    console.log(missingList.slice(0, 5));
}

analyzeMissingPrices();
