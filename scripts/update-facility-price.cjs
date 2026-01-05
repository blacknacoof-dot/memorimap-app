
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
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

async function updatePrice() {
    const args = process.argv.slice(2);
    if (args.length < 3) {
        console.error('Usage: node update-facility-price.cjs <facility_id> <price_range> <price_json>');
        console.log('Example: node update-facility-price.cjs 123 "100~300만원" "[{\\"type\\":\\"standard\\",\\"price\\":\\"2000000\\"}]"');
        process.exit(1);
    }

    const facilityId = args[0];
    const priceRange = args[1];
    let priceJson;

    try {
        priceJson = JSON.parse(args[2]);
    } catch (e) {
        console.error('Invalid JSON for price_json:', e.message);
        process.exit(1);
    }

    console.log(`Updating facility ${facilityId}...`);
    console.log(`Price Range: ${priceRange}`);
    console.log(`Prices:`, priceJson);

    const { error } = await supabase
        .from('memorial_spaces')
        .update({
            price_range: priceRange,
            prices: priceJson,
            data_source: 'admin' // Mark as manually updated
        })
        .eq('id', facilityId);

    if (error) {
        console.error('Error updating facility:', error);
        process.exit(1);
    }

    console.log('Successfully updated facility price.');
}

updatePrice();
