const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xvmpvzldezpoxxsarizm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2bXB2emxkZXpwb3h4c2FyaXptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NTEwMTksImV4cCI6MjA4MTQyNzAxOX0.TC-SJKzTRANjoLiRi2yg_EHu6xLer2wr-RaJ4AWIv04';

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeCoords() {
    console.log("Analyzing coordinate clusters...");

    let allData = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
        const { data: pageData, error } = await supabase
            .from('memorial_spaces')
            .select('lat, lng')
            .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) {
            console.error('Error fetching coords:', error);
            break;
        }

        if (pageData && pageData.length > 0) {
            allData = allData.concat(pageData);
            if (pageData.length < pageSize) hasMore = false;
            page++;
        } else {
            hasMore = false;
        }
    }

    const data = allData;

    const coordMap = new Map();
    let validCount = 0;
    let invalidCount = 0; // null or 0

    data.forEach(item => {
        if (!item.lat || !item.lng || (item.lat === 0 && item.lng === 0)) {
            invalidCount++;
            return;
        }
        // Create a key for the coordinate pair
        // Rounding to 4 decimal places (~11m precision) to catch near-duplicates?
        // Or exact match for defaults. Let's start with exact match.
        const key = `${item.lat},${item.lng}`;
        coordMap.set(key, (coordMap.get(key) || 0) + 1);
        validCount++;
    });

    console.log(`Total records: ${data.length}`);
    console.log(`Invalid/Null/Zero coords: ${invalidCount}`);
    console.log(`Valid coords: ${validCount}`);

    console.log("\n--- Top Coordinate Clusters (Potential Defaults) ---");
    const sortedClusters = [...coordMap.entries()]
        .filter(([key, count]) => count > 3) // Show clusters with more than 3 items
        .sort((a, b) => b[1] - a[1]);

    if (sortedClusters.length === 0) {
        console.log("No significant clusters found (>3 items at same location).");
    } else {
        console.table(sortedClusters.map(([coords, count]) => ({ coords, count })));
    }
}

analyzeCoords();
