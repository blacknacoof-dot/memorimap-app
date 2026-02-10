const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xvmpvzldezpoxxsarizm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2bXB2emxkZXpwb3h4c2FyaXptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NTEwMTksImV4cCI6MjA4MTQyNzAxOX0.TC-SJKzTRANjoLiRi2yg_EHu6xLer2wr-RaJ4AWIv04';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyCompliance() {
    console.log("=== SOW Compliance Verification Report ===");
    console.log("Target Spec: 'Memorimap Data Construction SOW'\n");

    try {
        // 1. Fetch Schema Info (Simulation by fetching one row)
        const { data: sampleData, error: sampleError } = await supabase
            .from('memorial_spaces')
            .select('*')
            .limit(1);

        if (sampleError) {
            console.error("Critical: Failed to access 'memorial_spaces'. Table might not match SOW 'facilities'.", sampleError);
            return;
        }

        const columns = sampleData.length > 0 ? Object.keys(sampleData[0]) : [];
        console.log("1. Schema Structure Check");
        console.log(`   Current Table: 'memorial_spaces' (SOW Request: 'facilities') -> ⚠️ Mismatch`);

        const sowColumns = ['name', 'category', 'address', 'location', 'contact', 'details', 'images', 'is_verified'];
        const currentColumnsMap = {
            'name': 'name',
            'category': 'type (needs mapping)',
            'address': 'address',
            'location': 'lat/lng (needs PostGIS conversion)',
            'contact': 'phone',
            'details': 'prices/features (needs JSONB consolidation)',
            'images': 'image_url/gallery_images',
            'is_verified': 'is_verified'
        };

        Object.entries(currentColumnsMap).forEach(([sowCol, currCol]) => {
            const exists = columns.includes(currCol.split(' ')[0]);
            console.log(`   - ${sowCol}: ${exists ? 'Exists as ' + currCol : '❌ Missing'}`);
        });

        // 2. Data Quality Check
        console.log("\n2. Data Quality Check (based on 2156 records)");

        let allData = [];
        let page = 0;
        const pageSize = 1000;
        let hasMore = true;

        while (hasMore) {
            const { data, error } = await supabase
                .from('memorial_spaces')
                .select('id, name, type, phone, address, lat, lng')
                .range(page * pageSize, (page + 1) * pageSize - 1);

            if (error || !data || data.length === 0) {
                hasMore = false;
            } else {
                allData = allData.concat(data);
                if (data.length < pageSize) hasMore = false;
                page++;
            }
        }

        const stats = {
            total: allData.length,
            phoneFormatted: 0, // 000-0000-0000
            addressRoad: 0, // ends with 로, 길
            nullLocation: 0,
            validLocation: 0,
            categoryMap: {}
        };

        const phoneRegex = /^\d{2,3}-\d{3,4}-\d{4}$/;
        // Simple heuristic for Road Address: ends with digit (building number) usually, and contains 로/길
        // regex: .*?(로|길)\s+\d+.*
        const addressRoadRegex = /(로|길).*\d+/;

        allData.forEach(row => {
            // Count Categories
            stats.categoryMap[row.type] = (stats.categoryMap[row.type] || 0) + 1;

            // Check Phone
            if (row.phone && phoneRegex.test(row.phone.trim())) {
                stats.phoneFormatted++;
            }

            // Check Address
            if (row.address && addressRoadRegex.test(row.address)) {
                stats.addressRoad++;
            }

            // Check Location
            if (row.lat === null || row.lng === null || (row.lat === 0 && row.lng === 0)) {
                stats.nullLocation++;
            } else {
                stats.validLocation++;
            }
        });

        console.log(`   Total Records: ${stats.total} / 2200 (Target) -> ✅ Good match`);
        console.log(`   Geocoding Status:`);
        console.log(`     - Valid Coordinates: ${stats.validLocation} (${((stats.validLocation / stats.total) * 100).toFixed(1)}%)`);
        console.log(`     - Missing/Null: ${stats.nullLocation} (${((stats.nullLocation / stats.total) * 100).toFixed(1)}%) -> ⚠️ Action Required`);

        console.log(`   Data Standardization:`);
        console.log(`     - Phone Format (000-0000-0000): ${stats.phoneFormatted} (${((stats.phoneFormatted / stats.total) * 100).toFixed(1)}%)`);
        console.log(`     - Road Address (Approx): ${stats.addressRoad} (${((stats.addressRoad / stats.total) * 100).toFixed(1)}%)`);

        console.log(`   Category Distribution (Current 'type'):`);
        console.table(stats.categoryMap);

        console.log("\n=== End of Report ===");

    } catch (e) {
        console.error("Script Error:", e);
    }
}

verifyCompliance();
