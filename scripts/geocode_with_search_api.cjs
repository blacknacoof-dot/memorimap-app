const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = 'https://xvmpvzldezpoxxsarizm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2bXB2emxkZXpwb3h4c2FyaXptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NTEwMTksImV4cCI6MjA4MTQyNzAxOX0.TC-SJKzTRANjoLiRi2yg_EHu6xLer2wr-RaJ4AWIv04';

const supabase = createClient(supabaseUrl, supabaseKey);

const NAVER_CLIENT_ID = process.env.VITE_NAVER_CLIENT_ID;
const NAVER_CLIENT_SECRET = process.env.VITE_NAVER_CLIENT_SECRET;

if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
    console.error("❌ Error: Missing keys (VITE_NAVER_CLIENT_ID/SECRET)");
    process.exit(1);
}

// Helper to clean HTML tags from title
function cleanTitle(title) {
    return title.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&');
}

async function run() {
    console.log("🚀 Starting Geocoding via Naver Search API...");

    // 1. Fetch Targets (NULL lat or NULL lng) - using updated count (approx 1264)
    let targets = [];
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
            console.error("DB Fetch Error:", error);
            break;
        }

        if (data && data.length > 0) {
            targets = targets.concat(data);
            if (data.length < pageSize) hasMore = false;
            page++;
        } else {
            hasMore = false;
        }
    }

    console.log(`🎯 Targets to geocode: ${targets.length}`);

    let success = 0;
    let failed = 0;
    let skipped = 0;

    for (const [i, item] of targets.entries()) {
        const { id, name, address } = item;

        // Search Query Strategy: Try "Address" first. If fails, try "Address Name"?
        // Usually Address is most accurate for coordinates.
        // But Search API is better with "Facility Name" sometimes if it's a famous place?
        // Let's try "Region + Name" as per previous script logic if Address exists.

        let query = address;
        if (!query) {
            console.log(`[${i + 1}] Skip (No Address): ${name}`);
            skipped++;
            continue;
        }

        // Clean query
        query = query.trim();

        try {
            const url = `https://openapi.naver.com/v1/search/local.json`;
            const res = await axios.get(url, {
                params: { query: query, display: 1 },
                headers: {
                    'X-Naver-Client-Id': NAVER_CLIENT_ID,
                    'X-Naver-Client-Secret': NAVER_CLIENT_SECRET
                }
            });

            if (res.data.items && res.data.items.length > 0) {
                const result = res.data.items[0];
                // Naver Search API returns integer mapx/mapy (scaled by 1e7)
                const lat = parseInt(result.mapy) / 10000000;
                const lng = parseInt(result.mapx) / 10000000;

                // Update DB
                const { error: updateErr } = await supabase
                    .from('memorial_spaces')
                    .update({ lat, lng })
                    .eq('id', id);

                if (updateErr) {
                    console.error(`❌ DB Update Failed: ${name}`, updateErr.message);
                    failed++;
                } else {
                    console.log(`✅ [${i + 1}/${targets.length}] ${name} -> ${lat}, ${lng}`);
                    success++;
                }
            } else {
                // Formatting
                console.log(`⚠️ Not Found: ${name} (${query})`);

                // Retry with Name only? Or Region + Name?
                // Let's try name + city prefix if address has it.
                // Simple retry: query = name
                // await new Promise(r => setTimeout(r, 100));
                // ... (skip complexity for now, stick to address or name)

                failed++;
            }
        } catch (e) {
            console.error(`❌ API Error: ${name}`, e.message);
            if (e.response && e.response.status === 401) {
                console.error("Critical: 401 Unauthorized. Stopping.");
                break;
            }
            failed++;
        }

        // Rate Limit (10 req/sec max usually)
        await new Promise(r => setTimeout(r, 80));
    }

    console.log("\n--- Summary ---");
    console.log(`Total: ${targets.length}`);
    console.log(`Success: ${success}`);
    console.log(`Failed: ${failed}`);
    console.log(`Skipped: ${skipped}`);
}

run();
