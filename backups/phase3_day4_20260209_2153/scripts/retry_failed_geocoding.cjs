const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = 'https://xvmpvzldezpoxxsarizm.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
    console.warn("⚠️ Warning: Service Role Key not found. Updates might fail due to RLS.");
    // Fallback to anon key if service key missing (but expected to fail for update)
    // using the previously hardcoded anon key as fallback just in case, but logging warning.
    // Actually, better to fail or use the hardcoded one if env var is missing but we know we likely need service key.
}

const supabase = createClient(supabaseUrl, supabaseKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2bXB2emxkZXpwb3h4c2FyaXptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NTEwMTksImV4cCI6MjA4MTQyNzAxOX0.TC-SJKzTRANjoLiRi2yg_EHu6xLer2wr-RaJ4AWIv04');

const KAKAO_API_KEY = process.env.VITE_KAKAO_REST_API_KEY;

if (!KAKAO_API_KEY) {
    console.error("❌ Error: Missing VITE_KAKAO_REST_API_KEY");
    process.exit(1);
}

// Improved Geocoding Function
async function getCoordinatesSmart(item) {
    let address = item.address;
    const name = item.name;

    if (!address) return null;

    // Strategy 1: Clean Address (Remove facility name from address string)
    // Example: "Ulsan ... 10 Ulsan Yeongrakwon" -> "Ulsan ... 10"
    let cleanAddress = address.replace(name, '').trim();
    // Remove parentheses content if needed
    cleanAddress = cleanAddress.replace(/\(.*\)/gi, '').trim();

    try {
        // 1. Retry with Clean Address
        if (cleanAddress.length > 5) { // Minimum length check
            const addrResponse = await axios.get('https://dapi.kakao.com/v2/local/search/address.json', {
                headers: { Authorization: `KakaoAK ${KAKAO_API_KEY}` },
                params: { query: cleanAddress },
            });

            if (addrResponse.data.documents.length > 0) {
                console.log(`✅ [Success/Addr] Clean Address: ${name}`);
                const { y: lat, x: lng } = addrResponse.data.documents[0];
                return { lat: parseFloat(lat), lng: parseFloat(lng) };
            }
        }

        // 2. Strategy 2: Keyword Search (Region + Name)
        // Extract region (first 2 words)
        const region = cleanAddress.split(' ').slice(0, 2).join(' ');
        const query = `${region} ${name}`.trim();

        const keywordResponse = await axios.get('https://dapi.kakao.com/v2/local/search/keyword.json', {
            headers: { Authorization: `KakaoAK ${KAKAO_API_KEY}` },
            params: { query: query },
        });

        if (keywordResponse.data.documents.length > 0) {
            console.log(`✅ [Success/Keyword] Keyword: ${query}`);
            const { y: lat, x: lng } = keywordResponse.data.documents[0];
            return { lat: parseFloat(lat), lng: parseFloat(lng) };
        }

        // 3. Fallback: Search just the name (if unique enough)
        const nameQuery = name;
        const nameResponse = await axios.get('https://dapi.kakao.com/v2/local/search/keyword.json', {
            headers: { Authorization: `KakaoAK ${KAKAO_API_KEY}` },
            params: { query: nameQuery },
        });

        if (nameResponse.data.documents.length > 0) {
            console.log(`✅ [Success/Name] Name only: ${name}`);
            const { y: lat, x: lng } = nameResponse.data.documents[0];
            return { lat: parseFloat(lat), lng: parseFloat(lng) };
        }

        return null;

    } catch (error) {
        console.error(`Error processing ${name}:`, error.message);
        return null;
    }
}

async function run() {
    console.log("🚀 Starting Smart Geocoding via Kakao API...");

    // Fetch targets: NULL coordinates
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

    for (const [i, item] of targets.entries()) {
        const coords = await getCoordinatesSmart(item);

        if (coords) {
            const { error: updateErr } = await supabase
                .from('memorial_spaces')
                .update({ lat: coords.lat, lng: coords.lng })
                .eq('id', item.id);

            if (updateErr) {
                console.error(`❌ DB Update Failed: ${item.name}`, updateErr.message);
                failed++;
            } else {
                success++;
            }
        } else {
            console.log(`⚠️ Failed: ${item.name} (${item.address})`);
            failed++;
        }

        // Rate limit
        await new Promise(r => setTimeout(r, 100)); // 100ms
    }

    console.log("\n--- Summary ---");
    console.log(`Total: ${targets.length}`);
    console.log(`Success: ${success}`);
    console.log(`Failed: ${failed}`);
}

run();
