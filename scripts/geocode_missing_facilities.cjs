const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') }); // Load root .env.local

const supabaseUrl = 'https://xvmpvzldezpoxxsarizm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2bXB2emxkZXpwb3h4c2FyaXptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NTEwMTksImV4cCI6MjA4MTQyNzAxOX0.TC-SJKzTRANjoLiRi2yg_EHu6xLer2wr-RaJ4AWIv04';

const supabase = createClient(supabaseUrl, supabaseKey);

const NAVER_CLIENT_ID = process.env.VITE_NAVER_CLIENT_ID;
const NAVER_CLIENT_SECRET = process.env.VITE_NAVER_CLIENT_SECRET;

if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
    console.error("❌ Error: Missing Naver API Keys in .env.local");
    console.error("Expected: VITE_NAVER_CLIENT_ID, VITE_NAVER_CLIENT_SECRET");
    process.exit(1);
} else {
    console.log("✅ Naver API Keys detected.");
}

async function geocode() {
    console.log("Fetching facilities with missing coordinates...");

    // Fetch all facilities with NULL lat/lng
    // Supabase limit default 1000. Need loop if > 1000.
    // Since there are ~1264, let's fetch in batches or just use a loop.

    let allTargets = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
        const { data, error } = await supabase
            .from('memorial_spaces')
            .select('id, name, address')
            .or('lat.is.null,lng.is.null')
            .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) {
            console.error("DB Error:", error);
            break;
        }

        if (data && data.length > 0) {
            allTargets = allTargets.concat(data);
            if (data.length < pageSize) hasMore = false;
            page++;
        } else {
            hasMore = false;
        }
    }

    console.log(`Targets found: ${allTargets.length}`);

    let successCount = 0;
    let failCount = 0;

    for (const [index, facility] of allTargets.entries()) {
        const { id, name, address } = facility;

        if (!address) {
            console.log(`[${index + 1}/${allTargets.length}] Skip (No Address): ${name}`);
            failCount++;
            continue;
        }

        try {
            // Call Naver API
            const response = await axios.get('https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode', {
                params: { query: address },
                headers: {
                    'X-NCP-APIGW-API-KEY-ID': NAVER_CLIENT_ID,
                    'X-NCP-APIGW-API-KEY': NAVER_CLIENT_SECRET
                }
            });

            const items = response.data.addresses;
            if (items && items.length > 0) {
                const { x, y } = items[0]; // x: lng, y: lat
                const lat = parseFloat(y);
                const lng = parseFloat(x);

                // Update DB
                const { error: updateError } = await supabase
                    .from('memorial_spaces')
                    .update({ lat, lng })
                    .eq('id', id);

                if (updateError) {
                    console.error(`❌ Update Failed: ${name} (${updateError.message})`);
                    failCount++;
                } else {
                    console.log(`✅ [${index + 1}/${allTargets.length}] Success: ${name} -> ${lat}, ${lng}`);
                    successCount++;
                }
            } else {
                console.warn(`⚠️ Not Found: ${name} (${address})`);
                failCount++;
            }
        } catch (apiError) {
            console.error(`❌ API Error: ${name}`, apiError.message);
            failCount++;
        }

        // Rate limit delay (50ms)
        await new Promise(resolve => setTimeout(resolve, 50));
    }

    console.log("\n--- Geocoding Completed ---");
    console.log(`Success: ${successCount}`);
    console.log(`Failed: ${failCount}`);
}

geocode();
