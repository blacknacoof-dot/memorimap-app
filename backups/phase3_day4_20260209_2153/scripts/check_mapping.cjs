const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function findMatches() {
    console.log('--- Mapping Check Start ---');

    // 1. Fetch all funeral_companies
    const { data: fcData, error: fcError } = await supabase
        .from('funeral_companies')
        .select('id, name');

    if (fcError) throw fcError;

    // 2. Fetch all facilities with type='상조'
    const { data: facData, error: facError } = await supabase
        .from('facilities')
        .select('id, name')
        .eq('type', '상조');

    if (facError) throw facError;

    console.log(`Total Funeral Companies: ${fcData.length}`);
    console.log(`Total Sangjo Facilities: ${facData.length}`);

    const matches = [];
    const missing = [];

    fcData.forEach(fc => {
        // Try exact match or fuzzy match
        const match = facData.find(fac =>
            fac.name.includes(fc.name) || fc.name.includes(fac.name)
        );

        if (match) {
            matches.push({
                legacy_id: fc.id,
                name: fc.name,
                new_id: match.id,
                fac_name: match.name
            });
        } else {
            missing.push(fc.name);
        }
    });

    console.log(`Matches found: ${matches.length}`);
    console.log(`Missing matches: ${missing.length}`);
    if (missing.length > 0) {
        console.log('Missing names:', missing);
    }

    console.log('\n--- Match Samples ---');
    console.log(JSON.stringify(matches.slice(0, 5), null, 2));

    console.log('--- Mapping Check End ---');
}

findMatches();
