
import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

// Load Env
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
);

async function uploadSamples() {
    console.log("🚀 Uploading Price Samples...");

    if (!fs.existsSync('temp_price_samples.json')) {
        console.error("❌ temp_price_samples.json not found. Run verification script first.");
        return;
    }

    const raw = fs.readFileSync('temp_price_samples.json', 'utf-8');
    const data = JSON.parse(raw);
    const allSamples = [...data.funerals, ...data.others];

    console.log(`📦 Found ${allSamples.length} samples to update.`);

    let success = 0;
    let fail = 0;

    for (const item of allSamples) {
        console.log(`   Processing ${item.name}...`);

        // Construct a structured price info object
        // The DB might expect a specific format, but since it's likely JSONB, we'll store the array directly 
        // or a wrapped object.
        const priceInfo = {
            updated_at: new Date().toISOString(),
            source: '2023_public_data',
            items: item.prices
        };

        const { error } = await supabase
            .from('memorial_spaces')
            .update({
                price_info: priceInfo,
                // Also update description to indicate price info is available? Optional.
                is_verified: true // Mark as verified as we have official data?
            })
            .eq('id', item.id);

        if (error) {
            console.error(`   ❌ Update failed for ${item.name}: ${error.message}`);
            fail++;
        } else {
            success++;
        }
    }

    console.log(`\n✨ Upload Complete!`);
    console.log(`✅ Success: ${success}`);
    console.log(`❌ Failed: ${fail}`);
}

uploadSamples();
