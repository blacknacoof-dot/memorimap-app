const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { parse } = require('csv-parse/sync');

const supabaseUrl = 'https://xvmpvzldezpoxxsarizm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2bXB2emxkZXpwb3h4c2FyaXptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NTEwMTksImV4cCI6MjA4MTQyNzAxOX0.TC-SJKzTRANjoLiRi2yg_EHu6xLer2wr-RaJ4AWIv04';

const supabase = createClient(supabaseUrl, supabaseKey);

const CSV_FILE = 'facility_status_final_updated.csv';

function mapType(koreanType) {
    if (!koreanType) return 'charnel';
    const t = koreanType.trim();
    if (t.includes('장례식장')) return 'funeral';
    if (t.includes('봉안') || t.includes('납골')) return 'charnel';
    if (t.includes('수목') || t.includes('자연') || t.includes('산림')) return 'natural';
    if (t.includes('공원') || t.includes('묘지')) return 'park';
    if (t.includes('해양')) return 'sea';
    if (t.includes('동물')) return 'pet';
    return 'charnel';
}

async function run() {
    try {
        console.log("Reading CSV...");
        const filePath = path.join(__dirname, '..', CSV_FILE);
        const fileContent = fs.readFileSync(filePath, 'utf8');

        // Detect if header exists (simplistic check)
        const records = parse(fileContent, {
            columns: true, // Assume header exists based on user info
            skip_empty_lines: true,
            relax_column_count: true,
            relax_quotes: true,
            ltrim: true,
            rtrim: true
        });

        console.log(`CSV Records found: ${records.length}`);

        // 1. Fetch existing names to avoid duplicates
        console.log("Fetching existing DB records...");
        const { data: existingData, error } = await supabase
            .from('memorial_spaces')
            .select('name');

        if (error) throw error;

        const existingNames = new Set(existingData.map(r => r.name));
        console.log(`Existing DB records: ${existingNames.size}`);

        const newRecords = [];

        for (const row of records) {
            // Flexible column matching
            const name = row['name'] || row['시설명'] || row['업체명'] || row['상호명'];
            const address = row['address'] || row['주소'] || row['도로명주소'] || row['지번주소'];
            const typeRaw = row['type'] || row['시설유형'] || row['업종'] || row['시설구분'] || row['category'];
            const phone = row['phone'] || row['전화번호'] || row['연락처'];

            if (!name) continue;

            if (existingNames.has(name)) {
                continue; // Skip existing
            }

            // Add unique suffix to name just in case of duplicate names in CSV itself? 
            // Better: use Set for newRecords too.
            // For now, assume CSV is unique enough or existing check covers it.

            newRecords.push({
                name: name,
                address: address || '주소 미상',
                type: mapType(typeRaw),
                phone: phone || '',
                religion: 'none',
                lat: 37.5665, // Temp default
                lng: 126.9780, // Temp default
                is_verified: true,
                data_source: 'csv_restore'
            });

            existingNames.add(name); // Prevent dups within CSV batch
        }

        console.log(`New records to insert: ${newRecords.length}`);

        if (newRecords.length === 0) {
            console.log("No new records to insert.");
            return;
        }

        // 2. Insert in batches
        const BATCH_SIZE = 100;
        let inserted = 0;

        for (let i = 0; i < newRecords.length; i += BATCH_SIZE) {
            const batch = newRecords.slice(i, i + BATCH_SIZE);
            const { error: insertError } = await supabase
                .from('memorial_spaces')
                .insert(batch);

            if (insertError) {
                console.error(`Error inserting batch ${i}:`, insertError);
            } else {
                inserted += batch.length;
                console.log(`Inserted ${inserted} / ${newRecords.length}`);
            }
        }

        console.log("Import completed.");

    } catch (e) {
        console.error("Script failed:", e);
    }
}

run();
