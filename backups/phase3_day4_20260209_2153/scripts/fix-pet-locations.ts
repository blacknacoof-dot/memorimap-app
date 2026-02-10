
import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as dotenv from 'dotenv';
import axios from 'axios';

// Load Env
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
);

// Nominatim Headers (Required to identify the application)
const HEADERS = {
    'User-Agent': 'MemoriMap-Fixer/1.0 (blacknacoof@gmail.com)' // Using user email if known or generic
};

async function fixPetLocations() {
    console.log("🛠️ Starting Pet Facility Location Fix...");

    // 1. Fetch targets (type='pet' and (lat is null OR data_source='naver_import'))
    const { data: targets, error } = await supabase
        .from('memorial_spaces')
        .select('id, name, address')
        .eq('type', 'pet')
        .or('lat.is.null,data_source.eq.naver_import');

    if (error) {
        console.error("❌ DB Fetch Error:", error);
        return;
    }

    // Filter out those that might already have valid lat (if data_source='naver_import' but mapped manually? unlikely)
    // Actually, let's just process all 'naver_import' ones to be sure, plus any nulls.
    // Check if lat is 0 or null.
    // Supabase query above gets nulls. Naver imports might have 0 or defaulted.
    // Let's rely on the query.

    console.log(`📋 Found ${targets.length} facilities to check/fix.`);

    let updatedCount = 0;

    for (const facility of targets) {
        if (!facility.address) {
            console.log(`Skip ${facility.name}: No address.`);
            continue;
        }

        console.log(`Processing: ${facility.name} (${facility.address})`);

        try {
            // Call Nominatim
            const response = await axios.get('https://nominatim.openstreetmap.org/search', {
                params: {
                    q: facility.address,
                    format: 'json',
                    limit: 1
                },
                headers: HEADERS
            });

            if (response.data && response.data.length > 0) {
                const result = response.data[0];
                const lat = parseFloat(result.lat);
                const lng = parseFloat(result.lon);

                console.log(`   -> Found: ${lat}, ${lng}`);

                // Update DB
                const { error: updateError } = await supabase
                    .from('memorial_spaces')
                    .update({ lat, lng, is_verified: true }) // Mark verified as we have coords now
                    .eq('id', facility.id);

                if (updateError) {
                    console.error(`   ❌ Update Failed: ${updateError.message}`);
                } else {
                    updatedCount++;
                }
            } else {
                console.log("   ⚠️ No results from Nominatim. Trying Naver Search Fallback...");
                // Fallback: If Nominatim fails, try to just retry or verify address?
                // For now, just log.
                // Or maybe clean address? (Remove building names, etc)
                const simpleAddress = facility.address.split(' ').slice(0, 3).join(' '); // 시 구 동 까지만
                if (simpleAddress !== facility.address) {
                    console.log(`   -> Retrying with simple address: ${simpleAddress}`);
                    const retryResponse = await axios.get('https://nominatim.openstreetmap.org/search', {
                        params: { q: simpleAddress, format: 'json', limit: 1 },
                        headers: HEADERS
                    });
                    if (retryResponse.data && retryResponse.data.length > 0) {
                        const res = retryResponse.data[0];
                        const lat = parseFloat(res.lat);
                        const lng = parseFloat(res.lon);
                        console.log(`   -> Found (Simple): ${lat}, ${lng}`);
                        await supabase.from('memorial_spaces').update({ lat, lng, is_verified: true }).eq('id', facility.id);
                        updatedCount++;
                    } else {
                        console.log("   ❌ Still no result.");
                    }
                }
            }
        } catch (err: any) {
            console.error(`   ❌ Error: ${err.message}`);
        }

        // Rate Limit Sleep (1.2 sec)
        await new Promise(r => setTimeout(r, 1200));
    }

    console.log(`✨ Process Complete. Updated ${updatedCount} facilities.`);
}

fixPetLocations();
